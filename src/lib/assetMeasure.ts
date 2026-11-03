// Measures a delivered asset: bytes on the wire, TTFB, container and codec.
//
// Browsers deliberately prevent reading cross-origin response sizes, so how
// much we can learn depends on the headers the host sends:
//
//   fetch    - host sends Access-Control-Allow-Origin. Exact bytes, headers
//              and magic-byte codec detection. Full fidelity.
//   timing   - host sends Timing-Allow-Origin but not CORS. Transfer size and
//              TTFB from Resource Timing, but no body, so no codec.
//   element  - neither header. Only wall-clock load time and, for images,
//              intrinsic dimensions.
//   proxy    - routed through a configured proxy, which restores full fidelity
//              for hosts that send neither header.
//
// Every measurement records which method produced it so the UI can show what
// is a hard number and what is a floor.

export type MeasureMethod = 'fetch' | 'proxy' | 'timing' | 'element' | 'failed'

export interface AssetMeasurement {
  url: string
  ok: boolean
  method: MeasureMethod
  /** Decoded/encoded body size in bytes, when knowable. */
  bytes?: number
  /** Wire bytes including headers, from Resource Timing. */
  transferBytes?: number
  ttfbMs?: number
  totalMs?: number
  contentType?: string
  container?: string
  codec?: string
  width?: number
  height?: number
  status?: number
  error?: string
  /** Why a number is missing or approximate. */
  note?: string
}

const PROXY = import.meta.env.VITE_MEASURE_PROXY || ''
const SNIFF_BYTES = 131072

// fetch() defaults to `Accept: */*`, which suppresses content negotiation —
// Cloudinary's f_auto would fall back to JPEG instead of serving AVIF, making
// an optimiser look far worse than it is. Sending Chrome's image Accept header
// measures every provider under the same realistic conditions. These values
// are CORS-safelisted, so no preflight is triggered.
const BROWSER_ACCEPT = 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8'

// Decoded rather than spread through String.fromCharCode: spreading a
// 128 KB slice exceeds the argument limit and throws RangeError, which would
// silently knock every MP4 out of codec detection. subarray also clamps, so
// short buffers are safe.
const LATIN1 = new TextDecoder('latin1')
const ascii = (b: Uint8Array, o: number, n: number) => LATIN1.decode(b.subarray(o, o + n))

const VIDEO_FOURCC: Record<string, string> = {
  avc1: 'H.264 / AVC', avcC: 'H.264 / AVC', hvc1: 'HEVC / H.265', hev1: 'HEVC / H.265',
  av01: 'AV1', vp09: 'VP9', vp08: 'VP8', mp4v: 'MPEG-4 Part 2',
}
const WEBM_CODECS: Record<string, string> = {
  V_VP9: 'VP9', V_VP8: 'VP8', V_AV1: 'AV1', 'V_MPEG4/ISO/AVC': 'H.264 / AVC',
}

/** Identifies container and codec from the leading bytes of the payload. */
export function sniff(buf: Uint8Array): { container?: string; codec?: string } {
  if (buf.length < 12) return {}

  // JPEG
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return { container: 'JPEG', codec: 'JPEG' }
  // PNG
  if (buf[0] === 0x89 && ascii(buf, 1, 3) === 'PNG') return { container: 'PNG', codec: 'PNG' }
  // GIF
  if (ascii(buf, 0, 4) === 'GIF8') return { container: 'GIF', codec: 'GIF' }
  // JPEG XL (codestream)
  if (buf[0] === 0xff && buf[1] === 0x0a) return { container: 'JPEG XL', codec: 'JPEG XL' }
  // RIFF/WebP — needs 16 bytes to read the sub-chunk type.
  if (buf.length >= 16 && ascii(buf, 0, 4) === 'RIFF' && ascii(buf, 8, 4) === 'WEBP') {
    const sub = ascii(buf, 12, 4)
    return { container: 'WebP', codec: sub === 'VP8L' ? 'WebP lossless' : sub === 'VP8X' ? 'WebP extended' : 'WebP (VP8)' }
  }
  // Matroska / WebM
  if (buf[0] === 0x1a && buf[1] === 0x45 && buf[2] === 0xdf && buf[3] === 0xa3) {
    const text = ascii(buf, 0, Math.min(buf.length, 4096))
    const container = text.includes('webm') ? 'WebM' : 'Matroska'
    const codec = Object.keys(WEBM_CODECS).find(k => text.includes(k))
    return { container, codec: codec ? WEBM_CODECS[codec] : undefined }
  }
  // ISO BMFF family: MP4, MOV, AVIF, HEIF
  if (ascii(buf, 4, 4) === 'ftyp') {
    const brand = ascii(buf, 8, 4).trim()
    const head = ascii(buf, 0, Math.min(buf.length, SNIFF_BYTES))
    if (brand === 'avif' || brand === 'avis') return { container: 'AVIF', codec: 'AV1 (image)' }
    if (['heic', 'heix', 'mif1', 'heim'].includes(brand)) return { container: 'HEIF', codec: 'HEVC (image)' }
    if (brand === 'jxl') return { container: 'JPEG XL', codec: 'JPEG XL' }
    const container = brand === 'qt' ? 'MOV' : 'MP4'
    const fourcc = Object.keys(VIDEO_FOURCC).find(c => head.includes(c))
    return { container, codec: fourcc ? VIDEO_FOURCC[fourcc] : undefined }
  }
  return {}
}

/** Resource Timing entry for a URL, when the host allows it. */
function timingFor(url: string): PerformanceResourceTiming | undefined {
  const entries = performance.getEntriesByName(url) as PerformanceResourceTiming[]
  return entries.length ? entries[entries.length - 1] : undefined
}

/** Reads a bounded prefix of the body and reports total size where known. */
async function readBounded(res: Response): Promise<{ prefix: Uint8Array; read: number }> {
  const chunks: Uint8Array[] = []
  let read = 0
  const reader = res.body?.getReader()
  if (!reader) {
    const buf = new Uint8Array(await res.arrayBuffer())
    return { prefix: buf.slice(0, SNIFF_BYTES), read: buf.length }
  }
  for (;;) {
    const { done, value } = await reader.read()
    if (done) break
    read += value.length
    if (chunks.reduce((s, c) => s + c.length, 0) < SNIFF_BYTES) chunks.push(value)
  }
  const prefix = new Uint8Array(Math.min(read, SNIFF_BYTES))
  let off = 0
  for (const c of chunks) {
    if (off >= prefix.length) break
    prefix.set(c.slice(0, prefix.length - off), off)
    off += c.length
  }
  return { prefix, read }
}

async function viaFetch(url: string, method: 'fetch' | 'proxy'): Promise<AssetMeasurement> {
  const target = method === 'proxy' ? `${PROXY}${encodeURIComponent(url)}` : url
  const t0 = performance.now()
  const res = await fetch(target, { cache: 'no-store', headers: { Accept: BROWSER_ACCEPT } })
  const ttfbApprox = performance.now() - t0
  if (!res.ok) {
    // Report as failed, not as a successful measurement with blank numbers —
    // e.g. Cloudinary fetch delivery returns 401 for assets the cloud has not
    // been authorised to pull.
    return {
      url, ok: false, method: 'failed', status: res.status,
      error: `HTTP ${res.status}${res.status === 401 ? ' — this Cloudinary cloud is not authorised to fetch that origin' : ''}`,
    }
  }
  const { prefix, read } = await readBounded(res)
  const totalMs = performance.now() - t0

  const cl = Number(res.headers.get('content-length') || 0)
  const bytes = cl > 0 ? cl : read
  const t = timingFor(target)
  const { container, codec } = sniff(prefix)

  return {
    url, ok: true, method,
    bytes,
    transferBytes: t?.transferSize || undefined,
    // Resource Timing gives a true TTFB when exposed; otherwise the time to
    // the first readable chunk, which also includes connection setup.
    ttfbMs: t && t.responseStart ? +(t.responseStart - t.requestStart).toFixed(1) : +ttfbApprox.toFixed(1),
    totalMs: +totalMs.toFixed(1),
    contentType: res.headers.get('content-type') || undefined,
    container, codec,
    status: res.status,
    note: t && t.responseStart ? undefined : 'TTFB includes connection setup',
  }
}

/** No CORS: try Resource Timing, which needs Timing-Allow-Origin. */
async function viaTiming(url: string): Promise<AssetMeasurement | null> {
  const bust = url + (url.includes('?') ? '&' : '?') + '_m=' + Math.random().toString(36).slice(2)
  try {
    await fetch(bust, { mode: 'no-cors', cache: 'no-store' })
  } catch {
    return null
  }
  await new Promise(r => setTimeout(r, 250))
  const t = timingFor(bust)
  if (!t || !t.encodedBodySize) return null
  return {
    url, ok: true, method: 'timing',
    bytes: t.encodedBodySize,
    transferBytes: t.transferSize,
    ttfbMs: +(t.responseStart - t.requestStart).toFixed(1),
    totalMs: +t.duration.toFixed(1),
    note: 'Sizes from Resource Timing; body not readable, so codec is unavailable.',
  }
}

/** Last resort: load as an image for timing and intrinsic dimensions. */
async function viaElement(url: string): Promise<AssetMeasurement> {
  const bust = url + (url.includes('?') ? '&' : '?') + '_m=' + Math.random().toString(36).slice(2)
  const t0 = performance.now()
  const r = await new Promise<{ w: number; h: number } | null>(resolve => {
    const img = new Image()
    img.onload = () => resolve({ w: img.naturalWidth, h: img.naturalHeight })
    img.onerror = () => resolve(null)
    img.src = bust
  })
  const totalMs = +(performance.now() - t0).toFixed(1)
  if (!r) {
    return { url, ok: false, method: 'failed', error: 'Blocked by CORS and could not be loaded as an image.' }
  }
  return {
    url, ok: true, method: 'element', totalMs, width: r.w, height: r.h,
    note: 'Host sends neither CORS nor Timing-Allow-Origin, so size and codec cannot be read from a browser.',
  }
}

/** Measures one asset, degrading gracefully as headers allow. */
export async function measureAsset(url: string): Promise<AssetMeasurement> {
  if (!url || !/^https?:\/\//i.test(url)) {
    return { url, ok: false, method: 'failed', error: 'Not a valid http(s) URL' }
  }
  try {
    return await viaFetch(url, 'fetch')
  } catch { /* fall through */ }

  if (PROXY) {
    try {
      return await viaFetch(url, 'proxy')
    } catch { /* fall through */ }
  }

  const timed = await viaTiming(url)
  if (timed) return timed
  return viaElement(url)
}

/** Runs measurements with bounded concurrency. */
export async function measureAll<T>(
  items: T[],
  fn: (item: T, index: number) => Promise<void>,
  concurrency = 4,
): Promise<void> {
  let cursor = 0
  const workers = Array.from({ length: Math.min(concurrency, items.length) }, async () => {
    for (;;) {
      const i = cursor++
      if (i >= items.length) return
      await fn(items[i], i)
    }
  })
  await Promise.all(workers)
}

export function isVideoUrl(url: string, contentType?: string): boolean {
  if (contentType?.startsWith('video/')) return true
  return /\.(mp4|mov|webm|m4v|mkv|avi|m3u8|mpd)(\?|$)/i.test(url)
}

/** Builds the Cloudinary fetch-delivery URL for an origin asset. */
export function cloudinaryFetchUrl(
  originUrl: string,
  cloudName: string,
  transformation: string,
  video: boolean,
): string {
  const kind = video ? 'video' : 'image'
  return `https://res.cloudinary.com/${cloudName}/${kind}/fetch/${transformation}/${encodeURIComponent(originUrl)}`
}

export const measureProxyConfigured = Boolean(PROXY)

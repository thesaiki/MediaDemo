import { compareFrames, pool } from './videoQuality'
import type { Pooled } from './videoQuality'

// Runs a real encode ladder entirely in the browser using WebCodecs: source
// frames are captured from the <video>, encoded at each target bitrate,
// decoded back, and compared against the originals. Nothing is uploaded.
//
// Because we encode and decode the frames ourselves, source and distorted
// frames are paired by index — there is no frame-alignment ambiguity here,
// unlike comparing two independently produced files.

export interface LadderRung {
  label: string
  bitrateKbps: number
}

export interface RungResult extends LadderRung {
  bytes: number
  psnr: Pooled
  ssim: Pooled
  framesCompared: number
}

export interface CaptureResult {
  bitmaps: ImageBitmap[]
  width: number
  height: number
  fps: number
}

export interface WebCodecsSupport {
  supported: boolean
  reason?: string
  codec?: string
}

const CODEC_CANDIDATES = ['avc1.4d001f', 'avc1.42001f', 'vp8']

export async function detectSupport(width = 640, height = 360): Promise<WebCodecsSupport> {
  if (typeof window === 'undefined' || !('VideoEncoder' in window) || !('VideoDecoder' in window)) {
    return { supported: false, reason: 'This browser does not support the WebCodecs API. Try Chrome or Edge.' }
  }
  for (const codec of CODEC_CANDIDATES) {
    try {
      const s = await VideoEncoder.isConfigSupported({ codec, width, height, bitrate: 800_000, framerate: 30 })
      if (s.supported) return { supported: true, codec }
    } catch { /* try next */ }
  }
  return { supported: false, reason: 'No supported hardware or software video encoder was found in this browser.' }
}

/** Even dimensions, capped on the long edge — encoders reject odd sizes. */
export function analysisSize(w: number, h: number, maxEdge = 640): { width: number; height: number } {
  const scale = Math.min(1, maxEdge / Math.max(w, h))
  const even = (n: number) => Math.max(2, Math.round(n * scale / 2) * 2)
  return { width: even(w), height: even(h) }
}

const seek = (v: HTMLVideoElement, t: number) =>
  new Promise<void>(resolve => {
    const done = () => { v.removeEventListener('seeked', done); resolve() }
    v.addEventListener('seeked', done)
    v.currentTime = Math.max(0, Math.min(t, (v.duration || t) - 0.001))
  })

/**
 * Captures a contiguous run of frames starting partway into the video, so rate
 * control sees a realistic sequence rather than scattered stills.
 */
export async function captureFrames(
  video: HTMLVideoElement,
  frameCount: number,
  onProgress?: (pct: number) => void,
): Promise<CaptureResult> {
  const { width, height } = analysisSize(video.videoWidth, video.videoHeight)
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d', { willReadFrequently: true })
  if (!ctx) throw new Error('Could not create a 2D context for frame capture.')

  const fps = 30
  const step = 1 / fps
  const start = Math.min((video.duration || 0) * 0.1, Math.max(0, (video.duration || 0) - frameCount * step))

  video.pause()
  const bitmaps: ImageBitmap[] = []
  for (let i = 0; i < frameCount; i++) {
    const t = start + i * step
    if (video.duration && t >= video.duration) break
    await seek(video, t)
    ctx.drawImage(video, 0, 0, width, height)
    bitmaps.push(await createImageBitmap(canvas))
    onProgress?.(Math.round(((i + 1) / frameCount) * 100))
  }
  if (!bitmaps.length) throw new Error('No frames could be captured from this video.')
  return { bitmaps, width, height, fps }
}

/** Encodes the captured frames at one bitrate and returns the coded chunks. */
async function encodeRung(
  capture: CaptureResult,
  bitrateKbps: number,
  codec: string,
): Promise<{ chunks: EncodedVideoChunk[]; config: VideoDecoderConfig; bytes: number }> {
  const { bitmaps, width, height, fps } = capture
  const chunks: EncodedVideoChunk[] = []
  let bytes = 0
  let decoderConfig: VideoDecoderConfig | null = null

  const encoder = new VideoEncoder({
    output: (chunk, meta) => {
      if (meta?.decoderConfig && !decoderConfig) decoderConfig = meta.decoderConfig
      chunks.push(chunk)
      bytes += chunk.byteLength
    },
    error: e => { throw e },
  })

  encoder.configure({
    codec,
    width,
    height,
    bitrate: bitrateKbps * 1000,
    framerate: fps,
    latencyMode: 'quality',
  })

  for (let i = 0; i < bitmaps.length; i++) {
    const frame = new VideoFrame(bitmaps[i], { timestamp: Math.round((i * 1e6) / fps) })
    encoder.encode(frame, { keyFrame: i === 0 })
    frame.close()
    // Let the encoder drain so the queue does not balloon on long ladders.
    if (encoder.encodeQueueSize > 8) {
      await new Promise(r => setTimeout(r, 0))
    }
  }
  await encoder.flush()
  encoder.close()

  if (!decoderConfig) throw new Error('The encoder did not produce a decoder configuration.')
  return { chunks, config: decoderConfig, bytes }
}

/** Decodes coded chunks back to frames, in order. */
async function decodeRung(
  chunks: EncodedVideoChunk[],
  config: VideoDecoderConfig,
): Promise<VideoFrame[]> {
  const frames: VideoFrame[] = []
  const decoder = new VideoDecoder({
    output: f => frames.push(f),
    error: e => { throw e },
  })
  decoder.configure(config)
  for (const c of chunks) decoder.decode(c)
  await decoder.flush()
  decoder.close()
  return frames
}

/** Encodes, decodes and measures a single rung against the captured source. */
export async function runRung(
  capture: CaptureResult,
  rung: LadderRung,
  codec: string,
): Promise<RungResult> {
  const { bitmaps, width, height } = capture
  const { chunks, config, bytes } = await encodeRung(capture, rung.bitrateKbps, codec)
  const decoded = await decodeRung(chunks, config)

  const srcCanvas = document.createElement('canvas')
  const dstCanvas = document.createElement('canvas')
  srcCanvas.width = dstCanvas.width = width
  srcCanvas.height = dstCanvas.height = height
  const sctx = srcCanvas.getContext('2d', { willReadFrequently: true })
  const dctx = dstCanvas.getContext('2d', { willReadFrequently: true })
  if (!sctx || !dctx) throw new Error('Could not create a 2D context for measurement.')

  const psnrs: number[] = []
  const ssims: number[] = []
  const n = Math.min(bitmaps.length, decoded.length)
  for (let i = 0; i < n; i++) {
    sctx.drawImage(bitmaps[i], 0, 0, width, height)
    dctx.drawImage(decoded[i], 0, 0, width, height)
    const m = compareFrames(
      sctx.getImageData(0, 0, width, height).data,
      dctx.getImageData(0, 0, width, height).data,
      width,
      height,
    )
    psnrs.push(m.psnr)
    ssims.push(m.ssim)
  }
  decoded.forEach(f => f.close())

  return {
    ...rung,
    bytes,
    psnr: pool(psnrs),
    ssim: pool(ssims),
    framesCompared: n,
  }
}

/** Default ladder, scaled to the analysis resolution and frame rate. */
export function defaultLadder(width: number, height: number, fps: number): LadderRung[] {
  // ~0.1 bits per pixel per frame is a reasonable "good quality" anchor for H.264.
  const anchor = (width * height * fps * 0.1) / 1000
  const round = (v: number) => Math.max(80, Math.round(v / 10) * 10)
  return [
    { label: 'Aggressive', bitrateKbps: round(anchor * 0.25) },
    { label: 'Low', bitrateKbps: round(anchor * 0.5) },
    { label: 'Balanced', bitrateKbps: round(anchor) },
    { label: 'High', bitrateKbps: round(anchor * 2) },
  ]
}

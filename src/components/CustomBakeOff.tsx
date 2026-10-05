import { useState, useRef, useEffect } from 'react'
import {
  detectSupport, analysisSize, captureFrames, runRung, defaultLadder,
} from '../lib/encodeLadder'
import type { CaptureResult, LadderRung, RungResult, WebCodecsSupport } from '../lib/encodeLadder'
import {
  ssimVerdict, pickRecommendation, reportToMarkdown, download, fmtBytes,
} from '../lib/report'
import type { BakeOffReport, BakeOffRow } from '../lib/report'

const FRAME_COUNT = 36
const SSIM_TARGET = 0.95

type Phase = 'idle' | 'capturing' | 'encoding' | 'done'

export default function CustomBakeOff() {
  const [support, setSupport] = useState<WebCodecsSupport | null>(null)
  const [file, setFile] = useState<File | null>(null)
  const [srcUrl, setSrcUrl] = useState('')
  const [meta, setMeta] = useState<{ w: number; h: number; dur: number } | null>(null)
  const [ladder, setLadder] = useState<LadderRung[]>([])
  const [phase, setPhase] = useState<Phase>('idle')
  const [progress, setProgress] = useState(0)
  const [status, setStatus] = useState('')
  const [results, setResults] = useState<RungResult[]>([])
  const [error, setError] = useState('')
  const [dragging, setDragging] = useState(false)

  const videoRef = useRef<HTMLVideoElement>(null)
  const captureRef = useRef<CaptureResult | null>(null)

  useEffect(() => { detectSupport().then(setSupport) }, [])
  useEffect(() => () => { if (srcUrl) URL.revokeObjectURL(srcUrl) }, [srcUrl])

  function reset() {
    setResults([]); setPhase('idle'); setProgress(0); setStatus(''); setError('')
    captureRef.current?.bitmaps.forEach(b => b.close())
    captureRef.current = null
  }

  function acceptFile(f: File) {
    if (!f.type.startsWith('video/')) {
      setError('That file is not a video. Pick an MP4, WebM or MOV.')
      return
    }
    reset()
    if (srcUrl) URL.revokeObjectURL(srcUrl)
    setFile(f)
    setSrcUrl(URL.createObjectURL(f))
    setMeta(null)
    setLadder([])
  }

  function onLoadedMetadata() {
    const v = videoRef.current
    if (!v) return
    const w = v.videoWidth, h = v.videoHeight
    setMeta({ w, h, dur: v.duration })
    const a = analysisSize(w, h)
    setLadder(defaultLadder(a.width, a.height, 30))
  }

  async function runBakeOff() {
    const v = videoRef.current
    if (!v || !support?.supported || !support.codec) return
    setError(''); setResults([]); setProgress(0)

    try {
      setPhase('capturing')
      setStatus(`Capturing ${FRAME_COUNT} frames`)
      const capture = await captureFrames(v, FRAME_COUNT, setProgress)
      captureRef.current = capture

      setPhase('encoding')
      const out: RungResult[] = []
      for (let i = 0; i < ladder.length; i++) {
        setStatus(`Encoding ${ladder[i].label} — ${ladder[i].bitrateKbps} kbps`)
        setProgress(Math.round((i / ladder.length) * 100))
        out.push(await runRung(capture, ladder[i], support.codec))
        setResults([...out])
      }
      setProgress(100)
      setStatus('')
      setPhase('done')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'The bake-off failed. Try a shorter or smaller video.')
      setPhase('idle')
    }
  }

  function buildReport(): BakeOffReport | null {
    if (!results.length || !meta || !captureRef.current) return null
    const cap = captureRef.current
    const rows: BakeOffRow[] = results.map(r => ({
      label: `${r.label} (${r.bitrateKbps} kbps)`,
      bitrateKbps: r.bitrateKbps,
      bytes: r.bytes,
      psnr: r.psnr,
      ssim: r.ssim,
    }))
    return {
      title: 'Video Quality Bake-Off',
      generatedAt: new Date().toISOString().slice(0, 19).replace('T', ' ') + ' UTC',
      source: {
        name: file?.name ?? 'uploaded video',
        width: cap.width, height: cap.height, fps: cap.fps,
        frames: results[0]?.framesCompared ?? cap.bitmaps.length,
        durationSec: meta.dur, bytes: file?.size,
        bitrateKbps: sourceBitrateKbps ?? undefined,
      },
      rows,
      ssimTarget: SSIM_TARGET,
      method:
        `Frames were captured from the source at ${cap.width}x${cap.height}, encoded in-browser with ` +
        `WebCodecs (${support?.codec}) at each target bitrate, decoded back, and compared against the ` +
        `original frames. PSNR and SSIM are computed on the BT.709 luma plane; SSIM uses 8x8 windows ` +
        `with unbiased variance. Source and distorted frames are paired by index, so no frame ` +
        `alignment is required. Nothing left the browser.`,
    }
  }

  // Renditions are only encoded for the analysed frames, so bitrate — not
  // absolute byte count — is the fair basis for comparing against the source.
  const sourceBitrateKbps =
    file && meta?.dur ? Math.round((file.size * 8) / meta.dur / 1000) : null

  const report = phase === 'done' ? buildReport() : null
  const rec = report ? pickRecommendation(report.rows, SSIM_TARGET) : null
  const maxRate = results.length ? Math.max(...results.map(r => r.bitrateKbps)) : 1
  const busy = phase === 'capturing' || phase === 'encoding'

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-5">
      <div>
        <h2 className="text-lg font-bold text-gray-800">Run a bake-off on your own video</h2>
        <p className="text-xs text-gray-500 mt-1 max-w-3xl">
          Load a video and it is encoded at several bitrates right here in the browser, then decoded
          and measured frame by frame against the original. Your file never leaves your machine —
          there is no upload and no server involved.
        </p>
      </div>

      {support && !support.supported && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-800">
          {support.reason}
        </div>
      )}

      {/* File picker */}
      <label
        onDragOver={e => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={e => {
          e.preventDefault(); setDragging(false)
          const f = e.dataTransfer.files?.[0]
          if (f) acceptFile(f)
        }}
        className={`block border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
          dragging ? 'border-[#3448C5] bg-blue-50' : 'border-gray-300 hover:border-gray-400'
        }`}
      >
        <input
          type="file" accept="video/*" className="hidden"
          onChange={e => { const f = e.target.files?.[0]; if (f) acceptFile(f) }}
        />
        <p className="text-sm font-medium text-gray-700">
          {file ? file.name : 'Drop a video here, or click to choose one'}
        </p>
        <p className="text-[11px] text-gray-400 mt-1">
          {file
            ? `${fmtBytes(file.size)}${meta ? ` · ${meta.w}x${meta.h} · ${meta.dur.toFixed(1)}s` : ''}`
            : 'MP4, WebM or MOV. A short clip is plenty — only a few dozen frames are analysed.'}
        </p>
      </label>

      {error && <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-xs text-red-700">{error}</div>}

      {srcUrl && (
        <div className="flex flex-col lg:flex-row gap-5">
          <div className="flex-1">
            <video
              ref={videoRef} src={srcUrl} onLoadedMetadata={onLoadedMetadata}
              controls muted playsInline
              className="w-full rounded-lg bg-black" style={{ maxHeight: 260 }}
            />
          </div>

          <div className="flex-1">
            <h3 className="font-semibold text-sm text-gray-800 mb-2">Bitrate ladder</h3>
            {ladder.length > 0 && (
              <div className="space-y-2 mb-3">
                {ladder.map((r, i) => (
                  <div key={r.label} className="flex items-center gap-3">
                    <span className="text-xs font-medium text-gray-700 w-20 shrink-0">{r.label}</span>
                    <input
                      type="range" min={60} max={Math.max(4000, r.bitrateKbps)} step={10}
                      value={r.bitrateKbps} disabled={busy}
                      onChange={e => {
                        const next = [...ladder]
                        next[i] = { ...r, bitrateKbps: Number(e.target.value) }
                        setLadder(next)
                      }}
                      className="flex-1 accent-[#3448C5]"
                    />
                    <span className="text-xs text-gray-600 w-20 text-right tabular-nums">{r.bitrateKbps} kbps</span>
                  </div>
                ))}
              </div>
            )}
            <button
              onClick={runBakeOff}
              disabled={busy || !support?.supported || !meta}
              className="w-full bg-[#3448C5] text-white px-5 py-2.5 rounded-lg text-sm font-semibold hover:bg-[#2a3a9e] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {busy ? `${status}…` : phase === 'done' ? 'Run again' : `Run bake-off (${ladder.length} renditions)`}
            </button>
            {busy && (
              <div className="mt-2">
                <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                  <div className="h-full bg-[#3448C5] transition-all" style={{ width: `${progress}%` }} />
                </div>
                <p className="text-[11px] text-gray-500 mt-1">{status} · {progress}%</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Results */}
      {results.length > 0 && (
        <div className="border-t border-gray-100 pt-5">
          <h3 className="font-semibold text-sm text-gray-800 mb-1">Results</h3>
          <p className="text-[11px] text-gray-500 mb-3">
            Encoded size covers the {results[0]?.framesCompared ?? FRAME_COUNT} frames analysed, not the whole clip
            {sourceBitrateKbps ? ` — compare against the source's ${sourceBitrateKbps} kbps on bitrate, not size` : ''}.
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-gray-800 text-white">
                  <th className="text-left px-3 py-2 font-semibold">Rendition</th>
                  <th className="px-3 py-2 font-semibold">Target</th>
                  <th className="px-3 py-2 font-semibold">Encoded ({results[0]?.framesCompared ?? FRAME_COUNT}f)</th>
                  <th className="px-3 py-2 font-semibold">PSNR-Y (dB)</th>
                  <th className="px-3 py-2 font-semibold">SSIM</th>
                  <th className="px-3 py-2 font-semibold">Verdict</th>
                </tr>
              </thead>
              <tbody>
                {results.map((r, i) => {
                  const v = ssimVerdict(r.ssim.mean, r.psnr.mean)
                  const isRec = rec && rec.bitrateKbps === r.bitrateKbps
                  return (
                    <tr key={r.label} className={isRec ? 'bg-blue-50' : i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="px-3 py-2 font-medium text-gray-800">
                        {r.label}{isRec && <span className="ml-2 text-[10px] text-[#3448C5] font-bold">RECOMMENDED</span>}
                      </td>
                      <td className="px-3 py-2 text-center text-gray-600">{r.bitrateKbps} kbps</td>
                      <td className="px-3 py-2 text-center text-gray-600">{fmtBytes(r.bytes)}</td>
                      <td className="px-3 py-2 text-center text-gray-600">{r.psnr.mean.toFixed(2)}</td>
                      <td className="px-3 py-2 text-center text-gray-600">{r.ssim.mean.toFixed(4)}</td>
                      <td className="px-3 py-2 text-center">
                        <span className={`px-2 py-0.5 rounded border font-semibold ${v.className}`}>{v.label}</span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Rate-distortion curve */}
          <svg viewBox="0 0 380 170" className="w-full max-w-xl mt-4">
            {[0.8, 0.85, 0.9, 0.95, 1].map(v => (
              <g key={v}>
                <line x1={44} y1={150 - (v - 0.8) * 600} x2={360} y2={150 - (v - 0.8) * 600} stroke="#e5e7eb" />
                <text x={38} y={153 - (v - 0.8) * 600} fontSize={7} fill="#9ca3af" textAnchor="end">{v.toFixed(2)}</text>
              </g>
            ))}
            <line x1={44} y1={30} x2={44} y2={150} stroke="#9ca3af" />
            <line x1={44} y1={150} x2={360} y2={150} stroke="#9ca3af" />
            <line x1={44} y1={150 - (SSIM_TARGET - 0.8) * 600} x2={360} y2={150 - (SSIM_TARGET - 0.8) * 600}
              stroke="#10b981" strokeDasharray="3 3" />
            <text x={48} y={150 - (SSIM_TARGET - 0.8) * 600 - 4} fontSize={7} fill="#10b981">SSIM {SSIM_TARGET} target</text>
            <polyline fill="none" stroke="#3448C5" strokeWidth={2}
              points={results.map(r => `${44 + (r.bitrateKbps / maxRate) * 300},${150 - (Math.max(0.8, Math.min(1, r.ssim.mean)) - 0.8) * 600}`).join(' ')} />
            {results.map(r => {
              const x = 44 + (r.bitrateKbps / maxRate) * 300
              const y = 150 - (Math.max(0.8, Math.min(1, r.ssim.mean)) - 0.8) * 600
              return (
                <g key={r.label}>
                  <circle cx={x} cy={y} r={4} fill="#fff" stroke="#3448C5" strokeWidth={2} />
                  <text x={x} y={y - 8} fontSize={7} fill="#4b5563" textAnchor="middle">{r.label}</text>
                </g>
              )
            })}
            <text x={200} y={166} fontSize={8} fill="#6b7280" textAnchor="middle">bitrate (kbps) →</text>
            <text x={12} y={90} fontSize={8} fill="#6b7280" textAnchor="middle" transform="rotate(-90 12 90)">SSIM</text>
          </svg>
        </div>
      )}

      {/* Report */}
      {report && (
        <div className="border-t border-gray-100 pt-5">
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <h3 className="font-semibold text-sm text-gray-800 flex-1">Report</h3>
            <button
              onClick={() => download(`bake-off-${Date.now()}.md`, reportToMarkdown(report), 'text/markdown')}
              className="px-3 py-1.5 rounded text-xs font-semibold bg-gray-800 text-white hover:bg-gray-900">
              Download Markdown
            </button>
            <button
              onClick={() => download(`bake-off-${Date.now()}.json`, JSON.stringify(report, null, 2), 'application/json')}
              className="px-3 py-1.5 rounded text-xs font-semibold bg-gray-100 text-gray-700 hover:bg-gray-200">
              Download JSON
            </button>
            <button
              onClick={() => navigator.clipboard?.writeText(reportToMarkdown(report))}
              className="px-3 py-1.5 rounded text-xs font-semibold bg-gray-100 text-gray-700 hover:bg-gray-200">
              Copy
            </button>
          </div>

          {rec ? (
            <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 mb-3">
              <p className="text-sm text-emerald-900">
                <strong>{rec.label}</strong> is the cheapest rendition that still clears the SSIM {SSIM_TARGET} floor —
                SSIM {rec.ssim.mean.toFixed(4)}, PSNR {rec.psnr.mean.toFixed(2)} dB
                {sourceBitrateKbps
                  ? ` — ${((1 - rec.bitrateKbps / sourceBitrateKbps) * 100).toFixed(1)}% lower bitrate than your source's ${sourceBitrateKbps} kbps`
                  : ''}.
              </p>
            </div>
          ) : (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-3 text-sm text-amber-900">
              No rendition reached the SSIM {SSIM_TARGET} floor. Raise the ladder and run again.
            </div>
          )}

          <pre className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-[11px] text-gray-700 overflow-x-auto max-h-80 overflow-y-auto whitespace-pre-wrap">
            {reportToMarkdown(report)}
          </pre>

          <p className="text-[11px] text-gray-400 mt-2">
            VMAF is not included here — it needs libvmaf, which cannot run in a browser. The ffmpeg
            command in the section above will produce VMAF for this source offline.
          </p>
        </div>
      )}
    </div>
  )
}

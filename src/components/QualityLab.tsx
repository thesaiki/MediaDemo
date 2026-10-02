import { useState, useRef, useEffect, useCallback } from 'react'
import dataset from '../data/vmafDataset.json'
import { compareFrames, differenceMap, pool, psnrBetween, vmafBand } from '../lib/videoQuality'
import type { FrameMetrics, Pooled } from '../lib/videoQuality'

type ViewMode = 'split' | 'side' | 'diff'

// Analysis resolution — both frames are scaled here before comparison, the
// same way VMAF scales the distorted input to the reference geometry.
const AW = 640
const AH = 360
// Encoders place frames differently, so the same timestamp in two renditions
// can decode to different frames. Metrics are meaningless until that offset is
// found and corrected, so we search ± this many frames for the best match.
const ALIGN_RANGE = 8

interface Rendition {
  id: string
  label: string
  transformation: string
  url: string
  bytes: number
  bitrateKbps: number
  metrics: Record<string, Pooled>
}

const REF = dataset.reference
const RENDITIONS = dataset.renditions as Rendition[]

const FFMPEG_CMD = `ffmpeg -i distorted.mp4 -i reference.mp4 -lavfi "\\
  [0:v]scale=854:480:flags=bicubic,setpts=PTS-STARTPTS[dist];\\
  [1:v]scale=854:480:flags=bicubic,setpts=PTS-STARTPTS[ref];\\
  [dist][ref]libvmaf=log_fmt=json:log_path=out.json:\\
    feature='name=psnr|name=float_ssim'" -f null -`

function fmtBytes(b: number) {
  return b > 1024 * 1024 ? `${(b / 1024 / 1024).toFixed(2)} MB` : `${Math.round(b / 1024)} KB`
}

export default function QualityLab() {
  const [selected, setSelected] = useState<Rendition>(RENDITIONS[1])
  const [view, setView] = useState<ViewMode>('split')
  const [wipe, setWipe] = useState(50)
  const [playing, setPlaying] = useState(false)
  const [time, setTime] = useState(0)
  const [frame, setFrame] = useState<FrameMetrics | null>(null)
  const [series, setSeries] = useState<{ psnr: Pooled; ssim: Pooled; samples: number } | null>(null)
  const [sampling, setSampling] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState('')
  const [offsetFrames, setOffsetFrames] = useState<number | null>(null)
  const [aligning, setAligning] = useState(false)

  const refVideo = useRef<HTMLVideoElement>(null)
  const testVideo = useRef<HTMLVideoElement>(null)
  const diffCanvas = useRef<HTMLCanvasElement>(null)
  const refCanvas = useRef<HTMLCanvasElement | null>(null)
  const testCanvas = useRef<HTMLCanvasElement | null>(null)

  // Offscreen canvases used for pixel readback.
  useEffect(() => {
    const mk = () => {
      const c = document.createElement('canvas')
      c.width = AW
      c.height = AH
      return c
    }
    refCanvas.current = mk()
    testCanvas.current = mk()
  }, [])

  // Reset measurements whenever the rendition under test changes.
  useEffect(() => {
    setFrame(null)
    setSeries(null)
    setError('')
    setOffsetFrames(null)
  }, [selected])

  const frameDur = 1 / REF.fps
  const offsetSec = (offsetFrames ?? 0) * frameDur

  const grab = useCallback((): { ref: ImageData; test: ImageData } | null => {
    const rv = refVideo.current
    const tv = testVideo.current
    const rc = refCanvas.current
    const tc = testCanvas.current
    if (!rv || !tv || !rc || !tc) return null
    if (rv.readyState < 2 || tv.readyState < 2) return null
    const rctx = rc.getContext('2d', { willReadFrequently: true })
    const tctx = tc.getContext('2d', { willReadFrequently: true })
    if (!rctx || !tctx) return null
    rctx.drawImage(rv, 0, 0, AW, AH)
    tctx.drawImage(tv, 0, 0, AW, AH)
    try {
      return { ref: rctx.getImageData(0, 0, AW, AH), test: tctx.getImageData(0, 0, AW, AH) }
    } catch {
      setError('Canvas is tainted — the video is being served without CORS headers, so pixels cannot be read.')
      return null
    }
  }, [])

  const seekTo = (v: HTMLVideoElement, t: number) =>
    new Promise<void>(resolve => {
      const done = () => { v.removeEventListener('seeked', done); resolve() }
      v.addEventListener('seeked', done)
      v.currentTime = Math.max(0, Math.min(t, v.duration || t))
    })

  /**
   * Finds the frame offset between reference and test by scanning candidate
   * offsets and keeping the one with the highest PSNR.
   */
  const align = useCallback(async (): Promise<number> => {
    const rv = refVideo.current, tv = testVideo.current
    const rc = refCanvas.current, tc = testCanvas.current
    if (!rv || !tv || !rc || !tc || !rv.duration) return 0

    setAligning(true)
    const wasPlaying = !rv.paused
    rv.pause(); tv.pause(); setPlaying(false)
    try {
      const probe = rv.duration * 0.4
      await seekTo(rv, probe)
      const rctx = rc.getContext('2d', { willReadFrequently: true })
      if (!rctx) return 0
      rctx.drawImage(rv, 0, 0, AW, AH)
      let refData: Uint8ClampedArray
      try {
        refData = rctx.getImageData(0, 0, AW, AH).data
      } catch {
        setError('Canvas is tainted — the video is being served without CORS headers, so pixels cannot be read.')
        return 0
      }

      const tctx = tc.getContext('2d', { willReadFrequently: true })
      if (!tctx) return 0
      let best = { psnr: -1, k: 0 }
      for (let k = -ALIGN_RANGE; k <= ALIGN_RANGE; k++) {
        await seekTo(tv, probe + k * frameDur)
        tctx.drawImage(tv, 0, 0, AW, AH)
        const p = psnrBetween(refData, tctx.getImageData(0, 0, AW, AH).data, AW * AH)
        if (p > best.psnr) best = { psnr: p, k }
      }
      setOffsetFrames(best.k)
      if (wasPlaying) { rv.play(); tv.play(); setPlaying(true) }
      return best.k
    } finally {
      setAligning(false)
    }
  }, [frameDur])

  const measureFrame = useCallback(async () => {
    const rv = refVideo.current, tv = testVideo.current
    if (!rv || !tv) return
    let k = offsetFrames
    if (k === null) k = await align()
    rv.pause(); tv.pause(); setPlaying(false)
    await seekTo(tv, rv.currentTime + k * frameDur)
    const g = grab()
    if (!g) return
    setFrame(compareFrames(g.ref.data, g.test.data, AW, AH))
  }, [grab, align, offsetFrames, frameDur])

  // Live difference view.
  useEffect(() => {
    if (view !== 'diff') return
    let raf = 0
    const draw = () => {
      const g = grab()
      const canvas = diffCanvas.current
      if (g && canvas) {
        const ctx = canvas.getContext('2d')
        if (ctx) {
          const out = ctx.createImageData(AW, AH)
          differenceMap(g.ref.data, g.test.data, out.data)
          ctx.putImageData(out, 0, 0)
        }
      }
      raf = requestAnimationFrame(draw)
    }
    raf = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(raf)
  }, [view, grab])

  function bothPlay() {
    const rv = refVideo.current, tv = testVideo.current
    if (!rv || !tv) return
    if (playing) {
      rv.pause(); tv.pause(); setPlaying(false)
    } else {
      tv.currentTime = rv.currentTime + offsetSec
      Promise.all([rv.play(), tv.play()]).then(() => setPlaying(true)).catch(() => {})
    }
  }

  function seekBoth(t: number) {
    const rv = refVideo.current, tv = testVideo.current
    if (!rv || !tv) return
    rv.currentTime = t
    tv.currentTime = t + offsetSec
    setTime(t)
  }

  /** Samples evenly spaced frames and pools the per-frame results. */
  async function sampleSeries(count = 12) {
    const rv = refVideo.current, tv = testVideo.current
    if (!rv || !tv || !rv.duration) return
    let k = offsetFrames
    if (k === null) k = await align()
    rv.pause(); tv.pause(); setPlaying(false)
    setSampling(true); setProgress(0); setError('')

    const psnrs: number[] = []
    const ssims: number[] = []
    try {
      for (let i = 0; i < count; i++) {
        const t = (rv.duration * (i + 0.5)) / count
        await Promise.all([seekTo(rv, t), seekTo(tv, t + k * frameDur)])
        const g = grab()
        if (!g) break
        const m = compareFrames(g.ref.data, g.test.data, AW, AH)
        psnrs.push(m.psnr)
        ssims.push(m.ssim)
        setProgress(Math.round(((i + 1) / count) * 100))
      }
      if (psnrs.length) {
        setSeries({ psnr: pool(psnrs), ssim: pool(ssims), samples: psnrs.length })
      }
    } finally {
      setSampling(false)
    }
  }

  const vmaf = selected.metrics.vmaf
  const band = vmafBand(vmaf.mean)

  // Rate-distortion curve geometry.
  const maxRate = Math.max(...RENDITIONS.map(r => r.bitrateKbps))
  const pts = RENDITIONS.map(r => ({
    x: 40 + (r.bitrateKbps / maxRate) * 300,
    y: 150 - (r.metrics.vmaf.mean / 100) * 120,
    r,
  }))

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-6">
      <div>
        <h2 className="text-lg font-bold text-gray-800">Video Quality Lab</h2>
        <p className="text-xs text-gray-500 mt-1 max-w-3xl">
          Perceptual quality measurement for delivery bake-offs. VMAF, ADM, VIF and motion scores
          below were computed offline with ffmpeg/libvmaf against the untransformed original; PSNR
          and SSIM are computed live in your browser from the decoded frames.
        </p>
      </div>

      {/* Rendition picker */}
      <div>
        <label className="text-xs font-semibold text-gray-700 block mb-2">
          Rendition under test <span className="font-normal text-gray-400">— reference is the untransformed original ({fmtBytes(REF.bytes)})</span>
        </label>
        <div className="flex flex-wrap gap-2">
          {RENDITIONS.map(r => (
            <button
              key={r.id}
              onClick={() => setSelected(r)}
              className={`px-3 py-2 rounded-lg text-xs font-semibold transition-colors ${
                selected.id === r.id ? 'bg-[#3448C5] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {r.transformation}
              <span className="block font-normal opacity-70 mt-0.5">
                {fmtBytes(r.bytes)} · VMAF {r.metrics.vmaf.mean.toFixed(1)}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Viewer */}
      <div>
        <div className="flex flex-wrap items-center gap-2 mb-3">
          {([['split', 'Split wipe'], ['side', 'Side by side'], ['diff', 'Difference']] as const).map(([m, label]) => (
            <button
              key={m}
              onClick={() => setView(m)}
              className={`px-3 py-1.5 rounded text-xs font-semibold transition-colors ${
                view === m ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {label}
            </button>
          ))}
          <div className="flex-1" />
          <button onClick={bothPlay} className="px-4 py-1.5 rounded text-xs font-semibold bg-[#3448C5] text-white hover:bg-[#2a3a9e]">
            {playing ? 'Pause' : 'Play both'}
          </button>
        </div>

        <div className="relative bg-black rounded-lg overflow-hidden" style={{ aspectRatio: '16 / 9' }}>
          {/* Reference */}
          <video
            ref={refVideo}
            src={REF.url}
            crossOrigin="anonymous"
            muted
            playsInline
            preload="auto"
            onTimeUpdate={e => setTime((e.target as HTMLVideoElement).currentTime)}
            onEnded={() => setPlaying(false)}
            className={`absolute inset-0 w-full h-full object-contain ${view === 'diff' ? 'invisible' : ''} ${view === 'side' ? 'w-1/2' : ''}`}
            style={view === 'side' ? { right: '50%', width: '50%' } : undefined}
          />
          {/* Rendition under test */}
          <video
            ref={testVideo}
            src={selected.url}
            crossOrigin="anonymous"
            muted
            playsInline
            preload="auto"
            className={`absolute inset-0 w-full h-full object-contain ${view === 'diff' ? 'invisible' : ''}`}
            style={
              view === 'side'
                ? { left: '50%', width: '50%' }
                : view === 'split'
                ? { clipPath: `inset(0 0 0 ${wipe}%)` }
                : undefined
            }
          />
          {/* Difference */}
          {view === 'diff' && (
            <canvas ref={diffCanvas} width={AW} height={AH} className="absolute inset-0 w-full h-full object-contain" />
          )}

          {view === 'split' && (
            <div className="absolute top-0 bottom-0 w-0.5 bg-white/80 pointer-events-none" style={{ left: `${wipe}%` }} />
          )}
          {view !== 'diff' && (
            <>
              <span className="absolute top-2 left-2 text-[10px] font-semibold bg-black/60 text-white px-2 py-0.5 rounded">
                Reference · original
              </span>
              <span className="absolute top-2 right-2 text-[10px] font-semibold bg-black/60 text-white px-2 py-0.5 rounded">
                {selected.transformation} · {fmtBytes(selected.bytes)}
              </span>
            </>
          )}
        </div>

        {view === 'split' && (
          <input
            type="range" min={0} max={100} value={wipe}
            onChange={e => setWipe(Number(e.target.value))}
            className="w-full mt-2 accent-[#3448C5]"
          />
        )}

        <input
          type="range" min={0} max={REF.durationSec} step={0.05} value={time}
          onChange={e => seekBoth(Number(e.target.value))}
          className="w-full mt-2 accent-gray-700"
        />
        <div className="flex justify-between text-[10px] text-gray-400">
          <span>{time.toFixed(2)}s</span>
          <span>{REF.durationSec.toFixed(2)}s</span>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-xs text-red-700">{error}</div>
      )}

      {/* Live measurement */}
      <div className="border-t border-gray-100 pt-5">
        <div className="flex flex-wrap items-center gap-2 mb-3">
          <h3 className="font-semibold text-sm text-gray-800 flex-1">Live measurement <span className="font-normal text-gray-400">— computed in-browser</span></h3>
          {offsetFrames !== null && (
            <span className="text-[11px] px-2 py-1 rounded bg-gray-100 text-gray-600 font-medium">
              aligned {offsetFrames >= 0 ? '+' : ''}{offsetFrames} frame{Math.abs(offsetFrames) === 1 ? '' : 's'}
            </span>
          )}
          <button onClick={align} disabled={sampling || aligning}
            className="px-3 py-1.5 rounded text-xs font-semibold bg-gray-100 text-gray-700 hover:bg-gray-200 disabled:opacity-50">
            {aligning ? 'Aligning…' : 'Re-align'}
          </button>
          <button onClick={measureFrame} disabled={sampling || aligning}
            className="px-3 py-1.5 rounded text-xs font-semibold bg-gray-800 text-white hover:bg-gray-900 disabled:opacity-50">
            Measure this frame
          </button>
          <button onClick={() => sampleSeries(12)} disabled={sampling || aligning}
            className="px-3 py-1.5 rounded text-xs font-semibold bg-[#3448C5] text-white hover:bg-[#2a3a9e] disabled:opacity-50">
            {sampling ? `Sampling… ${progress}%` : 'Sample 12 frames'}
          </button>
        </div>

        <p className="text-[11px] text-gray-500 mb-3">
          The two encodes place frames differently, so the same timestamp can decode to different
          frames. Alignment runs automatically before the first measurement and searches ±{ALIGN_RANGE} frames
          for the best match — without it, scores read far worse than they are. Values here are
          per-frame at {AW}×{AH}, so they will not match the sequence-pooled figures below exactly.
        </p>

        <div className="grid sm:grid-cols-3 gap-3">
          <div className="bg-gray-50 rounded-lg p-4 text-center">
            <div className="text-xl font-bold text-gray-800">{frame ? (frame.psnr === Infinity ? '∞' : frame.psnr.toFixed(2)) : '—'}</div>
            <div className="text-[11px] text-gray-500 mt-0.5">PSNR (dB) · this frame</div>
          </div>
          <div className="bg-gray-50 rounded-lg p-4 text-center">
            <div className="text-xl font-bold text-gray-800">{frame ? frame.ssim.toFixed(4) : '—'}</div>
            <div className="text-[11px] text-gray-500 mt-0.5">SSIM · this frame</div>
          </div>
          <div className="bg-gray-50 rounded-lg p-4 text-center">
            <div className="text-xl font-bold text-gray-800">{frame ? frame.mse.toFixed(2) : '—'}</div>
            <div className="text-[11px] text-gray-500 mt-0.5">MSE · this frame</div>
          </div>
        </div>

        {series && (
          <div className="mt-3 overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left px-3 py-2 font-semibold text-gray-700">Pooled over {series.samples} frames</th>
                  <th className="px-3 py-2 font-semibold text-gray-700">Mean</th>
                  <th className="px-3 py-2 font-semibold text-gray-700">Harmonic</th>
                  <th className="px-3 py-2 font-semibold text-gray-700">Min</th>
                  <th className="px-3 py-2 font-semibold text-gray-700">Max</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-gray-100">
                  <td className="px-3 py-2 font-medium text-gray-800">PSNR (dB)</td>
                  <td className="px-3 py-2 text-center">{series.psnr.mean.toFixed(2)}</td>
                  <td className="px-3 py-2 text-center">{series.psnr.harmonicMean.toFixed(2)}</td>
                  <td className="px-3 py-2 text-center">{series.psnr.min.toFixed(2)}</td>
                  <td className="px-3 py-2 text-center">{series.psnr.max.toFixed(2)}</td>
                </tr>
                <tr>
                  <td className="px-3 py-2 font-medium text-gray-800">SSIM</td>
                  <td className="px-3 py-2 text-center">{series.ssim.mean.toFixed(4)}</td>
                  <td className="px-3 py-2 text-center">{series.ssim.harmonicMean.toFixed(4)}</td>
                  <td className="px-3 py-2 text-center">{series.ssim.min.toFixed(4)}</td>
                  <td className="px-3 py-2 text-center">{series.ssim.max.toFixed(4)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* VMAF results */}
      <div className="border-t border-gray-100 pt-5">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <h3 className="font-semibold text-sm text-gray-800">Perceptual quality — {selected.transformation}</h3>
            <p className="text-[11px] text-gray-400 mt-0.5">{dataset.tool} · measured {dataset.generatedAt}</p>
          </div>
          <div className={`text-center px-4 py-2 rounded-lg border ${band.className}`}>
            <div className="text-2xl font-bold">{vmaf.mean.toFixed(1)}</div>
            <div className="text-[10px] font-semibold uppercase tracking-wide">VMAF · {band.label}</div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-gray-800 text-white">
                <th className="text-left px-3 py-2 font-semibold">Metric</th>
                <th className="px-3 py-2 font-semibold">Mean</th>
                <th className="px-3 py-2 font-semibold">Harmonic</th>
                <th className="px-3 py-2 font-semibold">Min</th>
                <th className="px-3 py-2 font-semibold">Max</th>
              </tr>
            </thead>
            <tbody>
              {([
                ['VMAF', 'vmaf', 2], ['ADM2 (detail loss)', 'adm2', 4],
                ['VIF (scale 3)', 'vif', 4], ['Motion', 'motion', 3],
                ['PSNR-Y (dB)', 'psnrY', 2], ['SSIM', 'ssim', 4],
              ] as const).map(([label, key, dp], i) => {
                const m = selected.metrics[key]
                return (
                  <tr key={key} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="px-3 py-2 font-medium text-gray-800">{label}</td>
                    <td className="px-3 py-2 text-center">{m.mean.toFixed(dp)}</td>
                    <td className="px-3 py-2 text-center">{m.harmonicMean.toFixed(dp)}</td>
                    <td className="px-3 py-2 text-center">{m.min.toFixed(dp)}</td>
                    <td className="px-3 py-2 text-center">{m.max.toFixed(dp)}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Rate-distortion curve */}
      <div className="border-t border-gray-100 pt-5">
        <h3 className="font-semibold text-sm text-gray-800 mb-1">Delivery cost vs perceptual quality</h3>
        <p className="text-[11px] text-gray-500 mb-3">
          The bake-off question: how much bitrate buys how much experience. Diminishing returns set in above VMAF 80.
        </p>
        <svg viewBox="0 0 380 180" className="w-full max-w-xl">
          {[0, 25, 50, 75, 100].map(v => (
            <g key={v}>
              <line x1={40} y1={150 - (v / 100) * 120} x2={360} y2={150 - (v / 100) * 120} stroke="#e5e7eb" strokeWidth={1} />
              <text x={34} y={153 - (v / 100) * 120} fontSize={8} fill="#9ca3af" textAnchor="end">{v}</text>
            </g>
          ))}
          <line x1={40} y1={30} x2={40} y2={150} stroke="#9ca3af" strokeWidth={1} />
          <line x1={40} y1={150} x2={360} y2={150} stroke="#9ca3af" strokeWidth={1} />
          {/* "Transparent" threshold */}
          <line x1={40} y1={150 - 0.93 * 120} x2={360} y2={150 - 0.93 * 120} stroke="#10b981" strokeWidth={1} strokeDasharray="3 3" />
          <text x={45} y={150 - 0.93 * 120 - 4} fontSize={7} fill="#10b981" textAnchor="start">VMAF 93 · transparent</text>

          <polyline fill="none" stroke="#3448C5" strokeWidth={2} points={pts.map(p => `${p.x},${p.y}`).join(' ')} />
          {pts.map(p => (
            <g key={p.r.id}>
              <circle
                cx={p.x} cy={p.y} r={selected.id === p.r.id ? 6 : 4}
                fill={selected.id === p.r.id ? '#3448C5' : '#fff'}
                stroke="#3448C5" strokeWidth={2}
                className="cursor-pointer"
                onClick={() => setSelected(p.r)}
              />
              <text x={p.x} y={p.y - 10} fontSize={7} fill="#4b5563" textAnchor="middle">{p.r.transformation}</text>
            </g>
          ))}
          <text x={200} y={172} fontSize={8} fill="#6b7280" textAnchor="middle">bitrate (kbps) →</text>
          <text x={12} y={90} fontSize={8} fill="#6b7280" textAnchor="middle" transform="rotate(-90 12 90)">VMAF</text>
        </svg>

        <div className="overflow-x-auto mt-3">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left px-3 py-2 font-semibold text-gray-700">Transformation</th>
                <th className="px-3 py-2 font-semibold text-gray-700">Size</th>
                <th className="px-3 py-2 font-semibold text-gray-700">Bitrate</th>
                <th className="px-3 py-2 font-semibold text-gray-700">VMAF</th>
                <th className="px-3 py-2 font-semibold text-gray-700">PSNR-Y</th>
                <th className="px-3 py-2 font-semibold text-gray-700">SSIM</th>
                <th className="px-3 py-2 font-semibold text-gray-700">vs original</th>
              </tr>
            </thead>
            <tbody>
              {RENDITIONS.map(r => {
                const b = vmafBand(r.metrics.vmaf.mean)
                return (
                  <tr key={r.id}
                    onClick={() => setSelected(r)}
                    className={`cursor-pointer border-b border-gray-100 ${selected.id === r.id ? 'bg-blue-50' : 'hover:bg-gray-50'}`}>
                    <td className="px-3 py-2 font-medium text-gray-800">{r.transformation}</td>
                    <td className="px-3 py-2 text-center text-gray-600">{fmtBytes(r.bytes)}</td>
                    <td className="px-3 py-2 text-center text-gray-600">{r.bitrateKbps} kbps</td>
                    <td className="px-3 py-2 text-center">
                      <span className={`px-2 py-0.5 rounded border font-semibold ${b.className}`}>{r.metrics.vmaf.mean.toFixed(1)}</span>
                    </td>
                    <td className="px-3 py-2 text-center text-gray-600">{r.metrics.psnrY.mean.toFixed(2)}</td>
                    <td className="px-3 py-2 text-center text-gray-600">{r.metrics.ssim.mean.toFixed(4)}</td>
                    <td className="px-3 py-2 text-center text-gray-600">{((r.bytes / REF.bytes) * 100).toFixed(1)}%</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Reproducibility */}
      <div className="border-t border-gray-100 pt-5">
        <h3 className="font-semibold text-sm text-gray-800 mb-2">Reproduce these numbers</h3>
        <p className="text-[11px] text-gray-500 mb-2">
          VMAF needs libvmaf and cannot run in a browser. These scores were produced offline with:
        </p>
        <pre className="bg-gray-900 rounded-lg p-4 text-[11px] text-green-300 overflow-x-auto leading-relaxed font-mono">{FFMPEG_CMD}</pre>
        <div className="grid sm:grid-cols-5 gap-2 mt-3 text-center">
          {[
            ['≥ 93', 'Transparent'], ['80–93', 'Good'], ['60–80', 'Fair'],
            ['40–60', 'Poor'], ['< 40', 'Unacceptable'],
          ].map(([range, label]) => {
            const mid = range === '≥ 93' ? 95 : range === '80–93' ? 86 : range === '60–80' ? 70 : range === '40–60' ? 50 : 20
            return (
              <div key={range} className={`rounded-lg border px-2 py-2 ${vmafBand(mid).className}`}>
                <div className="text-xs font-bold">{range}</div>
                <div className="text-[10px]">{label}</div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

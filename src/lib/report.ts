import type { Pooled } from './videoQuality'

export interface BakeOffRow {
  label: string
  bitrateKbps: number
  bytes: number
  psnr: Pooled
  ssim: Pooled
  /** Only present for ladders measured offline with libvmaf. */
  vmaf?: Pooled
}

export interface BakeOffSource {
  name: string
  width: number
  height: number
  fps: number
  /** Number of frames actually encoded and measured. */
  frames: number
  durationSec?: number
  bytes?: number
  /** Overall bitrate of the source file — the fair basis for comparison, since
   *  rendition byte counts only cover the analysed frames. */
  bitrateKbps?: number
}

export interface BakeOffReport {
  title: string
  generatedAt: string
  method: string
  source: BakeOffSource
  rows: BakeOffRow[]
  /** Quality floor the recommendation is measured against. */
  ssimTarget: number
}

export interface Verdict {
  label: string
  className: string
}

/**
 * Quality band from SSIM, with PSNR as a secondary check. Used when VMAF is
 * unavailable (any locally encoded ladder), so it is deliberately described as
 * an SSIM/PSNR verdict rather than a VMAF one.
 */
export function ssimVerdict(ssim: number, psnr: number): Verdict {
  if (ssim >= 0.98 || psnr >= 42) return { label: 'Near-transparent', className: 'text-emerald-700 bg-emerald-50 border-emerald-200' }
  if (ssim >= 0.95) return { label: 'Good', className: 'text-green-700 bg-green-50 border-green-200' }
  if (ssim >= 0.9) return { label: 'Fair', className: 'text-amber-700 bg-amber-50 border-amber-200' }
  if (ssim >= 0.85) return { label: 'Poor', className: 'text-orange-700 bg-orange-50 border-orange-200' }
  return { label: 'Unacceptable', className: 'text-red-700 bg-red-50 border-red-200' }
}

/** Cheapest rung that still clears the quality floor. */
export function pickRecommendation(rows: BakeOffRow[], ssimTarget: number): BakeOffRow | null {
  const passing = rows.filter(r => r.ssim.mean >= ssimTarget)
  if (!passing.length) return null
  return passing.reduce((best, r) => (r.bitrateKbps < best.bitrateKbps ? r : best))
}

export function fmtBytes(b: number): string {
  if (b >= 1024 * 1024) return `${(b / 1024 / 1024).toFixed(2)} MB`
  return `${Math.round(b / 1024)} KB`
}

export function reportToMarkdown(r: BakeOffReport): string {
  const rec = pickRecommendation(r.rows, r.ssimTarget)
  const src = r.source
  const hasVmaf = r.rows.some(x => x.vmaf)

  const lines: string[] = []
  lines.push(`# ${r.title}`, '')
  lines.push(`Generated: ${r.generatedAt}`, '')
  lines.push('## Source', '')
  lines.push(`| Property | Value |`, `| --- | --- |`)
  lines.push(`| Name | ${src.name} |`)
  lines.push(`| Resolution | ${src.width}x${src.height} |`)
  lines.push(`| Frame rate | ${src.fps.toFixed(2)} fps |`)
  lines.push(`| Frames analysed | ${src.frames} |`)
  if (src.durationSec) lines.push(`| Duration | ${src.durationSec.toFixed(2)} s |`)
  if (src.bytes) lines.push(`| Size | ${fmtBytes(src.bytes)} |`)
  if (src.bitrateKbps) lines.push(`| Bitrate | ${src.bitrateKbps} kbps |`)
  lines.push('')

  lines.push('## Results', '')
  lines.push(
    `Encoded size covers the ${src.frames} frames that were analysed, not the full clip, so compare ` +
    `renditions on bitrate rather than on absolute size.`,
    '',
  )
  const head = ['Rendition', 'Bitrate', `Encoded (${src.frames}f)`, ...(hasVmaf ? ['VMAF'] : []), 'PSNR-Y (dB)', 'SSIM', 'Verdict']
  lines.push(`| ${head.join(' | ')} |`)
  lines.push(`| ${head.map(() => '---').join(' | ')} |`)
  for (const row of r.rows) {
    const v = ssimVerdict(row.ssim.mean, row.psnr.mean)
    const cells = [
      row.label,
      `${row.bitrateKbps} kbps`,
      fmtBytes(row.bytes),
      ...(hasVmaf ? [row.vmaf ? row.vmaf.mean.toFixed(1) : '—'] : []),
      row.psnr.mean.toFixed(2),
      row.ssim.mean.toFixed(4),
      v.label,
    ]
    lines.push(`| ${cells.join(' | ')} |`)
  }
  lines.push('')

  lines.push('## Recommendation', '')
  if (rec) {
    const saving = src.bitrateKbps
      ? ` — a ${((1 - rec.bitrateKbps / src.bitrateKbps) * 100).toFixed(1)}% lower bitrate than the ` +
        `source's ${src.bitrateKbps} kbps`
      : ''
    lines.push(
      `**${rec.label}** at ${rec.bitrateKbps} kbps is the cheapest rendition that still clears the ` +
      `SSIM ${r.ssimTarget} quality floor, scoring SSIM ${rec.ssim.mean.toFixed(4)} / ` +
      `PSNR ${rec.psnr.mean.toFixed(2)} dB${saving}.`,
    )
  } else {
    lines.push(`No rendition reached the SSIM ${r.ssimTarget} quality floor. Raise the bitrate ladder and re-run.`)
  }
  lines.push('')

  lines.push('## Pooled detail', '')
  lines.push('| Rendition | Metric | Mean | Harmonic | Min | Max |')
  lines.push('| --- | --- | --- | --- | --- | --- |')
  for (const row of r.rows) {
    lines.push(`| ${row.label} | PSNR-Y | ${row.psnr.mean.toFixed(2)} | ${row.psnr.harmonicMean.toFixed(2)} | ${row.psnr.min.toFixed(2)} | ${row.psnr.max.toFixed(2)} |`)
    lines.push(`| ${row.label} | SSIM | ${row.ssim.mean.toFixed(4)} | ${row.ssim.harmonicMean.toFixed(4)} | ${row.ssim.min.toFixed(4)} | ${row.ssim.max.toFixed(4)} |`)
    if (row.vmaf) {
      lines.push(`| ${row.label} | VMAF | ${row.vmaf.mean.toFixed(2)} | ${row.vmaf.harmonicMean.toFixed(2)} | ${row.vmaf.min.toFixed(2)} | ${row.vmaf.max.toFixed(2)} |`)
    }
  }
  lines.push('')
  lines.push('## Method', '')
  lines.push(r.method)
  lines.push('')
  if (!hasVmaf) {
    lines.push(
      '> VMAF is not included. It requires libvmaf, which cannot run in a browser. To add VMAF ' +
      'for this source, run the ffmpeg command shown in the Quality Lab against the original and ' +
      'each encoded rendition.',
    )
  }
  return lines.join('\n')
}

export function download(filename: string, content: string, mime: string): void {
  const blob = new Blob([content], { type: mime })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

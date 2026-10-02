// Full-reference video quality math, computed in the browser from canvas
// pixel data. PSNR/MSE/SSIM are exact implementations — they run on real
// decoded frames, not simulated values. VMAF cannot run client-side (it needs
// libvmaf), so those scores come from the precomputed dataset instead.

export interface Pooled {
  mean: number
  harmonicMean: number
  min: number
  max: number
}

export interface FrameMetrics {
  mse: number
  /** dB; Infinity when frames are identical */
  psnr: number
  /** 0..1 */
  ssim: number
}

/** BT.709 luma. SSIM/PSNR here are measured on the luma plane, as VMAF is. */
export function toLuma(rgba: Uint8ClampedArray, pixelCount: number): Float32Array {
  const y = new Float32Array(pixelCount)
  for (let i = 0, p = 0; p < pixelCount; i += 4, p++) {
    y[p] = 0.2126 * rgba[i] + 0.7152 * rgba[i + 1] + 0.0722 * rgba[i + 2]
  }
  return y
}

export function computeMSE(a: Float32Array, b: Float32Array): number {
  let sum = 0
  for (let i = 0; i < a.length; i++) {
    const d = a[i] - b[i]
    sum += d * d
  }
  return sum / a.length
}

export function psnrFromMSE(mse: number): number {
  if (mse <= 0) return Infinity
  return 10 * Math.log10((255 * 255) / mse)
}

/**
 * Mean SSIM over non-overlapping windows on the luma plane.
 * Constants are the standard C1=(0.01*L)^2, C2=(0.03*L)^2 for L=255.
 */
export function computeSSIM(
  a: Float32Array,
  b: Float32Array,
  width: number,
  height: number,
  win = 8,
): number {
  const C1 = (0.01 * 255) ** 2
  const C2 = (0.03 * 255) ** 2
  let total = 0
  let windows = 0

  for (let wy = 0; wy + win <= height; wy += win) {
    for (let wx = 0; wx + win <= width; wx += win) {
      let sumA = 0, sumB = 0
      for (let y = 0; y < win; y++) {
        const row = (wy + y) * width + wx
        for (let x = 0; x < win; x++) {
          sumA += a[row + x]
          sumB += b[row + x]
        }
      }
      const n = win * win
      const muA = sumA / n
      const muB = sumB / n

      let varA = 0, varB = 0, cov = 0
      for (let y = 0; y < win; y++) {
        const row = (wy + y) * width + wx
        for (let x = 0; x < win; x++) {
          const da = a[row + x] - muA
          const db = b[row + x] - muB
          varA += da * da
          varB += db * db
          cov += da * db
        }
      }
      // Unbiased estimators, as in the reference SSIM implementation.
      varA /= n - 1
      varB /= n - 1
      cov /= n - 1

      total +=
        ((2 * muA * muB + C1) * (2 * cov + C2)) /
        ((muA * muA + muB * muB + C1) * (varA + varB + C2))
      windows++
    }
  }
  return windows ? total / windows : 0
}

/** Luma PSNR only — cheaper than compareFrames, used for alignment search. */
export function psnrBetween(
  refRgba: Uint8ClampedArray,
  testRgba: Uint8ClampedArray,
  pixelCount: number,
): number {
  return psnrFromMSE(computeMSE(toLuma(refRgba, pixelCount), toLuma(testRgba, pixelCount)))
}

export function compareFrames(
  refRgba: Uint8ClampedArray,
  testRgba: Uint8ClampedArray,
  width: number,
  height: number,
): FrameMetrics {
  const n = width * height
  const refY = toLuma(refRgba, n)
  const testY = toLuma(testRgba, n)
  const mse = computeMSE(refY, testY)
  return { mse, psnr: psnrFromMSE(mse), ssim: computeSSIM(refY, testY, width, height) }
}

/** Pools a per-frame series the four ways libvmaf reports. */
export function pool(values: number[]): Pooled {
  const finite = values.filter(v => Number.isFinite(v))
  if (finite.length === 0) return { mean: 0, harmonicMean: 0, min: 0, max: 0 }
  const mean = finite.reduce((s, v) => s + v, 0) / finite.length
  const positive = finite.filter(v => v > 0)
  const harmonicMean = positive.length
    ? positive.length / positive.reduce((s, v) => s + 1 / v, 0)
    : 0
  return { mean, harmonicMean, min: Math.min(...finite), max: Math.max(...finite) }
}

/** Amplified absolute-difference map, for visualising where frames diverge. */
export function differenceMap(
  refRgba: Uint8ClampedArray,
  testRgba: Uint8ClampedArray,
  out: Uint8ClampedArray,
  gain = 6,
): void {
  for (let i = 0; i < out.length; i += 4) {
    const d =
      Math.abs(refRgba[i] - testRgba[i]) +
      Math.abs(refRgba[i + 1] - testRgba[i + 1]) +
      Math.abs(refRgba[i + 2] - testRgba[i + 2])
    const v = Math.min(255, (d / 3) * gain)
    // Blue -> red ramp so low error stays dark and high error is obvious.
    out[i] = v
    out[i + 1] = v * 0.35
    out[i + 2] = Math.max(0, 60 - v * 0.25)
    out[i + 3] = 255
  }
}

/** VMAF interpretation bands (Netflix guidance). */
export function vmafBand(score: number): { label: string; className: string } {
  if (score >= 93) return { label: 'Transparent', className: 'text-emerald-700 bg-emerald-50 border-emerald-200' }
  if (score >= 80) return { label: 'Good', className: 'text-green-700 bg-green-50 border-green-200' }
  if (score >= 60) return { label: 'Fair', className: 'text-amber-700 bg-amber-50 border-amber-200' }
  if (score >= 40) return { label: 'Poor', className: 'text-orange-700 bg-orange-50 border-orange-200' }
  return { label: 'Unacceptable', className: 'text-red-700 bg-red-50 border-red-200' }
}

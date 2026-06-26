// Receipt-image preprocessing for OCR. Browser-side, no dependencies.
// Pipeline: decode (handles HEIC via the browser) -> scale to a good OCR size
// -> grayscale -> contrast stretch -> Otsu binarization. Each of these
// measurably improves Tesseract accuracy on phone photos of receipts.

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => { URL.revokeObjectURL(url); resolve(img) }
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('decode failed')) }
    img.src = url
  })
}

// Otsu's method: find the grayscale threshold that best separates fore/back.
function otsuThreshold(hist: number[], total: number): number {
  let sum = 0
  for (let i = 0; i < 256; i++) sum += i * hist[i]
  let sumB = 0, wB = 0, max = 0, threshold = 127
  for (let t = 0; t < 256; t++) {
    wB += hist[t]
    if (wB === 0) continue
    const wF = total - wB
    if (wF === 0) break
    sumB += t * hist[t]
    const mB = sumB / wB
    const mF = (sum - sumB) / wF
    const between = wB * wF * (mB - mF) * (mB - mF)
    if (between > max) { max = between; threshold = t }
  }
  return threshold
}

export interface Processed {
  dataUrl: string   // binarized image for OCR
  previewUrl: string // lighter grayscale for the on-screen preview
}

export async function preprocessReceipt(file: File): Promise<Processed> {
  const img = await loadImage(file)

  // Target a longest side ~1600px: big enough for OCR, small enough to be fast.
  // Upscale small images too — tiny text OCRs poorly.
  const longest = Math.max(img.width, img.height)
  const TARGET = 1600
  const scale = longest === 0 ? 1 : TARGET / longest
  const w = Math.max(1, Math.round(img.width * scale))
  const h = Math.max(1, Math.round(img.height * scale))

  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d', { willReadFrequently: true })
  if (!ctx) throw new Error('no canvas context')
  ctx.imageSmoothingEnabled = true
  ctx.imageSmoothingQuality = 'high'
  ctx.drawImage(img, 0, 0, w, h)

  const imageData = ctx.getImageData(0, 0, w, h)
  const px = imageData.data

  // Pass 1: grayscale + build histogram + track min/max for contrast stretch.
  const gray = new Uint8ClampedArray(w * h)
  const hist = new Array(256).fill(0)
  let min = 255, max = 0
  for (let i = 0, g = 0; i < px.length; i += 4, g++) {
    // luminance
    const v = (px[i] * 0.299 + px[i + 1] * 0.587 + px[i + 2] * 0.114) | 0
    gray[g] = v
    if (v < min) min = v
    if (v > max) max = v
  }
  // Contrast stretch into full 0..255, then histogram for Otsu.
  const range = max - min || 1
  for (let g = 0; g < gray.length; g++) {
    const v = ((gray[g] - min) * 255) / range
    const c = v < 0 ? 0 : v > 255 ? 255 : v | 0
    gray[g] = c
    hist[c]++
  }

  const threshold = otsuThreshold(hist, gray.length)

  // Build binarized output + a softened grayscale preview.
  const out = ctx.createImageData(w, h)
  const op = out.data
  for (let g = 0, i = 0; g < gray.length; g++, i += 4) {
    const bw = gray[g] >= threshold ? 255 : 0
    op[i] = op[i + 1] = op[i + 2] = bw
    op[i + 3] = 255
  }
  ctx.putImageData(out, 0, 0)
  const dataUrl = canvas.toDataURL('image/png')

  // Preview: the contrast-stretched grayscale (easier on the eyes than 1-bit).
  for (let g = 0, i = 0; g < gray.length; g++, i += 4) {
    op[i] = op[i + 1] = op[i + 2] = gray[g]
  }
  ctx.putImageData(out, 0, 0)
  const previewUrl = canvas.toDataURL('image/jpeg', 0.7)

  return { dataUrl, previewUrl }
}

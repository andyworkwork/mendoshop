import sharp from 'sharp'

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n))
}

export function rgbToHex(r, g, b) {
  return (
    '#' +
    [r, g, b]
      .map((x) => clamp(Math.round(x), 0, 255).toString(16).padStart(2, '0'))
      .join('')
  )
}

function luminance(r, g, b) {
  return 0.299 * r + 0.587 * g + 0.114 * b
}

function saturation(r, g, b) {
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  if (max === 0) return 0
  return (max - min) / max
}

function rgbToHsl(r, g, b) {
  r /= 255
  g /= 255
  b /= 255
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  let h = 0
  let s = 0
  const l = (max + min) / 2
  if (max !== min) {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6
        break
      case g:
        h = ((b - r) / d + 2) / 6
        break
      case b:
        h = ((r - g) / d + 4) / 6
        break
    }
  }
  return { h: h * 360, s, l }
}

function hslToRgb(h, s, l) {
  h /= 360
  let r
  let g
  let b
  if (s === 0) {
    r = g = b = l
  } else {
    const hue2rgb = (p, q, t) => {
      if (t < 0) t += 1
      if (t > 1) t -= 1
      if (t < 1 / 6) return p + (q - p) * 6 * t
      if (t < 1 / 2) return q
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6
      return p
    }
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s
    const p = 2 * l - q
    r = hue2rgb(p, q, h + 1 / 3)
    g = hue2rgb(p, q, h)
    b = hue2rgb(p, q, h - 1 / 3)
  }
  return { r: r * 255, g: g * 255, b: b * 255 }
}

function boostSaturation(r, g, b, amount = 1.35) {
  const { h, s, l } = rgbToHsl(r, g, b)
  return hslToRgb(h, Math.min(1, s * amount), clamp(l, 0.28, 0.52))
}

function accentHue(r, g, b) {
  const { h, s, l } = rgbToHsl(r, g, b)
  return hslToRgb((h + 148) % 360, Math.min(0.9, s * 1.15 + 0.15), clamp(l + 0.08, 0.35, 0.62))
}

function avgRgb(pixels) {
  if (pixels.length === 0) return { r: 244, g: 244, b: 245 }
  const sum = pixels.reduce((a, p) => ({ r: a.r + p.r, g: a.g + p.g, b: a.b + p.b }), { r: 0, g: 0, b: 0 })
  const n = pixels.length
  return { r: sum.r / n, g: sum.g / n, b: sum.b / n }
}

function hexLuminance(hex) {
  const h = hex.replace(/^#/, '')
  if (h.length !== 6) return 128
  const r = parseInt(h.slice(0, 2), 16)
  const g = parseInt(h.slice(2, 4), 16)
  const b = parseInt(h.slice(4, 6), 16)
  return luminance(r, g, b)
}

/** Si el acento y el fondo de tarjeta son muy parecidos, oscurece o aclara el acento. */
function ensureReadableAccentOnFill(accentHex, fillHex) {
  const fillLum = hexLuminance(fillHex)
  const gap = Math.abs(fillLum - hexLuminance(accentHex))
  if (gap >= 88) return accentHex

  const h = accentHex.replace(/^#/, '')
  const r = parseInt(h.slice(0, 2), 16)
  const g = parseInt(h.slice(2, 4), 16)
  const b = parseInt(h.slice(4, 6), 16)
  const { h: hue, s } = rgbToHsl(r, g, b)
  const sat = Math.max(0.45, Math.min(0.95, s * 1.1 + 0.1))

  if (fillLum > 150) {
    const dark = hslToRgb(hue, sat, 0.28)
    return rgbToHex(dark.r, dark.g, dark.b)
  }
  if (fillLum < 95) {
    const light = hslToRgb(hue, Math.min(0.75, sat * 0.85), 0.82)
    return rgbToHex(light.r, light.g, light.b)
  }

  const accentLum = luminance(r, g, b)
  if (fillLum >= accentLum) {
    const dark = hslToRgb(hue, sat, 0.32)
    return rgbToHex(dark.r, dark.g, dark.b)
  }
  const light = hslToRgb(hue, sat * 0.8, 0.78)
  return rgbToHex(light.r, light.g, light.b)
}

/**
 * Sugiere tema de vitrina a partir de la imagen (1).
 */
export async function extractThemeFromImage(inputPath) {
  const { data, info } = await sharp(inputPath)
    .rotate()
    .resize(160, 160, { fit: 'cover' })
    .raw()
    .toBuffer({ resolveWithObject: true })

  const ch = info.channels
  const lightPixels = []
  const vibrantBuckets = new Map()

  for (let i = 0; i < data.length; i += ch) {
    const r = data[i]
    const g = data[i + 1]
    const b = data[i + 2]
    const lum = luminance(r, g, b)
    const sat = saturation(r, g, b)
    if (lum > 195 && sat < 0.35) lightPixels.push({ r, g, b })
    if (sat > 0.18 && lum > 35 && lum < 225) {
      const key = `${Math.round(r / 36)}-${Math.round(g / 36)}-${Math.round(b / 36)}`
      const prev = vibrantBuckets.get(key)
      const score = sat * (1 - Math.abs(lum - 128) / 128)
      if (!prev || score > prev.score) vibrantBuckets.set(key, { r, g, b, score, count: (prev?.count ?? 0) + 1 })
    }
  }

  const { dominant } = await sharp(inputPath).rotate().resize(200, 200, { fit: 'cover' }).stats()
  let vibrant = dominant
  let best = 0
  for (const bucket of vibrantBuckets.values()) {
    const score = bucket.count * bucket.score
    if (score > best) {
      best = score
      vibrant = bucket
    }
  }

  const lightRatio = lightPixels.length / (data.length / ch)
  const lightAvg = avgRgb(lightPixels)
  const domLum = luminance(dominant.r, dominant.g, dominant.b)
  const domSat = saturation(dominant.r, dominant.g, dominant.b)

  const primaryRgb = boostSaturation(vibrant.r, vibrant.g, vibrant.b)
  const accentRgb = accentHue(vibrant.r, vibrant.g, vibrant.b)
  const primary = rgbToHex(primaryRgb.r, primaryRgb.g, primaryRgb.b)
  let accent = rgbToHex(accentRgb.r, accentRgb.g, accentRgb.b)

  let background = 'light'
  if (lightRatio > 0.38) background = 'light'
  else if (domLum < 58) background = domSat > 0.28 ? 'gradient' : 'solid'
  else if (domLum < 105) background = 'pattern'
  else background = 'light'

  let productFrame = '#ffffff'
  if (lightRatio > 0.32) productFrame = rgbToHex(lightAvg.r, lightAvg.g, lightAvg.b)
  else if (domLum > 150) productFrame = '#f4f4f5'
  else {
    productFrame = rgbToHex(
      clamp(dominant.r + 70, 180, 255),
      clamp(dominant.g + 70, 180, 255),
      clamp(dominant.b + 70, 180, 255),
    )
  }

  accent = ensureReadableAccentOnFill(accent, productFrame)

  const titleColor = suggestTitleColor(vibrant, lightAvg, background, primary, productFrame)

  const backgroundColors = {}
  if (background === 'light') {
    backgroundColors.light = rgbToHex(
      clamp(lightAvg.r, 235, 252),
      clamp(lightAvg.g, 235, 252),
      clamp(lightAvg.b, 235, 252),
    )
  } else if (background === 'gradient') {
    backgroundColors.gradientTop = primary
    backgroundColors.gradientBottom = rgbToHex(
      clamp(dominant.r * 0.15, 0, 40),
      clamp(dominant.g * 0.15, 0, 40),
      clamp(dominant.b * 0.15, 0, 45),
    )
  } else if (background === 'solid') {
    backgroundColors.solid = rgbToHex(
      clamp(dominant.r * 0.12, 8, 28),
      clamp(dominant.g * 0.12, 8, 28),
      clamp(dominant.b * 0.12, 10, 32),
    )
  } else {
    backgroundColors.patternBase = rgbToHex(
      clamp(dominant.r * 0.2, 20, 50),
      clamp(dominant.g * 0.2, 20, 50),
      clamp(dominant.b * 0.2, 22, 55),
    )
    backgroundColors.patternDot = primary
  }

  return {
    templateId: null,
    primary,
    accent,
    productFrame,
    titleColor,
    background,
    backgroundColors,
  }
}

/** Color de títulos / tagline / categorías, legible según el fondo de la vitrina. */
function suggestTitleColor(vibrant, lightAvg, background, primary, productFrame) {
  const warm = rgbToHsl(lightAvg.r, lightAvg.g, lightAvg.b)
  const dom = rgbToHsl(vibrant.r, vibrant.g, vibrant.b)

  if (background === 'light') {
    const t = hslToRgb((warm.h + 22) % 360, Math.min(0.5, Math.max(0.22, warm.s + 0.12)), 0.3)
    return rgbToHex(t.r, t.g, t.b)
  }

  const fillLum = hexLuminance(productFrame)
  if (fillLum > 160) {
    const t = hslToRgb((dom.h + 12) % 360, Math.min(0.45, dom.s * 0.85 + 0.1), 0.32)
    return rgbToHex(t.r, t.g, t.b)
  }

  const t = hslToRgb(dom.h, Math.min(0.32, dom.s * 0.55 + 0.08), 0.78)
  return rgbToHex(t.r, t.g, t.b)
}

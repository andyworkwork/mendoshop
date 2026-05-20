function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n))
}

export function parseHex(hex: string | undefined | null): { r: number; g: number; b: number } | null {
  if (!hex || typeof hex !== 'string') return null
  const h = hex.replace(/^#/, '')
  if (h.length !== 6) return null
  const n = parseInt(h, 16)
  if (Number.isNaN(n)) return null
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 }
}

export function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  return parseHex(hex)
}

export function luminance(r: number, g: number, b: number): number {
  return 0.299 * r + 0.587 * g + 0.114 * b
}

export function hexLuminance(hex: string): number {
  const rgb = parseHex(hex)
  if (!rgb) return 128
  return luminance(rgb.r, rgb.g, rgb.b)
}

function rgbToHsl(r: number, g: number, b: number) {
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

function hslToRgb(h: number, s: number, l: number) {
  h /= 360
  let r: number
  let g: number
  let b: number
  if (s === 0) {
    r = g = b = l
  } else {
    const hue2rgb = (p: number, q: number, t: number) => {
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

export function rgbToHex(r: number, g: number, b: number): string {
  return (
    '#' +
    [r, g, b]
      .map((x) => clamp(Math.round(x), 0, 255).toString(16).padStart(2, '0'))
      .join('')
  )
}

/** Acento legible sobre el fondo de tarjeta (color 3). */
export function ensureReadableAccentOnFill(accentHex: string, fillHex: string): string {
  const fillLum = hexLuminance(fillHex)
  const accentRgb = parseHex(accentHex)
  if (!accentRgb) return accentHex

  const gap = Math.abs(fillLum - hexLuminance(accentHex))
  if (gap >= 88) return accentHex

  const { h, s } = rgbToHsl(accentRgb.r, accentRgb.g, accentRgb.b)
  const sat = Math.max(0.45, Math.min(0.95, s * 1.1 + 0.1))

  if (fillLum > 150) {
    const dark = hslToRgb(h, sat, 0.28)
    return rgbToHex(dark.r, dark.g, dark.b)
  }

  if (fillLum < 95) {
    const light = hslToRgb(h, Math.min(0.75, sat * 0.85), 0.82)
    return rgbToHex(light.r, light.g, light.b)
  }

  if (fillLum >= accentRgb.r * 0.299 + accentRgb.g * 0.587 + accentRgb.b * 0.114) {
    const dark = hslToRgb(h, sat, 0.32)
    return rgbToHex(dark.r, dark.g, dark.b)
  }

  const light = hslToRgb(h, sat * 0.8, 0.78)
  return rgbToHex(light.r, light.g, light.b)
}

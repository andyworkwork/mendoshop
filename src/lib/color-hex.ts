import { parseHex } from '@/lib/color-contrast'

export function normalizeHex(hex: string | undefined | null, fallback = '#808080'): string {
  const parsed = parseHex(hex)
  if (parsed) {
    return (
      '#' +
      [parsed.r, parsed.g, parsed.b]
        .map((n) => n.toString(16).padStart(2, '0'))
        .join('')
    )
  }
  return normalizeHex(fallback, '#808080')
}

export type RgbComponents = { r: number; g: number; b: number }
export type HsvComponents = { h: number; s: number; v: number }
export type HslComponents = { h: number; s: number; l: number }

export function hexToRgb(hex: string): RgbComponents {
  const rgb = parseHex(hex)
  return rgb ?? { r: 128, g: 128, b: 128 }
}

export function rgbToHex(r: number, g: number, b: number): string {
  return normalizeHex(
    `#${[r, g, b]
      .map((n) => Math.max(0, Math.min(255, Math.round(n))))
      .map((n) => n.toString(16).padStart(2, '0'))
      .join('')}`,
  )
}

export function hexToHsv(hex: string): HsvComponents {
  const { r, g, b } = hexToRgb(hex)
  const rn = r / 255
  const gn = g / 255
  const bn = b / 255
  const max = Math.max(rn, gn, bn)
  const min = Math.min(rn, gn, bn)
  const d = max - min
  let h = 0
  const v = max
  const s = max === 0 ? 0 : d / max
  if (d !== 0) {
    switch (max) {
      case rn:
        h = ((gn - bn) / d + (gn < bn ? 6 : 0)) / 6
        break
      case gn:
        h = ((bn - rn) / d + 2) / 6
        break
      default:
        h = ((rn - gn) / d + 4) / 6
        break
    }
  }
  return { h: h * 360, s: s * 100, v: v * 100 }
}

export function hsvToHex(h: number, s: number, v: number): string {
  const hh = ((h % 360) + 360) % 360
  const ss = Math.max(0, Math.min(100, s)) / 100
  const vv = Math.max(0, Math.min(100, v)) / 100
  const c = vv * ss
  const x = c * (1 - Math.abs(((hh / 60) % 2) - 1))
  const m = vv - c
  let r = 0
  let g = 0
  let b = 0
  if (hh < 60) {
    r = c
    g = x
  } else if (hh < 120) {
    r = x
    g = c
  } else if (hh < 180) {
    g = c
    b = x
  } else if (hh < 240) {
    g = x
    b = c
  } else if (hh < 300) {
    r = x
    b = c
  } else {
    r = c
    b = x
  }
  return rgbToHex((r + m) * 255, (g + m) * 255, (b + m) * 255)
}

export function hexToHsl(hex: string): HslComponents {
  const rgb = parseHex(hex)
  if (!rgb) return { h: 0, s: 0, l: 0.5 }
  let { r, g, b } = rgb
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
      default:
        h = ((r - g) / d + 4) / 6
        break
    }
  }
  return { h: h * 360, s: s * 100, l: l * 100 }
}

export function hslToHex(h: number, s: number, l: number): string {
  const hh = ((h % 360) + 360) % 360
  const ss = Math.max(0, Math.min(100, s)) / 100
  const ll = Math.max(0, Math.min(100, l)) / 100
  const c = (1 - Math.abs(2 * ll - 1)) * ss
  const x = c * (1 - Math.abs(((hh / 60) % 2) - 1))
  const m = ll - c / 2
  let r = 0
  let g = 0
  let b = 0
  if (hh < 60) {
    r = c
    g = x
  } else if (hh < 120) {
    r = x
    g = c
  } else if (hh < 180) {
    g = c
    b = x
  } else if (hh < 240) {
    g = x
    b = c
  } else if (hh < 300) {
    r = x
    b = c
  } else {
    r = c
    b = x
  }
  return normalizeHex(
    `#${[r + m, g + m, b + m]
      .map((v) => Math.round(v * 255))
      .map((n) => n.toString(16).padStart(2, '0'))
      .join('')}`,
  )
}

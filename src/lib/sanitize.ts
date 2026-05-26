/** Límites alineados con inputs del panel y constraints razonables. */
export const SANITIZE_LIMITS = {
  shopName: 120,
  shopDescription: 500,
  categoryLabel: 80,
  seoTitle: 70,
  seoDescription: 160,
  categoryName: 80,
  subcategoryName: 80,
  productName: 120,
  productDescription: 300,
  productDetails: 2000,
} as const

const CONTROL_CHARS = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g
const HTML_TAG = /<[^>]*>/g
const UNSAFE_URL_SCHEME = /^(javascript|data|vbscript|file):/i

function stripControlChars(value: string): string {
  return value.replace(CONTROL_CHARS, '')
}

function stripHtmlTags(value: string): string {
  return value.replace(HTML_TAG, '')
}

function collapseInlineSpaces(value: string): string {
  return value.replace(/[^\S\n]+/g, ' ')
}

function normalizeNewlines(value: string): string {
  return value.replace(/\r\n?/g, '\n')
}

function collapseExtraBlankLines(value: string): string {
  return value.replace(/\n{3,}/g, '\n\n').trim()
}

function truncate(value: string, maxLength: number): string {
  if (value.length <= maxLength) return value
  return value.slice(0, maxLength).trim()
}

/** Texto de una línea: sin HTML, sin controles, espacios normalizados. */
export function sanitizePlainText(input: string, maxLength: number): string {
  let value = stripControlChars(input)
  value = stripHtmlTags(value)
  value = collapseInlineSpaces(value.trim())
  return truncate(value, maxLength)
}

export function sanitizePlainTextOrNull(
  input: string | null | undefined,
  maxLength: number,
): string | null {
  if (input == null) return null
  const value = sanitizePlainText(input, maxLength)
  return value.length > 0 ? value : null
}

/** Descripciones con saltos de línea permitidos. */
export function sanitizeMultilineText(input: string, maxLength: number): string {
  let value = normalizeNewlines(stripControlChars(input))
  value = stripHtmlTags(value)
  value = value
    .split('\n')
    .map((line) => collapseInlineSpaces(line.trim()))
    .join('\n')
  value = collapseExtraBlankLines(value)
  return truncate(value, maxLength)
}

export function sanitizeMultilineTextOrNull(
  input: string | null | undefined,
  maxLength: number,
): string | null {
  if (input == null) return null
  const value = sanitizeMultilineText(input, maxLength)
  return value.length > 0 ? value : null
}

export function sanitizeWhatsAppDigits(input: string): string {
  return input.replace(/\D/g, '')
}

export function isSafeHttpUrl(url: string): boolean {
  if (UNSAFE_URL_SCHEME.test(url.trim())) return false
  try {
    const parsed = new URL(url)
    return parsed.protocol === 'http:' || parsed.protocol === 'https:'
  } catch {
    return false
  }
}

/** Devuelve la URL si es http(s); si no, null (rechaza javascript:, data:, etc.). */
export function sanitizeHttpUrl(input: string): string | null {
  const trimmed = input.trim()
  if (!trimmed || UNSAFE_URL_SCHEME.test(trimmed)) return null
  if (!/^https?:\/\//i.test(trimmed)) return null
  const normalized = trimmed.replace(/\/+$/, '')
  return isSafeHttpUrl(normalized) ? normalized : null
}

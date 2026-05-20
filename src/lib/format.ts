export function formatMoneyArs(n: number, maxFractionDigits?: number): string {
  const fractionDigits =
    maxFractionDigits ?? (Math.abs(n - Math.round(n)) < 0.001 ? 0 : 2)
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    maximumFractionDigits: fractionDigits,
    minimumFractionDigits: fractionDigits,
  }).format(n)
}

export function upperCategoryLabel(name: string): string {
  return name.trim().toLocaleUpperCase('es-AR')
}

export function slugify(input: string): string {
  return input
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 50)
}

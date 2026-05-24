export const TEMPLATE_SHOWCASE_PREFIX = 'template-showcase'

export function templateShowcaseBannerPath(templateId: string): string {
  return `${TEMPLATE_SHOWCASE_PREFIX}/${templateId}/banner.webp`
}

export function templateShowcaseProductPath(templateId: string, slot: 1 | 2): string {
  return `${TEMPLATE_SHOWCASE_PREFIX}/${templateId}/product-${slot}.webp`
}

export function templateShowcasePathsToRemove(templateId: string): string[] {
  return [
    templateShowcaseBannerPath(templateId),
    templateShowcaseProductPath(templateId, 1),
    templateShowcaseProductPath(templateId, 2),
  ]
}

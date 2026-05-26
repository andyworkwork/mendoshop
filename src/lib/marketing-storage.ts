export const MARKETING_STORAGE_PREFIX = 'marketing'

export function marketingAssetImagePath(assetId: string): string {
  return `${MARKETING_STORAGE_PREFIX}/${assetId}/image.webp`
}

export function marketingAssetPathsToRemove(assetId: string): string[] {
  return [marketingAssetImagePath(assetId)]
}

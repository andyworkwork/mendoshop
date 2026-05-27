const storageKey = (shopId: string) => `mendoshop:first-steps:${shopId}`

export function isFirstStepsDone(shopId: string): boolean {
  if (typeof window === 'undefined') return false
  try {
    return localStorage.getItem(storageKey(shopId)) === 'done'
  } catch {
    return false
  }
}

export function markFirstStepsDone(shopId: string): void {
  try {
    localStorage.setItem(storageKey(shopId), 'done')
  } catch {
    /* ignore quota / private mode */
  }
}

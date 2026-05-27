export const FIRST_STEPS_STORAGE_EVENT = 'mendoshop:first-steps-updated'

export function templateOnboardingCookieName(shopId: string) {
  return `mendoshop-template-done-${shopId}`
}

const storageKey = (shopId: string) => `mendoshop:first-steps:${shopId}`

export function isFirstStepsDone(shopId: string): boolean {
  if (typeof window === 'undefined') return false
  try {
    return localStorage.getItem(storageKey(shopId)) === 'done'
  } catch {
    return false
  }
}

export function isTemplateOnboardingDoneFromCookie(
  cookieStore: { get: (name: string) => { value: string } | undefined },
  shopId: string,
): boolean {
  return cookieStore.get(templateOnboardingCookieName(shopId))?.value === '1'
}

export function markFirstStepsDone(shopId: string): void {
  try {
    localStorage.setItem(storageKey(shopId), 'done')
  } catch {
    /* ignore quota / private mode */
  }
  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent(FIRST_STEPS_STORAGE_EVENT, { detail: { shopId } }),
    )
  }
}

export function isTemplateOnboardingDone(
  shopId: string,
  initialFromServer = false,
): boolean {
  return initialFromServer || isFirstStepsDone(shopId)
}

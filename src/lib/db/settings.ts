export type Theme = 'light' | 'dark'
export type LandingTab = 'today' | 'habits' | 'mood'

export interface Settings {
  theme: Theme
  defaultLandingTab: LandingTab
  notificationOnboardingDone: boolean
  lastSyncAt?: number
  syncSecretHash?: string
}

const KEY_PREFIX = 'erinnermich:'
const KEY_THEME = `${KEY_PREFIX}theme`
const KEY_LANDING = `${KEY_PREFIX}landing`
const KEY_NOTIF_ONBOARDING = `${KEY_PREFIX}notification-onboarding-done`
const KEY_LAST_SYNC = `${KEY_PREFIX}last-sync-at`
const KEY_SYNC_HASH = `${KEY_PREFIX}sync-secret-hash`

const DEFAULTS: Settings = {
  theme: 'light',
  defaultLandingTab: 'today',
  notificationOnboardingDone: false,
}

function safeStorage(): Storage | null {
  if (typeof window === 'undefined') return null
  try {
    return window.localStorage
  } catch {
    return null
  }
}

export function readSettings(): Settings {
  const ls = safeStorage()
  if (!ls) return { ...DEFAULTS }
  return {
    theme: (ls.getItem(KEY_THEME) as Theme | null) ?? DEFAULTS.theme,
    defaultLandingTab:
      (ls.getItem(KEY_LANDING) as LandingTab | null) ?? DEFAULTS.defaultLandingTab,
    notificationOnboardingDone:
      ls.getItem(KEY_NOTIF_ONBOARDING) === '1',
    lastSyncAt: numberOr(ls.getItem(KEY_LAST_SYNC)),
    syncSecretHash: ls.getItem(KEY_SYNC_HASH) ?? undefined,
  }
}

export function writeTheme(theme: Theme): void {
  safeStorage()?.setItem(KEY_THEME, theme)
}

export function writeLandingTab(tab: LandingTab): void {
  safeStorage()?.setItem(KEY_LANDING, tab)
}

export function writeNotificationOnboardingDone(done: boolean): void {
  safeStorage()?.setItem(KEY_NOTIF_ONBOARDING, done ? '1' : '0')
}

export function writeLastSyncAt(timestamp: number): void {
  safeStorage()?.setItem(KEY_LAST_SYNC, String(timestamp))
}

export function writeSyncSecretHash(hash: string | null): void {
  const ls = safeStorage()
  if (!ls) return
  if (hash === null) ls.removeItem(KEY_SYNC_HASH)
  else ls.setItem(KEY_SYNC_HASH, hash)
}

function numberOr(raw: string | null): number | undefined {
  if (raw === null) return undefined
  const n = Number(raw)
  return Number.isFinite(n) ? n : undefined
}

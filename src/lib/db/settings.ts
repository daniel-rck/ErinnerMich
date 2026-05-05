export type Theme = 'light' | 'dark' | 'system'
export type LandingTab = 'today' | 'habits' | 'mood'

export interface Settings {
  theme: Theme
  defaultLandingTab: LandingTab
  notificationOnboardingDone: boolean
  hapticsEnabled: boolean
  soundEnabled: boolean
  onboardingCompleted: boolean
  lastSyncAt?: number
  syncSecretHash?: string
}

const KEY_PREFIX = 'erinnermich:'
const KEY_THEME = `${KEY_PREFIX}theme`
const KEY_LANDING = `${KEY_PREFIX}landing`
const KEY_NOTIF_ONBOARDING = `${KEY_PREFIX}notification-onboarding-done`
const KEY_HAPTICS = `${KEY_PREFIX}haptics-enabled`
const KEY_SOUND = `${KEY_PREFIX}sound-enabled`
const KEY_ONBOARDING_DONE = `${KEY_PREFIX}onboarding-completed`
const KEY_LAST_SYNC = `${KEY_PREFIX}last-sync-at`
const KEY_SYNC_HASH = `${KEY_PREFIX}sync-secret-hash`

const DEFAULTS: Settings = {
  theme: 'system',
  defaultLandingTab: 'today',
  notificationOnboardingDone: false,
  hapticsEnabled: true,
  soundEnabled: false,
  onboardingCompleted: false,
}

function safeStorage(): Storage | null {
  if (typeof window === 'undefined') return null
  try {
    return window.localStorage
  } catch {
    return null
  }
}

function readTheme(raw: string | null): Theme {
  if (raw === 'light' || raw === 'dark' || raw === 'system') return raw
  return DEFAULTS.theme
}

export function readSettings(): Settings {
  const ls = safeStorage()
  if (!ls) return { ...DEFAULTS }
  return {
    theme: readTheme(ls.getItem(KEY_THEME)),
    defaultLandingTab:
      (ls.getItem(KEY_LANDING) as LandingTab | null) ?? DEFAULTS.defaultLandingTab,
    notificationOnboardingDone: ls.getItem(KEY_NOTIF_ONBOARDING) === '1',
    hapticsEnabled: ls.getItem(KEY_HAPTICS) !== '0',
    soundEnabled: ls.getItem(KEY_SOUND) === '1',
    onboardingCompleted: ls.getItem(KEY_ONBOARDING_DONE) === '1',
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

export function writeHapticsEnabled(enabled: boolean): void {
  safeStorage()?.setItem(KEY_HAPTICS, enabled ? '1' : '0')
}

export function writeSoundEnabled(enabled: boolean): void {
  safeStorage()?.setItem(KEY_SOUND, enabled ? '1' : '0')
}

export function writeOnboardingCompleted(done: boolean): void {
  safeStorage()?.setItem(KEY_ONBOARDING_DONE, done ? '1' : '0')
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

/**
 * Live preferences for the six DSH chrome switches this plugin owns. Stored in
 * one JSON blob under one localStorage key; every switch is a plain boolean
 * and absence reads as "off".
 *
 * @module dsh-ui-toggle-plugin/client/prefs
 */

export interface UiPrefs {
  readonly hideBrand: boolean
  readonly hideLauncher: boolean
  readonly panelsInline: boolean
  readonly hideNewSession: boolean
  readonly hideSidebarToggle: boolean
  readonly hideInputPlaceholder: boolean
}

export interface PrefsStorage {
  getItem(key: string): string | null
  setItem(key: string, value: string): void
  removeItem(key: string): void
}

export const PREFS_KEY = 'dsh-ui-toggle-plugin:ui-prefs'

/**
 * The localStorage key the chrome switches lived under before they were split
 * out of the dsh-capability-toggle-plugin panel. read-only here: seed once at
 * apply, never write back to it.
 */
const LEGACY_PREFS_KEY = 'dsh-capability-toggle-plugin:panel-prefs'

export const DEFAULT_PREFS: UiPrefs = {
  hideBrand: false,
  hideLauncher: false,
  panelsInline: false,
  hideNewSession: false,
  hideSidebarToggle: false,
  hideInputPlaceholder: false,
}

function defaultStorage(): PrefsStorage | undefined {
  if (typeof localStorage === 'undefined') return undefined
  return localStorage
}

/**
 * Validate and project the six chrome fields off a parsed blob. All-or-nothing:
 * a stored blob from an earlier release may simply lack a field (absence reads
 * as "off"), while a present-but-non-boolean value rejects the whole blob —
 * for readPrefs back to defaults, for the legacy seed to no migration.
 */
function chromeFieldsFrom(candidate: object): UiPrefs | undefined {
  const c = candidate as Partial<Record<keyof UiPrefs, unknown>>
  for (const field of Object.keys(DEFAULT_PREFS) as readonly (keyof UiPrefs)[]) {
    const value = c[field]
    if (value !== undefined && typeof value !== 'boolean') return undefined
  }
  return {
    hideBrand: typeof c.hideBrand === 'boolean' ? c.hideBrand : false,
    hideLauncher: typeof c.hideLauncher === 'boolean' ? c.hideLauncher : false,
    panelsInline: typeof c.panelsInline === 'boolean' ? c.panelsInline : false,
    hideNewSession: typeof c.hideNewSession === 'boolean' ? c.hideNewSession : false,
    hideSidebarToggle: typeof c.hideSidebarToggle === 'boolean' ? c.hideSidebarToggle : false,
    hideInputPlaceholder: typeof c.hideInputPlaceholder === 'boolean' ? c.hideInputPlaceholder : false,
  }
}

export function readPrefs(storage: PrefsStorage | undefined = defaultStorage()): UiPrefs {
  if (storage === undefined) return DEFAULT_PREFS
  let raw: string | null
  try {
    raw = storage.getItem(PREFS_KEY)
  } catch {
    return DEFAULT_PREFS
  }
  if (raw === null) return DEFAULT_PREFS
  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch {
    return DEFAULT_PREFS
  }
  if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) return DEFAULT_PREFS
  return chromeFieldsFrom(parsed) ?? DEFAULT_PREFS
}

/**
 * One-time migration from the pre-split storage: the six chrome switches used
 * to live in the dsh-capability-toggle-plugin panel's prefs blob. When this
 * plugin's own key does not exist yet and the legacy blob parses, carry the six
 * chrome fields over (same absence-reads-as-off, corrupt-rejects-all rule) and
 * persist them under the new key. The legacy key is never written.
 *
 * @returns the seeded prefs when a migration ran, otherwise undefined.
 */
export function seedFromLegacyPrefs(storage: PrefsStorage | undefined = defaultStorage()): UiPrefs | undefined {
  if (storage === undefined) return undefined
  let own: string | null
  try {
    own = storage.getItem(PREFS_KEY)
  } catch {
    return undefined
  }
  if (own !== null) return undefined
  let raw: string | null
  try {
    raw = storage.getItem(LEGACY_PREFS_KEY)
  } catch {
    return undefined
  }
  if (raw === null) return undefined
  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch {
    return undefined
  }
  if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) return undefined
  const seeded = chromeFieldsFrom(parsed)
  if (seeded === undefined) return undefined
  writePrefs(seeded, storage)
  return seeded
}

export function writePrefs(prefs: UiPrefs, storage: PrefsStorage | undefined = defaultStorage()): void {
  // Notify BEFORE persisting: the section flips its React state optimistically
  // before calling here, so a storage that throws (Safari private mode, full
  // quota) must not strand the flipped switch — the chrome would ignore what
  // the section already shows. A failed persist only costs durability across
  // reloads, which a warning makes visible.
  for (const listener of prefListeners) listener(prefs)
  if (storage === undefined) return
  try {
    storage.setItem(PREFS_KEY, JSON.stringify(prefs))
  } catch (error) {
    console.warn('ui-toggle: persisting ui prefs failed:', error)
  }
}

const prefListeners = new Set<(prefs: UiPrefs) => void>()

/**
 * Subscribe to pref writes (same-tab, in-process). The chrome effects use this
 * to apply a flipped switch immediately instead of on next launch. The
 * listener set is module state because `writePrefs` is the single write path
 * every caller already goes through.
 */
export function onPrefsChanged(listener: (prefs: UiPrefs) => void): () => void {
  prefListeners.add(listener)
  return () => {
    prefListeners.delete(listener)
  }
}

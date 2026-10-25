/**
 * prefs suite for dsh-ui-toggle-plugin: the six chrome-switch fields, the
 * all-or-nothing validation, and the one-time seed from the pre-split storage
 * key (the six switches used to live in the dsh-capability-toggle-plugin
 * panel's localStorage blob).
 *
 * @module dsh-ui-toggle-plugin/test/prefs
 */

import test from 'node:test'
import assert from 'node:assert/strict'

interface Store {
  readonly store: Map<string, string>
  readonly storage: {
    getItem: (k: string) => string | null
    setItem: (k: string, v: string) => void
    removeItem: (k: string) => void
  }
}

function freshStore(): Store {
  const store = new Map<string, string>()
  return {
    store,
    storage: {
      getItem: (k: string) => store.get(k) ?? null,
      setItem: (k: string, v: string) => void store.set(k, v),
      removeItem: (k: string) => void store.delete(k),
    },
  }
}

test('prefs default to every chrome switch off and round-trip the six fields', async () => {
  const { readPrefs, writePrefs, DEFAULT_PREFS, PREFS_KEY } = await import('../src/client/prefs.ts')
  const { storage, store } = freshStore()

  // Defaults keep every shipped element visible.
  assert.deepEqual(readPrefs(storage), DEFAULT_PREFS)
  assert.deepEqual(readPrefs(storage), {
    hideBrand: false, hideLauncher: false, panelsInline: false,
    hideNewSession: false, hideSidebarToggle: false, hideInputPlaceholder: false,
  })
  assert.equal(store.size, 0, 'reading defaults must not persist anything')

  writePrefs({
    ...DEFAULT_PREFS, hideBrand: true, hideLauncher: true, panelsInline: true,
    hideNewSession: true, hideSidebarToggle: true, hideInputPlaceholder: true,
  }, storage)
  assert.equal(store.size, 1, 'writing must persist exactly one blob')
  assert.ok(store.has(PREFS_KEY), 'the blob must live under the plugin key')
  assert.deepEqual(readPrefs(storage), {
    hideBrand: true, hideLauncher: true, panelsInline: true,
    hideNewSession: true, hideSidebarToggle: true, hideInputPlaceholder: true,
  })
})

test('a stored blob without a switch field upgrades it in place as off; a corrupt field rejects the whole blob', async () => {
  const { readPrefs, DEFAULT_PREFS, PREFS_KEY } = await import('../src/client/prefs.ts')
  const { storage, store } = freshStore()
  const off = {
    hideBrand: false, hideLauncher: false, panelsInline: false,
    hideNewSession: false, hideSidebarToggle: false, hideInputPlaceholder: false,
  }

  // Absence reads as "off": an early-release blob lacking a field upgrades.
  store.set(PREFS_KEY, JSON.stringify({ hideBrand: true }))
  assert.deepEqual(readPrefs(storage), { ...off, hideBrand: true },
    'a present field must survive; the missing ones must read as off')

  // A present field of the wrong type rejects the whole blob (all-or-nothing).
  store.set(PREFS_KEY, JSON.stringify({ hideBrand: true, hideNewSession: 'yes' }))
  assert.deepEqual(readPrefs(storage), DEFAULT_PREFS, 'a string field must reject the blob')
  store.set(PREFS_KEY, JSON.stringify({ hideBrand: true, hideSidebarToggle: 1 }))
  assert.deepEqual(readPrefs(storage), DEFAULT_PREFS, 'a numeric field must reject the blob')
  store.set(PREFS_KEY, JSON.stringify({ hideBrand: true, hideInputPlaceholder: null }))
  assert.deepEqual(readPrefs(storage), DEFAULT_PREFS, 'a null field must reject the blob')

  // Non-object blobs reject too.
  for (const raw of ['garbage', 'null', '[]', '"x"', '42']) {
    store.set(PREFS_KEY, raw)
    assert.deepEqual(readPrefs(storage), DEFAULT_PREFS, `blob ${raw} must reject to defaults`)
  }
})

test('seedFromLegacyPrefs carries the six switch values from the pre-split key once', async () => {
  const { seedFromLegacyPrefs, readPrefs, writePrefs, DEFAULT_PREFS, PREFS_KEY } =
    await import('../src/client/prefs.ts')
  const LEGACY = 'dsh-capability-toggle-plugin:panel-prefs'
  const { storage, store } = freshStore()

  // The legacy blob holds the panel's own display fields too — the seed reads
  // only the six chrome fields and ignores the rest.
  store.set(LEGACY, JSON.stringify({
    showFraction: true, showUsage: false, levels: 'all',
    hideBrand: true, hideLauncher: true, panelsInline: true,
    hideNewSession: true, hideSidebarToggle: true, hideInputPlaceholder: true,
  }))
  const seeded = seedFromLegacyPrefs(storage)
  assert.deepEqual(seeded, {
    hideBrand: true, hideLauncher: true, panelsInline: true,
    hideNewSession: true, hideSidebarToggle: true, hideInputPlaceholder: true,
  }, 'the seed must carry the six chrome values')
  assert.ok(store.has(PREFS_KEY), 'the seed must persist under the new key')
  assert.deepEqual(readPrefs(storage), seeded, 'readPrefs must serve the seeded values afterwards')
  assert.equal(store.get(LEGACY), JSON.stringify({
    showFraction: true, showUsage: false, levels: 'all',
    hideBrand: true, hideLauncher: true, panelsInline: true,
    hideNewSession: true, hideSidebarToggle: true, hideInputPlaceholder: true,
  }), 'the legacy key must never be written')

  // A second run must not re-seed over the user's own later changes: the own
  // key exists, so the legacy blob loses all influence.
  store.set(LEGACY, 'garbage')
  assert.equal(seedFromLegacyPrefs(storage), undefined, 'no re-seed once the own key exists')
  assert.deepEqual(readPrefs(storage), seeded)
})

test('seedFromLegacyPrefs upgrades a pre-chrome legacy blob to all-off and stays idempotent', async () => {
  const { seedFromLegacyPrefs, readPrefs, DEFAULT_PREFS, PREFS_KEY } =
    await import('../src/client/prefs.ts')
  const LEGACY = 'dsh-capability-toggle-plugin:panel-prefs'
  const { storage, store } = freshStore()

  // A legacy blob from before the chrome switches existed (only the panel's
  // own display fields): absence reads as off, and the seed marks the
  // migration done by persisting the all-off blob under the new key.
  store.set(LEGACY, JSON.stringify({ showFraction: true, showUsage: false, levels: 'session' }))
  const seeded = seedFromLegacyPrefs(storage)
  assert.deepEqual(seeded, DEFAULT_PREFS, 'missing chrome fields must seed as off')
  assert.ok(store.has(PREFS_KEY), 'the seed must persist even an all-off blob (one-time marker)')
  assert.equal(seedFromLegacyPrefs(storage), undefined, 'the seed must not run again')
})

test('seedFromLegacyPrefs no-ops on a missing, corrupt or unsafe legacy blob', async () => {
  const { seedFromLegacyPrefs, DEFAULT_PREFS, PREFS_KEY } =
    await import('../src/client/prefs.ts')
  const LEGACY = 'dsh-capability-toggle-plugin:panel-prefs'

  // No legacy key at all.
  const empty = freshStore()
  assert.equal(seedFromLegacyPrefs(empty.storage), undefined)
  assert.ok(!empty.store.has(PREFS_KEY), 'nothing may be written without a legacy blob')

  // Corrupt legacy blobs reject exactly like readPrefs does.
  for (const raw of ['garbage', 'null', '[]', '42']) {
    const s = freshStore()
    s.store.set(LEGACY, raw)
    assert.equal(seedFromLegacyPrefs(s.storage), undefined, `legacy blob ${raw} must not seed`)
    assert.ok(!s.store.has(PREFS_KEY), `legacy blob ${raw} must not write the new key`)
  }

  // A corrupt chrome field rejects the whole legacy blob: seeding half the
  // switches would flip the other half silently.
  const corrupt = freshStore()
  corrupt.store.set(LEGACY, JSON.stringify({ hideBrand: true, hideLauncher: 'yes' }))
  assert.equal(seedFromLegacyPrefs(corrupt.storage), undefined, 'a corrupt field must abort the seed')
  assert.ok(!corrupt.store.has(PREFS_KEY), 'an aborted seed must write nothing')

  // A storage that throws must never propagate: apply() runs before the whole
  // chrome installs, so a broken storage must degrade to defaults, not kill
  // the client boot.
  const throwing = {
    getItem: (): string | null => { throw new Error('blocked') },
    setItem: (): void => { throw new Error('blocked') },
    removeItem: (): void => {},
  }
  assert.equal(seedFromLegacyPrefs(throwing), undefined, 'a throwing storage must not seed')
  assert.deepEqual(
    (await import('../src/client/prefs.ts')).readPrefs(throwing),
    DEFAULT_PREFS,
    'a throwing storage must read as defaults',
  )
})

test('writePrefs notifies listeners before persisting, and a throwing storage degrades to a warning', async () => {
  const { writePrefs, onPrefsChanged, DEFAULT_PREFS } = await import('../src/client/prefs.ts')
  const { storage, store } = freshStore()

  // Notify-before-persist: the section flips its React state before calling
  // here, so the listener must run even when the storage write never lands.
  const order: string[] = []
  const seen: unknown[] = []
  const off = onPrefsChanged(p => { order.push('notify'); seen.push(p) })
  const next = { ...DEFAULT_PREFS, hideBrand: true }
  storage.setItem = (k: string, v: string) => { order.push('persist'); store.set(k, v) }
  writePrefs(next, storage)
  off()
  assert.deepEqual(order, ['notify', 'persist'], 'the listener must run before the storage write')
  assert.deepEqual(seen, [next], 'the listener must receive the exact written prefs')

  // A throwing storage keeps the notify (chrome applies the flip) and only
  // costs durability across reloads.
  const warned: unknown[][] = []
  const originalWarn = console.warn
  console.warn = (...args: unknown[]) => { warned.push(args) }
  try {
    const heard: unknown[] = []
    const off2 = onPrefsChanged(p => heard.push(p))
    writePrefs({ ...DEFAULT_PREFS, hideLauncher: true }, throwing2())
    off2()
    assert.equal(heard.length, 1, 'the flip must still reach the chrome listeners')
    assert.equal(warned.length, 1, 'the failed persist must warn exactly once')
    assert.match(String(warned[0]?.[0] ?? ''), /persisting ui prefs failed/, 'the warning must name the failure')
  } finally {
    console.warn = originalWarn
  }

  function throwing2() {
    return {
      getItem: (): string | null => null,
      setItem: (): void => { throw new Error('quota') },
      removeItem: (): void => {},
    }
  }
})

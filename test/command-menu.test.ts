/**
 * The command-menu filter: which Host names a switch hides, that the filter
 * only ever drops those names, and that the wrapper binds to a shell whose
 * command service publishes the directory seam — the state the Settings
 * self-check reads when an upgrade moves it.
 *
 * @module dsh-ui-toggle-plugin/test/command-menu
 */

import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { describe, test } from 'node:test'

import { HIDEABLE_COMMANDS, commandFilterState, filterCommandNames, hiddenCommandNames, installCommandFilter } from '../src/client/command-menu.ts'
import { DEFAULT_PREFS } from '../src/client/prefs.ts'
import type { UiPrefs } from '../src/client/prefs.ts'
import type { ClientContext } from '../src/client/types.ts'

const catalog = [
  { name: 'compact', description: 'Compress the conversation' },
  { name: 'feedback', description: 'Record feedback about this session' },
  { name: 'goal', description: 'Set a goal' },
]

const prefs = (over: Partial<UiPrefs>): UiPrefs => ({ ...DEFAULT_PREFS, ...over })

/** A client context that runs the inject callback immediately and keeps the effect. */
function fakeClient(directory: unknown): { ctx: ClientContext; stop: () => void } {
  const disposers: Array<() => void> = []
  const scope = {
    effect: (factory: () => (() => void) | void) => {
      const stop = factory()
      if (typeof stop === 'function') disposers.push(stop)
      return () => { stop?.() }
    },
  }
  const ctx = {
    effect: (factory: () => (() => void) | void) => scope.effect(factory),
    inject: (_services: readonly string[], callback: (inner: unknown) => void) => {
      callback({ ...scope, commandUi: { directory } })
      return () => {}
    },
  } as unknown as ClientContext
  return { ctx, stop: () => { for (const dispose of disposers) dispose() } }
}

describe('the hidden set', () => {
  test('every hideable family is a real pref key that starts off', () => {
    for (const family of HIDEABLE_COMMANDS) {
      assert.ok(family.key in DEFAULT_PREFS, `${family.key} must be a switch`)
      assert.equal(DEFAULT_PREFS[family.key], false, 'a fresh install hides nothing')
      assert.ok(family.names.length > 0, `${family.key} must name at least one command`)
    }
  })

  test('an off switch hides nothing and keeps the list identity', () => {
    const kept = filterCommandNames(catalog, DEFAULT_PREFS)
    assert.equal(kept, catalog, 'no filter means the same array, no copy')
  })

  test('the on switch drops only its own names', () => {
    const kept = filterCommandNames(catalog, prefs({ hideFeedbackCommand: true }))
    assert.deepEqual(kept.map(entry => entry.name), ['compact', 'goal'])
    assert.deepEqual([...hiddenCommandNames(prefs({ hideFeedbackCommand: true }))], ['feedback'])
  })
})

describe('the wrapper', () => {
  test('binds to the directory seam and filters what the menu reads', async () => {
    const directory = {
      calls: 0,
      ensureReady: () => { directory.calls += 1; return Promise.resolve(catalog) },
    }
    const { ctx, stop } = fakeClient(directory)
    installCommandFilter(ctx, () => prefs({ hideFeedbackCommand: true }))
    assert.equal(commandFilterState(), 'ok', 'the wrapper reports itself bound')
    assert.deepEqual((await directory.ensureReady({}, new AbortController().signal)).map(entry => entry.name), ['compact', 'goal'])
    stop()
  })

  test('reads the prefs on every call, so a flip reaches the next menu open', async () => {
    const directory = { ensureReady: () => Promise.resolve(catalog) }
    const { ctx, stop } = fakeClient(directory)
    let current = prefs({})
    installCommandFilter(ctx, () => current)
    assert.deepEqual((await directory.ensureReady({}, new AbortController().signal)).map(entry => entry.name),
      ['compact', 'feedback', 'goal'])
    current = prefs({ hideFeedbackCommand: true })
    assert.deepEqual((await directory.ensureReady({}, new AbortController().signal)).map(entry => entry.name),
      ['compact', 'goal'])
    stop()
  })

  test('a shell without the directory seam reports broken, not silence', () => {
    const { ctx } = fakeClient(undefined)
    installCommandFilter(ctx, () => DEFAULT_PREFS)
    assert.equal(commandFilterState(), 'broken', 'the upgrade warning must be reachable from here')
  })

  test('the wrapper leaves typed command resolution alone', () => {
    // The switch hides the menu row, not the command: a typed /feedback still
    // resolves through directory.resolve(), so the filter must never touch it.
    const source = readFileSync(new URL('../src/client/command-menu.ts', import.meta.url), 'utf8')
    const code = source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '')
    assert.doesNotMatch(code, /\.resolve\s*\(/, 'never patch resolve: the command stays runnable from the composer')
  })
})

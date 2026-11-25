/**
 * The self-check contract: one probe per switch, probes pinned to stable shell
 * hooks rather than to hash-scoped class names or localized copy, and the
 * verdict rules the Settings section renders (unseen screen: unknown, screen
 * without its anchor: broken, anchor seen: ok for the rest of the session).
 *
 * @module dsh-ui-toggle-plugin/test/health
 */

import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { describe, test } from 'node:test'

import { PROBES, healthReport, registerRuntimeProbe, resetHealth, scanHealth } from '../src/client/health.ts'
import type { HealthRoot } from '../src/client/health.ts'
import { HIDEABLE_COMMANDS } from '../src/client/command-menu.ts'
import { DEFAULT_PREFS } from '../src/client/prefs.ts'

const chromeSource = (): string => readFileSync(new URL('../src/client/chrome.ts', import.meta.url), 'utf8')

/** A document stand-in: reports exactly the selectors it was given as present. */
const documentWith = (present: readonly string[]): HealthRoot => ({
  querySelector: (selector: string) => (present.includes(selector) ? {} : null),
})

const stateOf = (key: string): string => healthReport().find(row => row.key === key)?.state ?? 'missing'

describe('the probe table', () => {
  test('covers every switch exactly once', () => {
    // Two probe kinds: a DOM anchor (most switches) and a runtime check for a
    // switch whose effect is a service wrapper rather than a node.
    const keys = [...PROBES.map(probe => probe.key), ...HIDEABLE_COMMANDS.map(family => family.key)]
    assert.deepEqual([...keys].sort(), Object.keys(DEFAULT_PREFS).sort(), 'every pref needs one probe, no extras')
    assert.equal(new Set(keys).size, keys.length, 'one probe per switch')
  })

  test('a runtime probe answers for its switch and wins over the DOM bookkeeping', () => {
    resetHealth()
    const dispose = registerRuntimeProbe('hideFeedbackCommand', () => 'broken')
    try {
      assert.equal(stateOf('hideFeedbackCommand'), 'broken')
      assert.equal(healthReport().filter(row => row.key === 'hideFeedbackCommand').length, 1, 'one row per switch')
    } finally {
      dispose()
      resetHealth()
    }
    assert.equal(healthReport().some(row => row.key === 'hideFeedbackCommand'), false, 'the disposer removes the probe')
  })

  test('anchors on stable hooks, never on hashed classes or copy', () => {
    for (const probe of PROBES) {
      for (const selector of [...probe.targets, probe.region]) {
        assert.match(selector, /data-slot=|data-composer-placeholder/, `must climb from a stable hook: ${selector}`)
        assert.doesNotMatch(selector, /_[a-zA-Z0-9]{4,}_/, `no hash-scoped class names: ${selector}`)
        assert.doesNotMatch(selector, /[\u4e00-\u9fff]/, `never match localized copy: ${selector}`)
        // A dot inside a slot NAME (sidebar.brand.name) is fine; what must not
        // appear is a class selector, which a hash rename would break.
        assert.doesNotMatch(selector, /\.(?!\d)[a-zA-Z]*[A-Z]/, `no class selectors: ${selector}`)
      }
    }
  })

  test('every target is a selector chrome.ts actually drives', () => {
    const chrome = chromeSource()
    for (const probe of PROBES) {
      for (const target of probe.targets) {
        const slot = /\[data-slot="([^"]+)"\]/.exec(target)?.[1]
        if (slot !== undefined) {
          // A CSS-driven switch names the anchor in a rule; a shadow-driven one
          // names the slot key in its slots.inject call. Both must still exist.
          assert.ok(
            chrome.includes(`data-slot="${slot}"`) || chrome.includes(`'${slot}'`),
            `chrome.ts must still act on ${slot}`,
          )
        } else {
          // The composer placeholder is an attribute, not a slot; it is only
          // valid where chrome.ts really ships a rule for it.
          assert.ok(target.includes('data-composer-placeholder'), `every target names a stable hook: ${target}`)
          assert.ok(chrome.includes('data-composer-placeholder'), 'chrome.ts must still ship the placeholder rule')
        }
      }
    }
  })

  test('regions are screens that can render before the anchor does', () => {
    for (const probe of PROBES) {
      assert.ok(
        probe.region.startsWith('[data-slot="'),
        `a region is always a slot anchor so its absence means "not on screen": ${probe.region}`,
      )
      assert.ok(!probe.targets.includes(probe.region), `a probe cannot use its own target as its region: ${probe.key}`)
    }
  })
})

describe('the verdict', () => {
  test('reports unknown until the screen behind a switch has rendered', () => {
    resetHealth()
    assert.ok(healthReport().every(row => row.state === 'unknown'))
  })

  test('a rendered screen without its anchor is broken', () => {
    resetHealth()
    scanHealth(documentWith(['[data-slot="sidebar.workspaces"]']))
    assert.equal(stateOf('hideNewSession'), 'broken')
    assert.equal(stateOf('hideInputPlaceholder'), 'unknown', 'a closed composer stays unknown, not broken')
  })

  test('a seen anchor clears the switch', () => {
    resetHealth()
    scanHealth(documentWith(['[data-slot="sidebar.workspaces"]', '[data-slot="sidebar.session.action"]']))
    assert.equal(stateOf('hideNewSession'), 'ok')
  })

  test('a switch stays ok after its anchor leaves the screen', () => {
    resetHealth()
    scanHealth(documentWith(['[data-slot="sidebar.workspaces"]', '[data-slot="sidebar.session.action"]']))
    assert.equal(stateOf('hideNewSession'), 'ok')
    scanHealth(documentWith(['[data-slot="sidebar.workspaces"]']))
    assert.equal(stateOf('hideNewSession'), 'ok', 'closing a conversation must not raise a false alarm')
  })

  test('one alternative anchor is enough', () => {
    resetHealth()
    const railOnly = documentWith(['[data-slot="sidebar.workspaces"]', '[data-slot="sidebar.toggle.badge"]'])
    scanHealth(railOnly)
    assert.equal(stateOf('hideSidebarToggle'), 'ok')
  })
})

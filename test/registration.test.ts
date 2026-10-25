/**
 * Registration suite for dsh-ui-toggle-plugin: pins the client body's shape
 * against the framework contract verified in the harness source — the
 * settings.section LIST slot, its nav entries (id/order/label resolved by
 * resolveSlotLabel), the shipped section orders (account -10, general 0,
 * models 10, plugins 15), and the one-time legacy seed running BEFORE the
 * chrome installs.
 *
 * @module dsh-ui-toggle-plugin/test/registration
 */

import { readFileSync } from 'node:fs'
import test from 'node:test'
import assert from 'node:assert/strict'

const clientSource = (rel: string): string =>
  readFileSync(new URL(`../src/client/${rel}`, import.meta.url), 'utf8')

test('the client body registers one settings.section entry after the shipped plugins section', () => {
  const index = clientSource('index.tsx')
  assert.match(index, /ctx\.slots\.inject\('settings\.section',/, 'the registration must wait for the shell\'s settings.section declaration')
  assert.match(index, /name: 'settings\.section',/, 'the registration must occupy the settings.section list slot')
  assert.match(index, /id: 'ui-toggle',/, 'the entry must carry the stable id ui-toggle')
  // Shipped orders: account -10, general 0, models 10, plugins 15. 20 lands
  // the section right after Plugins in the nav.
  assert.match(index, /order: 20,/, 'the entry must sort after the shipped plugins section (order 15)')
  assert.match(index, /label: \(\) => t\('nav'\),/, 'the nav label must localize through the bound translator, like the shipped sections')
  assert.match(index, /locale: NS,/, 'the registration must bind the plugin namespace so the framework injects t into the section')
  // The label translator comes from ctx.locale.bind — the same construction
  // the shipped settings-plugins section uses.
  assert.match(index, /const t = ctx\.locale\.bind\(NS\)/, 'the label must use the locale service\'s bind, never a hand-rolled dictionary lookup')
})

test('apply seeds the pre-split prefs once, before the chrome installs', () => {
  const index = clientSource('index.tsx')
  const seedAt = index.indexOf('seedFromLegacyPrefs()')
  const chromeAt = index.indexOf('installChrome(')
  assert.ok(seedAt > 0 && chromeAt > 0, 'apply must call both the seed and the chrome installer')
  assert.ok(seedAt < chromeAt, 'the seed must run before installChrome, so the chrome reads the migrated values')
})

test('the client half declares the cordis contract of a slots+locale plugin', () => {
  const index = clientSource('index.tsx')
  assert.match(index, /export const name = 'dsh-ui-toggle-plugin\/client'/, 'the client half must declare its cordis name')
  assert.match(index, /export const inject = \['slots', 'locale'\]/, 'the client half must inject exactly the slots and locale services')
})

test('the client half injects its slots through slots.inject and owns no other slot registrations', () => {
  const index = clientSource('index.tsx')
  const injects = [...index.matchAll(/ctx\.slots\.inject\('([^']+)'/g)].map(m => m[1])
  assert.deepEqual(injects, ['settings.section'], 'settings.section must be the only slot this half waits on')
  assert.doesNotMatch(index, /conversation\.input\.left/,
    'the panel-era input zone does not move over: this plugin owns only the Settings section')
})

test('the section stylesheet dedupes against the chrome sheet, not just the plugin id', () => {
  const styles = clientSource('styles.ts')
  assert.match(styles, /style\[data-plugin="\$\{STYLE_ID\}"\]:not\(\[data-plugin-css\]\)/,
    'the dedup must exclude the chrome sheet, which carries the same plugin id plus data-plugin-css')
})

test('the dsh manifest wires the client half for the web platform with the frame packages its slots live in', async () => {
  const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8')) as {
    dsh?: { client?: { platform?: string; inject?: string[] } }
  }
  assert.equal(pkg.dsh?.client?.platform, 'web', 'the client half must target the web platform')
  assert.deepEqual(pkg.dsh?.client?.inject, [
    '@deepseek-ai/dsh-client-locale',
    '@deepseek-ai/dsh-client-ui-conversation',
    '@deepseek-ai/dsh-client-ui-settings-general',
  ], 'the client inject list must name the frame packages the section and CSS anchors live in')
})

test('the section page pins the framework section-shell contract it relies on', () => {
  const section = clientSource('section.tsx')
  // The shell hands the section at least { t, renderSlot, close } (verified
  // from dsh-client-ui-settings-general renderSlot("settings.section", { close:
  // onClose }, { only: active })); the section reads only the translator and
  // tolerates the rest.
  assert.match(section, /props\.t \?\? passthrough/, 'the section must fall back to key passthrough before the translator is injected')
  const switches = [...section.matchAll(/key: '(\w+)'/g)].map(m => m[1]).sort()
  assert.deepEqual(switches, [
    'hideBrand', 'hideInputPlaceholder', 'hideLauncher',
    'hideNewSession', 'hideSidebarToggle', 'panelsInline',
  ], 'the section must expose exactly the six chrome switches')
})

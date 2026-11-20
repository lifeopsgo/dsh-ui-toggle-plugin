/**
 * Section suite for dsh-ui-toggle-plugin: renders the Settings configuration
 * page through the React 18 dispatcher harness and pins what the user sees —
 * the heading and intro, all seven switch rows with their addressing-hook
 * classes, the switch accessible names, and that a click goes through
 * writePrefs so the live chrome follows. The dshui-row-* modifier classes are
 * the stable addressing hooks the browser e2e selects rows by; this test pins
 * them so a rename cannot silently strand the selectors that drive the live
 * UI.
 *
 * @module dsh-ui-toggle-plugin/test/section
 */

import test from 'node:test'
import assert from 'node:assert/strict'
import { available, renderSection, userClick } from './render-harness.ts'

test('the React 18 hook dispatcher is available', () => {
  assert.ok(available, 'the dispatcher harness must install (React 19 removed the private internals)')
})

test('the section renders heading, intro and seven labelled switch rows', { skip: !available && 'needs the React 18 dispatcher' }, async () => {
  const { DEFAULT_PREFS } = await import('../src/client/prefs.ts')

  const t = (key: string): string => `T:${key}`
  const mounted = await renderSection({ t })
  assert.equal(mounted.find('dshui-heading')?.props.children, 'T:title', 'the heading must localize through t(title)')
  assert.equal(mounted.find('dshui-intro')?.props.children, 'T:intro', 'the intro must localize through t(intro)')

  const rows = [
    'hidebrand', 'hidelauncher', 'panelsinline',
    'hidenewsession', 'hidesidebartoggle', 'hideinputplaceholder',
    'hidepermissionlabel',
  ]
  for (const cls of rows) {
    const row = mounted.find(`dshui-row-${cls}`)
    assert.ok(row, `switch row dshui-row-${cls} must render with its modifier class`)
    const label = mounted.elements.find(el => el.props.id === `dshui-label-${cls}`)
    assert.ok(label, `row ${cls} must carry its label element with the dshui-label-${cls} id`)
    const labelChildren = label?.props.children
    // The label hosts the switch name and, when the probe fails, a badge beside
    // it, so the name is the first child rather than the only one.
    const labelText = Array.isArray(labelChildren) ? labelChildren[0] : labelChildren
    assert.ok(typeof labelText === 'string' && labelText.length > 0,
      `row ${cls} must render the localized label text`)
  }
  assert.equal(mounted.find('dshui-heading')?.tag, 'h2', 'the heading must be a real h2 for the section outline')
  assert.equal(mounted.findAll('dshui-switch').length, 7, 'exactly seven switches must render')
  for (const sw of mounted.findAll('dshui-switch')) {
    assert.equal(sw.props.role, 'switch', 'each toggle must expose the switch role')
    assert.equal(sw.props['aria-checked'], false, 'each switch must start off with the default prefs')
    assert.match(String(sw.props['aria-labelledby'] ?? ''), /^dshui-label-/,
      'each switch must name its label element')
  }
  assert.deepEqual(DEFAULT_PREFS, {
    hideBrand: false, hideLauncher: false, panelsInline: false,
    hideNewSession: false, hideSidebarToggle: false, hideInputPlaceholder: false,
    hidePermissionLabel: false,
  }, 'default prefs keep every element visible until the user opts in')
})

test('a switch the shell no longer backs is called out in the section', { skip: !available && 'needs the React 18 dispatcher' }, async () => {
  const { resetHealth, scanHealth } = await import('../src/client/health.ts')
  const t = (key: string): string => `T:${key}`
  // Sidebar rendered, composer not: the sidebar switches are judgeable, the
  // composer pair is not — exactly the state a user sees from the Settings page.
  resetHealth()
  scanHealth({ querySelector: selector => (selector === '[data-slot="sidebar.workspaces"]' ? {} : null) })
  try {
    const mounted = await renderSection({ t })
    const alert = mounted.find('dshui-alert')
    assert.ok(alert, 'the section must show the self-check banner')
    assert.equal(alert?.props.role, 'alert', 'the banner must reach assistive tech')
    const list = mounted.find('dshui-alert-list')
    const items = (Array.isArray(list?.props.children) ? list?.props.children : []) as { props: { children: unknown } }[]
    const named = items.map(item => item.props.children)
    assert.ok(named.includes('T:prefs.newsession'),
      'the banner must name the switch whose anchor never showed up')
    assert.equal(named.length, 4, 'the four sidebar switches are judgeable, the composer pair is not')
    assert.ok(!named.some(name => String(name).includes('prefs.inputplaceholder')),
      'a switch whose screen never rendered is not called broken')

    const brokenRow = mounted.find('dshui-row-hidenewsession')
    assert.equal(brokenRow?.props['data-health'], 'broken', 'the broken row carries its verdict')
    const badged = mounted.findAll('dshui-row-broken')
    assert.equal(badged.length, 4, 'every broken row gets the badge, and only those')
    assert.equal(badged[0]?.props.children, 'T:health.badge', 'the badge localizes')

    const unknownRow = mounted.find('dshui-row-hideinputplaceholder')
    assert.equal(unknownRow?.props['data-health'], 'unknown', 'an unrendered screen stays unknown')
  } finally {
    resetHealth()
  }
})

test('the section shows no banner when every anchor is present', { skip: !available && 'needs the React 18 dispatcher' }, async () => {
  const { healthReport, resetHealth, scanHealth } = await import('../src/client/health.ts')
  const { PROBES } = await import('../src/client/health.ts')
  resetHealth()
  scanHealth({
    querySelector: selector => (PROBES.some(probe => probe.region === selector || probe.targets.includes(selector)) ? {} : null),
  })
  try {
    assert.ok(healthReport().every(row => row.state === 'ok'), 'every probe is satisfied by the fixture')
    const mounted = await renderSection({ t: (key: string): string => `T:${key}` })
    assert.equal(mounted.find('dshui-alert'), undefined, 'a healthy shell shows no banner')
    assert.equal(mounted.findAll('dshui-row-broken').length, 0, 'no row carries the badge')
  } finally {
    resetHealth()
  }
})

test('clicking a switch goes through writePrefs and re-renders as on', { skip: !available && 'needs the React 18 dispatcher' }, async () => {
  const { onPrefsChanged, DEFAULT_PREFS } = await import('../src/client/prefs.ts')

  const heard: unknown[] = []
  const off = onPrefsChanged(p => heard.push(p))
  try {
    const t = (key: string): string => key
    const mounted = await renderSection({ t })
    const brandSwitch = mounted.findAll('dshui-switch')
      .find(el => el.props['aria-labelledby'] === 'dshui-label-hidebrand')
    assert.ok(brandSwitch, 'the brand row must carry its switch')
    userClick(brandSwitch)
    assert.deepEqual(heard, [{ ...DEFAULT_PREFS, hideBrand: true }],
      'the click must go through writePrefs so the live chrome follows immediately')

    // The optimistic setState must re-render the clicked switch as on.
    const re = await renderSection({ t }, true)
    const rebrand = re.findAll('dshui-switch')
      .find(el => el.props['aria-labelledby'] === 'dshui-label-hidebrand')
    assert.equal(rebrand?.props['aria-checked'], true, 'the flipped switch must render as on')
    const others = re.findAll('dshui-switch')
      .filter(el => el.props['aria-labelledby'] !== 'dshui-label-hidebrand')
    for (const el of others) {
      assert.equal(el.props['aria-checked'], false, 'the other switches must stay untouched')
    }

    userClick(rebrand)
    assert.equal(heard.length, 2, 'the second click must notify exactly once more')
    assert.deepEqual(heard[1], DEFAULT_PREFS,
      'the second click runs the second render\'s flip closure, so flipping back must notify the exact off-state')
  } finally {
    off()
  }
})

test('flipping several switches without a re-render keeps every earlier flip', { skip: !available && 'needs the React 18 dispatcher' }, async () => {
  const { onPrefsChanged, readPrefs, DEFAULT_PREFS, PREFS_KEY } = await import('../src/client/prefs.ts')
  const { store, storage } = (() => {
    const store = new Map<string, string>()
    return {
      store,
      storage: {
        getItem: (k: string) => store.get(k) ?? null,
        setItem: (k: string, v: string) => void store.set(k, v),
        removeItem: (k: string) => void store.delete(k),
      },
    }
  })()
  const originalStorage = (globalThis as { localStorage?: unknown }).localStorage
  ;(globalThis as { localStorage?: unknown }).localStorage = storage

  const heard: unknown[] = []
  const off = onPrefsChanged(p => heard.push(p))
  try {
    const t = (key: string): string => key
    // One render, seven clicks: the section's flip must read the PREVIOUS flip,
    // not the render-time snapshot. A stale closure here would persist only
    // the last switch and drop the other five — observed live before the fix.
    const mounted = await renderSection({ t })
    for (const cls of ['hidebrand', 'hidelauncher', 'panelsinline', 'hidenewsession', 'hidesidebartoggle', 'hideinputplaceholder', 'hidepermissionlabel']) {
      const sw = mounted.findAll('dshui-switch').find(el => el.props['aria-labelledby'] === `dshui-label-${cls}`)
      assert.ok(sw, `the ${cls} row must carry its switch`)
      userClick(sw)
    }
    assert.deepEqual(readPrefs(storage), {
      hideBrand: true, hideLauncher: true, panelsInline: true,
      hideNewSession: true, hideSidebarToggle: true, hideInputPlaceholder: true,
      hidePermissionLabel: true,
    }, 'every click in one batch must accumulate: a stale closure would persist only the last switch')
    assert.equal(heard.length, 7, 'each click must notify once')
    assert.deepEqual(heard[6], {
      hideBrand: true, hideLauncher: true, panelsInline: true,
      hideNewSession: true, hideSidebarToggle: true, hideInputPlaceholder: true,
      hidePermissionLabel: true,
    }, 'the final notification must carry all seven flips')
    assert.ok(store.has(PREFS_KEY), 'the batch must persist under the plugin key')
  } finally {
    off()
    ;(globalThis as { localStorage?: unknown }).localStorage = originalStorage
  }
})

test('re-mounting the section shows what the chrome applies, not a stale snapshot', { skip: !available && 'needs the React 18 dispatcher' }, async () => {
  const { writePrefs, DEFAULT_PREFS } = await import('../src/client/prefs.ts')
  const originalStorage = (globalThis as { localStorage?: unknown }).localStorage

  const freshStorage = (): unknown => {
    const store = new Map<string, string>()
    return {
      getItem: (k: string) => store.get(k) ?? null,
      setItem: (k: string, v: string) => void store.set(k, v),
      removeItem: (k: string) => void store.delete(k),
    }
  }
  try {
    const t = (key: string): string => key

    // Mount 1: a fresh store, every switch off.
    ;(globalThis as { localStorage?: unknown }).localStorage = freshStorage()
    const first = await renderSection({ t })
    assert.deepEqual(first.findAll('dshui-switch').map(s => s.props['aria-checked']),
      [false, false, false, false, false, false, false], 'a fresh store mounts with every switch off')

    // The chrome flips values through the same single write path while the
    // section is unmounted (the shell unmounts it whenever its nav row is
    // inactive). The page must re-read them on the next mount — that is the
    // contract the component header states.
    writePrefs({ ...DEFAULT_PREFS, hideBrand: true, hideInputPlaceholder: true })

    // Mount 2 (keepState=false clears the hook scopes, i.e. a fresh instance).
    const second = await renderSection({ t })
    const checked = second.findAll('dshui-switch').map(s => s.props['aria-checked'])
    assert.equal(checked[0], true, 'the remounted section must show the persisted brand switch')
    assert.equal(checked[5], true, 'the remounted section must show the persisted placeholder switch')
    assert.equal(checked[1], false, 'untouched switches must still read off')
  } finally {
    ;(globalThis as { localStorage?: unknown }).localStorage = originalStorage
  }
})

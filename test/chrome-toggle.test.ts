/**
 * Chrome suite for dsh-ui-toggle-plugin, ported from the panel-era batch the
 * plugin was split out of. These tests pin the contract between the six
 * switches and the DSH WebUI chrome they reshape:
 *   - the shadowing layer waits on exactly the three shipped slots and binds
 *     the plugin locale namespace (a bare register would kill the client boot);
 *   - every CSS hide targets an element, never a slot anchor (hiding an anchor
 *     would break every future occupant of that seat);
 *   - all CSS-gated switches share ONE style element composed by chromeCss;
 *   - the lifecycle test drives real flips through the listener path.
 *
 * @module dsh-ui-toggle-plugin/test/chrome-toggle
 */

import { readFileSync } from 'node:fs'
import test from 'node:test'
import assert from 'node:assert/strict'

const clientSource = (rel: string): string =>
  readFileSync(new URL(`../src/client/${rel}`, import.meta.url), 'utf8')

test('chrome shadowing declares waits on exactly the three shipped slots and binds the plugin locale', () => {
  const chrome = clientSource('chrome.ts')
  const slots = [...chrome.matchAll(/'(sidebar\.brand\.mark|sidebar\.brand\.name|settings\.launcher)'/g)]
    .map(m => m[1])
  assert.deepEqual(
    [...new Set(slots)].sort(),
    ['settings.launcher', 'sidebar.brand.mark', 'sidebar.brand.name'],
    'chrome.ts must shadow exactly sidebar.brand.mark, sidebar.brand.name and settings.launcher',
  )
  // Declarations appear when the frame entry materializes — AFTER this plugin's
  // apply runs — so the shadows must wait via inject; a bare register for an
  // undeclared slot throws and kills the whole client boot.
  const shadowSwitch = chrome.slice(chrome.indexOf('function shadowSwitch'), chrome.indexOf('function installChrome'))
  assert.match(shadowSwitch, /ctx\.slots\.inject\(\s*name,/, 'shadowSwitch must go through slots.inject')
  assert.match(shadowSwitch, /replacement \?\? Hidden/,
    'the shadow occupant registers the replacement (settings-only launcher) or Hidden at the shadow priority')
  assert.match(shadowSwitch, /locale: NS/,
    'every shadow must bind the plugin locale namespace so the framework injects the translator into the replacement')
  assert.match(chrome, /SHADOW_PRIORITY = -\d+/, 'the shadow priority must be an explicit negative constant')
})

test('both chrome shadows follow their prefs live', () => {
  const chrome = clientSource('chrome.ts')
  assert.match(chrome, /p => p\.hideBrand/, 'brand shadowing must consult prefs.hideBrand')
  assert.match(chrome, /p => p\.hideLauncher/, 'launcher shadowing must consult prefs.hideLauncher')
  assert.match(chrome, /dispose\?\.\(\)/, 'the shadow registrations must be revocable so toggling the pref does not need a restart')
})

test('the CSS-gated switches key their rule sets off their prefs', () => {
  const chrome = clientSource('chrome.ts')
  // One composer assembles the injected sheet from whichever prefs are on, so
  // every pref flip lands as one textContent update on a single element —
  // no orphaned style tags per switch.
  assert.match(chrome, /function chromeCss\(/, 'a single composer must build the injected chrome CSS')
  const composer = chrome.slice(chrome.indexOf('function chromeCss'), chrome.indexOf('const PANEL_CSS'))
  assert.ok(composer.length > 0, 'the composer block must sit before the rule constants')
  assert.match(composer, /prefs\.hideBrand/, 'hiding the brand must drop a CSS block too (the empty shell button)')
  assert.match(composer, /prefs\.panelsInline/, 'the horizontal panel layout must be CSS-gated off prefs.panelsInline')
  assert.match(composer, /prefs\.hideNewSession/, 'the New Session hide must be CSS-gated off prefs.hideNewSession')
  assert.match(composer, /prefs\.hideSidebarToggle/, 'the collapse-toggle hide must be CSS-gated off prefs.hideSidebarToggle')
  assert.match(composer, /prefs\.hideInputPlaceholder/, 'the input placeholder hide must be CSS-gated off prefs.hideInputPlaceholder')
  assert.match(composer, /prefs\.hideBrand && prefs\.hideSidebarToggle/,
    'the wide logo row may only collapse when BOTH the brand and the toggle are hidden — one visible child keeps the row')
})

test('the replacement launcher localizes through the plugin namespace', () => {
  const chrome = clientSource('chrome.ts')
  assert.match(chrome, /props\.t\?\.\('launcher\.settings'\) \?\? 'Settings'/,
    'the settings-only button must translate its label when the translator is injected, keeping the English fallback')
})

test('the New Session, collapse-toggle and placeholder rules hide their own elements, never slots', () => {
  const chrome = clientSource('chrome.ts')
  // The New Session button is not behind a slot; it is the only direct-child
  // <button> of the sidebar root column, whose identity is pinned from the
  // workspaces slot anchor two levels down.
  assert.match(chrome, /div:has\(> div > \[data-slot="sidebar\.workspaces"\]\) > button\{display:none!important\}/,
    'the New Session button must be reached structurally from the workspaces anchor and hidden outright')
  // Wide state: the logo row is the div with a direct button child hosting the
  // brand-mark anchor, and the collapse toggle is its button WITHOUT a slot
  // anchor inside (the brand button carries both brand anchors).
  assert.match(chrome, /div:has\(> button \[data-slot="sidebar\.brand\.mark"\]\) > button:not\(:has\(\[data-slot\]\)\)\{display:none!important\}/,
    'the wide-state collapse toggle must be the logo row button without slot content')
  // Rail state: the brand button is gone and the toggle itself directly hosts
  // the toggle-badge slot anchor, which renders in every collapsed column.
  assert.match(chrome, /div:has\(> button > \[data-slot="sidebar\.toggle\.badge"\]\) > button\{display:none!important\}/,
    'the rail-state collapse toggle must be pinned from its direct badge anchor')
  // The brand hide drops the wide shell's own brand button (the shadows empty
  // the anchors but leave an invisible, focusable, session-starting button
  // behind); the button is the logo row's only one hosting the wordmark anchor.
  assert.match(chrome, /> button:has\(\[data-slot="sidebar\.brand\.name"\]\)\{display:none!important\}/,
    'the emptied brand button must be dropped whole, not left as an invisible click target')
  // The shell gives the logo row a FIXED height (it doubles as the window
  // drag strip), so an emptied row still shows as a blank block at the top.
  // When nothing visible remains inside, the row itself must go:
  // - wide row: unique as the div whose direct button child hosts the WORDMARK
  //   anchor (the rail renders no wordmark), and only when BOTH the brand
  //   button and the toggle are hidden;
  // - rail row: its only child IS the toggle, so hiding the toggle alone
  //   empties it — the badge anchor the toggle directly hosts pins it.
  assert.match(chrome, /div:has\(> button \[data-slot="sidebar\.brand\.name"\]\)\{display:none!important\}/,
    'the emptied wide logo row must collapse so the content below moves up')
  assert.match(chrome, /div:has\(> button > \[data-slot="sidebar\.toggle\.badge"\]\)\{display:none!important\}/,
    'the emptied rail logo row must collapse once its only child toggle is hidden')
  // The composer placeholder is not a textarea ::placeholder but an aria-hidden
  // div carrying the shell-stable `data-composer-placeholder` attribute — the
  // only framework-wide occurrence — whose text has SEVEN localized variants
  // (placeholder.default/hero/plan/steerQueue/unavailable/parentOffline/
  // workspace in the shipped dictionary), so the attribute is the only stable
  // thing to anchor on, never the copy. Hiding the div leaves the editable's
  // aria-label untouched, so screen readers still announce the field.
  assert.match(chrome, /div\[data-composer-placeholder\]\{display:none!important\}/,
    'the composer placeholder must be hidden via its stable attribute anchor')
  // Every outright hide targets a BUTTON element, one of the two logo-row divs,
  // or the placeholder div; only the panel-label rule may hide a span. A slot
  // anchor itself must never be a hide target — hiding it would break every
  // future occupant of that seat.
  const hideRules = [...chrome.matchAll(/\n([^\n]*display:none!important\})/g)].map(m => m[1])
  const divRules = [
    'div:has(> button [data-slot="sidebar.brand.name"]){display:none!important}',
    'div:has(> button > [data-slot="sidebar.toggle.badge"]){display:none!important}',
    'div[data-composer-placeholder]{display:none!important}',
  ]
  for (const divRule of divRules) {
    assert.ok(hideRules.includes(divRule), `the structural div-hide rule must exist verbatim: ${divRule}`)
  }
  // Only the panel-label rule may hide a span, pinned verbatim rather than by
  // substring so a future rule that merely CONTAINS "span:last-child" cannot
  // slip past the button-pattern check below.
  const spanRules = [
    'nav:has(button [data-slot="sidebar.panellist"]) > button > span:last-child{display:none!important}',
  ]
  for (const spanRule of spanRules) {
    assert.ok(hideRules.includes(spanRule), `the label-hide rule must exist verbatim: ${spanRule}`)
  }
  const buttonHides = hideRules.filter(rule => !spanRules.includes(rule) && !divRules.includes(rule))
  assert.ok(buttonHides.length >= 4, 'expected at least the four button-hide rules')
  for (const rule of buttonHides) {
    assert.match(rule, /> button(:not\(:has\(\[data-slot\]\)\))?(:has\(\[data-slot="sidebar\.brand\.name"\]\))?\{display:none!important\}$/,
      `an outright hide must target a button or a structural div, never a slot anchor: ${rule}`)
  }
})

test('panel layout CSS targets the slot anchor, never hash class names', () => {
  const chrome = clientSource('chrome.ts')
  assert.match(chrome, /nav:has\(button \[data-slot="sidebar\.panellist"\]\)/,
    'the layout must climb from the stable data-slot anchor to the shell nav')
  // A canary against TODAY'S DSH build only: the hash prefix is regenerated
  // when the shipped bundle rebuilds, at which point this stays green even if
  // a future edit copies a (differently hashed) class name in. The structural
  // selectors above are the real guarantee; this just catches a relapse while
  // the current prefix is what a copy-paste would reach for.
  assert.doesNotMatch(chrome, /hHd-Xa/,
    'hash-scoped class names are build artifacts of the DSH bundle and must not be matched')
  assert.doesNotMatch(chrome, /panelRow|panelList/,
    'the shipped panel CSS class names may change; only the stable anchor may be matched')
})

test('panel layout CSS keeps rows tappable and collapses the rail', () => {
  const chrome = clientSource('chrome.ts')
  assert.match(chrome, /flex-direction:\s*row/,
    'the layout must switch the panel list to a horizontal flow')
  assert.match(chrome, /flex-wrap:\s*wrap/,
    'overflowing entries must wrap to the next line, not overflow')
  assert.match(chrome, /\[data-sidebar-collapsed="true"\]/,
    'the collapsed rail must be restored to the stock vertical layout')
  assert.match(chrome, /> button > span:last-child\{display:none/,
    'the wide-state label span must be hidden (a display:none span receives no events)')
})

test('shadowSwitch registers at the shadow priority and disposes when the pref flips off', async () => {
  const { installChrome } = await import('../src/client/chrome.ts')
  const { DEFAULT_PREFS } = await import('../src/client/prefs.ts')

  interface Call { readonly op: 'register' | 'dispose'; readonly name?: string; readonly priority?: number }
  const calls: Call[] = []
  const registrations = new Map<string, () => void>()

  const makeCtx = () => ({
    slots: {
      inject(key: string, callback: () => (() => void) | void): () => void {
        // The real inject waits for the declaration; the fake runs the effect
        // immediately — enough to exercise the register/dispose sequence.
        const dispose = callback()
        return () => (typeof dispose === 'function' ? dispose() : undefined)
      },
      register(spec: { name: string; priority?: number; locale?: string }, component: unknown): () => void {
        assert.equal(spec.priority, -99, 'the shadow must register at the explicit negative priority')
        assert.equal(spec.locale, 'dsh-ui-toggle-plugin',
          'the shadow must bind the plugin locale namespace so the replacement receives a translator')
        if (spec.name === 'settings.launcher') {
          assert.equal((component as { name?: string }).name, 'SettingsOnlyButton',
            'the launcher seat must be replaced by the settings-only button, never emptied')
        } else {
          assert.equal((component as { name?: string }).name, 'Hidden',
            'brand slots must be emptied by the null component')
        }
        calls.push({ op: 'register', name: spec.name, priority: spec.priority })
        const dispose = () => calls.push({ op: 'dispose', name: spec.name })
        registrations.set(spec.name, dispose)
        return dispose
      },
    },
    effect(factory: () => (() => void) | void): () => void {
      const dispose = factory()
      return () => (typeof dispose === 'function' ? dispose() : undefined)
    },
  })

  let prefs = { ...DEFAULT_PREFS }
  const listeners = new Set<(p: typeof prefs) => void>()
  const ctx = makeCtx()

  // The CSS-gated switches touch document, which this node process has no DOM
  // for — stub the minimal surface for the whole sequence (hideBrand is now
  // slot-shadowed AND CSS-gated) and record the style-element lifecycle.
  interface StubEl { dataset: Record<string, string>; textContent: string; removed: boolean; remove(): void }
  const created: StubEl[] = []
  const originalDocument = (globalThis as { document?: unknown }).document
  ;(globalThis as { document?: unknown }).document = {
    createElement: () => {
      const el: StubEl = { dataset: {}, textContent: '', removed: false, remove() { el.removed = true } }
      created.push(el)
      return el
    },
    head: { appendChild: () => {} },
  }

  try {
    installChrome(ctx as never, () => prefs, listener => {
      listeners.add(listener)
      return () => listeners.delete(listener)
    })

    // Defaults: nothing hidden, nothing registered, no sheet.
    assert.equal(calls.filter(c => c.op === 'register').length, 0, 'no shadow with default prefs')
    assert.equal(created.length, 0, 'no CSS block with default prefs')

    // Flip hideLauncher on: exactly one register, at the shadow priority. The
    // launcher has no CSS block, so no style element appears for it.
    prefs = { ...prefs, hideLauncher: true }
    listeners.forEach(l => l(prefs))
    assert.deepEqual(
      calls.filter(c => c.op === 'register').map(c => `${c.name}@${c.priority}`),
      ['settings.launcher@-99'],
    )
    assert.equal(created.length, 0, 'the launcher replacement alone must not create a style element')

    // Flip it off: the registration must be disposed, not left behind.
    prefs = { ...prefs, hideLauncher: false }
    listeners.forEach(l => l(prefs))
    assert.deepEqual(
      calls.filter(c => c.name === 'settings.launcher').map(c => c.op),
      ['register', 'dispose'],
      'turning the switch off must dispose the launcher shadow',
    )

    // Flip hideBrand on: both brand slots register AND the emptied shell button
    // is dropped by CSS — one sheet, no second element.
    prefs = { ...prefs, hideBrand: true }
    listeners.forEach(l => l(prefs))
    assert.equal(created.length, 1, 'hiding the brand must create the shared chrome sheet')
    assert.match(created[0].textContent, /sidebar\.brand\.name/,
      'the brand block must drop the emptied shell button')
    assert.doesNotMatch(created[0].textContent, /div:has\(> button \[data-slot="sidebar\.brand\.name"\]\)\{/,
      'with the toggle still switchable to visible, the wide logo row must NOT collapse')
    assert.equal(created[0].removed, false)
    // Flipping hideBrand off disposes both shadows and removes the sheet again.
    prefs = { ...prefs, hideBrand: false }
    listeners.forEach(l => l(prefs))
    const brandOps = calls.filter(c => c.name?.startsWith('sidebar.brand'))
    assert.deepEqual(
      brandOps.map(c => c.op === 'register' ? `${c.op}:${c.name}@${c.priority}` : `${c.op}:${c.name}`),
      [
        'register:sidebar.brand.mark@-99',
        'register:sidebar.brand.name@-99',
        'dispose:sidebar.brand.mark',
        'dispose:sidebar.brand.name',
      ],
      'brand shadowing must register both slots and dispose both in order',
    )
    assert.equal(created[0].removed, true, 'turning hideBrand off must remove the sheet with no rule left')

    // One style element serves every CSS-gated switch: turning more switches
    // on must UPDATE its textContent, not append a second element; turning
    // them all off must remove it again.
    const before = calls.length
    prefs = { ...prefs, panelsInline: true }
    listeners.forEach(l => l(prefs))
    assert.equal(calls.length, before, 'the CSS-gated switches must not register slot occupants')
    assert.equal(created.length, 2, 'the chrome CSS lives in one element per creation cycle')
    assert.match(created[1].dataset.pluginCss ?? '', /chrome/, 'the style element must be tagged for the plugin')
    assert.match(created[1].textContent, /sidebar\.panellist/, 'the panel layout rules must be present')

    prefs = { ...prefs, hideNewSession: true }
    listeners.forEach(l => l(prefs))
    assert.equal(created.length, 2, 'a second switch must update the same style element')
    assert.match(created[1].textContent, /sidebar\.workspaces/, 'the New Session rule must join the same sheet')
    assert.match(created[1].textContent, /sidebar\.panellist/, 'the earlier rules must stay after the update')

    prefs = { ...prefs, hideInputPlaceholder: true }
    listeners.forEach(l => l(prefs))
    assert.equal(created.length, 2, 'the placeholder hide must update the same style element')
    assert.match(created[1].textContent, /div\[data-composer-placeholder\]\{display:none!important\}/,
      'the composer placeholder rule must join the same sheet')
    assert.equal(calls.length, before, 'the placeholder hide must not register slot occupants')

    prefs = { ...prefs, hideSidebarToggle: true }
    listeners.forEach(l => l(prefs))
    assert.equal(created.length, 2)
    assert.match(created[1].textContent, /sidebar\.toggle\.badge/, 'the collapse-toggle rules must join the same sheet')
    assert.match(created[1].textContent, /div:has\(> button > \[data-slot="sidebar\.toggle\.badge"\]\)\{display:none!important\}/,
      'hiding the rail toggle must also collapse the rail logo row (its only child)')
    assert.doesNotMatch(created[1].textContent, /div:has\(> button \[data-slot="sidebar\.brand\.name"\]\)\{/,
      'the wide logo row must NOT collapse while the brand button could still show')
    assert.equal(calls.length, before, 'the two button hides must not register slot occupants either')

    // The wide logo row collapses only when BOTH its children (brand button,
    // toggle) are hidden: flip hideBrand with the toggle still hidden.
    prefs = { ...prefs, hideBrand: true }
    listeners.forEach(l => l(prefs))
    assert.match(created[1].textContent, /div:has\(> button \[data-slot="sidebar\.brand\.name"\]\)\{display:none!important\}/,
      'with brand AND toggle both hidden, the emptied wide logo row must collapse')
    assert.equal(calls.length, before + 2, 'flipping hideBrand must register the two brand shadows')

    prefs = { ...prefs, panelsInline: false, hideNewSession: false, hideInputPlaceholder: false, hideSidebarToggle: false, hideBrand: false }
    listeners.forEach(l => l(prefs))
    assert.equal(created.length, 2, 'no new element may appear when every switch turns off')
    assert.equal(created[1].removed, true, 'the style element must be removed once no rule remains')
    assert.equal(calls.filter(c => c.name?.startsWith('sidebar.brand')).length, 8,
      'both brand shadows must have registered and disposed across the whole sequence')
  } finally {
    ;(globalThis as { document?: unknown }).document = originalDocument
  }
})

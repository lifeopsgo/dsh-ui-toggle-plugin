/**
 * Sidebar chrome switches and the horizontal global-panel layout.
 *
 * The shipped blocks this module can hide come in two kinds.
 *
 * Behind a slot: the brand mark and wordmark are single slots
 * (`sidebar.brand.mark`, `sidebar.brand.name`) registered by
 * `dsh-client-ui-brand-official`, and the sidebar foot's launcher seat is the
 * single slot `settings.launcher` registered by `dsh-client-ui-settings-account`.
 * A single slot renders exactly one occupant — the runner allocates each
 * dynamic registration a unique negative priority (`--nextPriority`, see
 * dsh-cordis-client-runner), and the renderer takes the lowest. A dynamic
 * registration therefore shadows the shipped occupant, and unregistering it
 * restores the original — which is what makes a live pref toggle possible
 * without a reload.
 *
 * Shadowing alone is not the whole story for the brand: emptying the anchors
 * leaves the shell's wide brand BUTTON mounted — invisible but still
 * focusable, still starting a session on click — so the brand pref also
 * drops that button via the CSS sheet below. The rail fish mark needs no CSS:
 * it renders THROUGH the shadowed mark anchor inside the collapse toggle.
 *
 * The launcher seat deserves care: the shipped occupant is the ACCOUNT MENU,
 * and the SETTINGS GEAR BUTTON is that same slot's fallback — emptying the
 * seat removes Settings too. "Hide the account menu" therefore replaces the
 * occupant with a minimal settings-only button (official gear glyph, official
 * `openSettings` callback from the owner share, label localized through the
 * plugin's own namespace) rather than rendering nothing.
 *
 * NOT behind a slot: the New Session button and the collapse-sidebar toggle
 * are hardcoded in the sidebar shell (dsh-client-ui-sidebar's SidebarRoot), so
 * they cannot be shadowed — they are CSS-gated like the panel layout below,
 * and their selectors still climb only from the renderer's stable
 * `[data-slot]` anchors (never from hash-scoped class names or locale copy):
 * the New Session button is the only direct-child button of the root column
 * (the shell's Tooltip clones its handlers onto the button and wraps nothing),
 * and the collapse toggle is a button of the logo row — the wide one without
 * slot content beside the brand button, the rail one directly hosting the
 * `sidebar.toggle.badge` anchor. The logo row itself has a shell-fixed
 * height (it doubles as the window-drag strip), so once its switches hide
 * everything inside it, the row is dropped too — otherwise the emptied row
 * lingers as a blank block at the sidebar top.
 *
 * Also NOT behind a slot: the composer's placeholder text. The shell renders
 * it as an aria-hidden div with the stable `data-composer-placeholder`
 * attribute (the only occurrence framework-wide), and the copy itself has
 * several localized variants, so the rule anchors on the attribute, never
 * on the text.
 *
 * The shadows must go through `ctx.slots.inject`, NOT a bare `register`: slot
 * declarations appear when the frame entry materializes, which happens after
 * this plugin's apply runs, and a register for an undeclared slot throws.
 * `inject` waits for the declaration, and its callback effect disposes when
 * the declaration goes away.
 *
 * The panel layout is CSS-only for the same reason: `sidebar.panellist` is a
 * list slot and its consumer (the sidebar shell) owns the row-per-entry
 * layout, so the plugin contributes no component there. All CSS-gated prefs
 * share ONE style element composed by `chromeCss`: turning switches on and off
 * updates that single element's textContent, and removing it restores stock.
 *
 * @module dsh-ui-toggle-plugin/client/chrome
 */

import { createElement } from 'react'
import type { CSSProperties, ReactElement } from 'react'

import { NS } from './locales.ts'
import type { UiPrefs } from './prefs.ts'
import type { SlotSpec, Translate } from './types.ts'

/** Null component: occupies a single slot so the shipped occupant loses. */
function Hidden(): null {
  return null
}

/**
 * Minimal replacement launcher: the Settings gear only. Glyph traces the
 * official IconSettingsOutlineMedium outline; layout mirrors the shipped
 * trigger row so the two states read identically. The accessible name and
 * wide-state text localize through the plugin's own namespace (the shadow
 * registers with `locale: NS`, so the framework injects the translator as
 * the `t` prop); 'Settings' stays as the pre-registration fallback.
 */
function SettingsOnlyButton(props: LauncherOwnerProps): ReactElement {
  const wide = props.wide === true
  const label = props.t?.('launcher.settings') ?? 'Settings'
  const icon: CSSProperties = { display: 'block', flex: 'none' }
  return createElement(
    'div',
    {
      style: { display: 'flex', alignItems: 'center', minWidth: 0, width: '100%' },
    },
    createElement(
      'button',
      {
        type: 'button',
        onClick: () => props.openSettings(),
        'aria-label': label,
        title: label,
        style: {
          background: 'none',
          border: 'none',
          borderRadius: 'var(--dsw-radius-sm, 6px)',
          color: 'var(--dsw-alias-label-secondary, inherit)',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          minHeight: 36,
          minWidth: 0,
          padding: wide ? '7px 8px' : 0,
          width: wide ? undefined : 36,
          justifyContent: wide ? 'flex-start' : 'center',
          margin: '0 auto',
          font: 'inherit',
        },
      },
      createElement(
        'svg',
        { width: 16, height: 16, viewBox: '0 0 16 16', fill: 'none', 'aria-hidden': 'true', style: icon },
        createElement('path', {
          d: 'M8 9.75012C8.9665 9.75012 9.75 8.96662 9.75 8.00012C9.75 7.03362 8.9665 6.25012 8 6.25012C7.0335 6.25012 6.25 7.03362 6.25 8.00012C6.25 8.96662 7.0335 9.75012 8 9.75012Z',
          stroke: 'currentColor',
        }),
        createElement('path', {
          d: 'M13.0107 7.79377C12.9505 7.89401 12.9205 7.94413 12.9205 7.99951C12.9205 8.0549 12.9505 8.10502 13.0106 8.20528L13.9849 9.83006C14.045 9.93029 14.0751 9.9804 14.0751 10.0358C14.0751 10.0911 14.045 10.1413 13.9849 10.2415L13.0037 11.8777C12.9468 11.9726 12.9184 12.0201 12.8725 12.0461C12.8267 12.072 12.7713 12.072 12.6607 12.072H10.6704C10.5598 12.072 10.5045 12.072 10.4586 12.098C10.4128 12.1239 10.3843 12.1714 10.3274 12.2662L9.33825 13.9142C9.28133 14.009 9.25287 14.0564 9.20703 14.0823C9.16118 14.1083 9.10588 14.1083 8.99529 14.1083H7.00486C6.89426 14.1083 6.83896 14.1083 6.79312 14.0823C6.74727 14.0564 6.71881 14.009 6.6619 13.9142L5.67273 12.2662C5.61581 12.1714 5.58735 12.1239 5.54151 12.098C5.49566 12.072 5.44036 12.072 5.32977 12.072H3.33945C3.2288 12.072 3.17347 12.072 3.12761 12.0461C3.08176 12.0201 3.0533 11.9726 2.9964 11.8777L2.0152 10.2415C1.9551 10.1413 1.92505 10.0911 1.92505 10.0358C1.92505 9.9804 1.9551 9.93029 2.0152 9.83006L2.98951 8.20528C3.04963 8.10502 3.07969 8.0549 3.07969 7.99951C3.07968 7.94413 3.04961 7.89401 2.98946 7.79377L2.01529 6.17011C1.95514 6.06987 1.92507 6.01975 1.92507 5.96437C1.92506 5.90899 1.95512 5.85886 2.01524 5.7586L2.9964 4.1224C3.0533 4.0275 3.08176 3.98005 3.12761 3.95408C3.17347 3.92811 3.2288 3.92811 3.33945 3.92811H5.32977C5.44036 3.92811 5.49566 3.92811 5.54151 3.90216C5.58735 3.87621 5.61581 3.82879 5.67273 3.73397L6.6619 2.08599C6.71881 1.99116 6.74727 1.94375 6.79312 1.9178C6.83896 1.89185 6.89426 1.89185 7.00486 1.89185H8.99529C9.10588 1.89185 9.16118 1.89185 9.20703 1.9178C9.25287 1.94375 9.28133 1.99116 9.33825 2.08599L10.3274 3.73397C10.3843 3.82879 10.4128 3.87621 10.4586 3.90216C10.5045 3.92811 10.5598 3.92811 10.6704 3.92811H12.6607C12.7713 3.92811 12.8267 3.92811 12.8725 3.95408C12.9184 3.98005 12.9468 4.0275 13.0037 4.1224L13.9849 5.7586C14.045 5.85886 14.0751 5.90899 14.0751 5.96437C14.0751 6.01975 14.045 6.06987 13.9849 6.17011L13.0107 7.79377Z',
          stroke: 'currentColor',
        }),
      ),
      wide
        ? createElement(
            'span',
            { style: { overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' } },
            label,
          )
        : null,
    ),
  )
}

/** The owner share the launcher seat receives (see the settings slot contract). */
interface LauncherOwnerProps {
  /** Whether the sidebar shows labels. */
  readonly wide?: boolean
  /** Open the settings panel. */
  readonly openSettings: () => void
  /** Translator bound from the plugin namespace; injected via the registration spec's `locale`. */
  readonly t?: Translate
}

/**
 * The slice of the client context chrome needs. The register spec reuses the
 * shared registration shape (see ./types.ts) — the shadow needs its name, the
 * load-bearing priority and the locale binding.
 */
interface ChromeContext {
  readonly slots: {
    /** Wait for `name`'s declaration, then run the effect for its lifetime. */
    inject(name: string, callback: () => (() => void) | void): () => void
    register(spec: Pick<SlotSpec, 'name' | 'priority' | 'locale'>, component: unknown): () => void
  }
  effect(factory: () => (() => void) | void, label?: string): () => void
}

/**
 * One live switch over one single slot: the replacement registers while `take`
 * holds and unregisters when it does not. The inject callback installs the
 * sync listener for the declaration's lifetime; the registration itself is
 * added and removed as the pref flips. A failed registration warns and is
 * retried on the next pref flip instead of killing the effect.
 *
 * The explicit negative priority is load-bearing: a profile bundle's ctx is
 * not wrapped by the runner's dynamic guard (that wraps only runtime-loaded
 * packages), so `register` without a priority lands at 0 and races the
 * shipped occupant — whoever registers first after the declaration wins, and
 * for the brand slots that is the official package. Shadowing must win the
 * race outright, hence SHADOW_PRIORITY.
 */
const SHADOW_PRIORITY = -99

function shadowSwitch(
  ctx: ChromeContext,
  name: string,
  take: (prefs: UiPrefs) => boolean,
  getPrefs: () => UiPrefs,
  onPrefsChange: (listener: (prefs: UiPrefs) => void) => () => void,
  replacement?: unknown,
): void {
  ctx.slots.inject(name, () => {
    let dispose: (() => void) | undefined
    const sync = (prefs: UiPrefs): void => {
      if (take(prefs)) {
        if (dispose === undefined) {
          try {
            dispose = ctx.slots.register(
              { name, priority: SHADOW_PRIORITY, locale: NS },
              replacement ?? Hidden,
            )
          } catch (error) {
            // A rejected registration is retried on the next pref flip, but it
            // must not stay silent: without the shadow the element reappears
            // with no visible cause.
            console.warn(`ui-toggle: shadowing ${name} failed:`, error)
            dispose = undefined
          }
        }
      } else {
        dispose?.()
        dispose = undefined
      }
    }
    sync(getPrefs())
    const off = onPrefsChange(sync)
    return () => {
      off()
      dispose?.()
      dispose = undefined
    }
  })
}

/**
 * Install the chrome effects. Call once from the client body: the shadows and
 * the composed stylesheet follow their prefs live.
 * @param ctx - the client root context.
 * @param getPrefs - current prefs; re-read whenever a shadow syncs.
 * @param onPrefsChange - subscribed by the effects so flipping a switch
 *   takes effect immediately, not on next launch.
 */
export function installChrome(
  ctx: ChromeContext,
  getPrefs: () => UiPrefs,
  onPrefsChange: (listener: (prefs: UiPrefs) => void) => () => void,
): void {
  shadowSwitch(ctx, 'sidebar.brand.mark', p => p.hideBrand, getPrefs, onPrefsChange)
  shadowSwitch(ctx, 'sidebar.brand.name', p => p.hideBrand, getPrefs, onPrefsChange)
  shadowSwitch(ctx, 'settings.launcher', p => p.hideLauncher, getPrefs, onPrefsChange, SettingsOnlyButton)

  ctx.effect(() => {
    let el: HTMLStyleElement | undefined
    const sync = (prefs: UiPrefs): void => {
      const css = chromeCss(prefs)
      if (css === '') {
        el?.remove()
        el = undefined
        return
      }
      if (el === undefined) {
        el = document.createElement('style')
        el.dataset.plugin = 'dsh-ui-toggle-plugin'
        el.dataset.pluginCss = 'chrome'
        document.head.appendChild(el)
      }
      if (el.textContent !== css) el.textContent = css
    }
    sync(getPrefs())
    const off = onPrefsChange(sync)
    return () => {
      off()
      el?.remove()
      el = undefined
    }
  }, 'ui-toggle: chrome css')
}

/**
 * Compose the injected sheet from whichever CSS-gated prefs hold. One string,
 * one style element: every flip lands as a single textContent update and an
 * all-off state yields '' so the caller drops the element.
 */
function chromeCss(prefs: UiPrefs): string {
  const blocks: string[] = []
  if (prefs.hideBrand) blocks.push(BRAND_BUTTON_CSS)
  if (prefs.panelsInline) blocks.push(PANEL_CSS)
  if (prefs.hideNewSession) blocks.push(NEW_SESSION_CSS)
  if (prefs.hideSidebarToggle) blocks.push(SIDEBAR_TOGGLE_CSS)
  if (prefs.hideInputPlaceholder) blocks.push(INPUT_PLACEHOLDER_CSS)
  // The wide logo row holds TWO children (brand button, toggle), so it may
  // only collapse when both of their switches hide them — one visible child
  // must keep the row (and the window-drag strip) alive.
  if (prefs.hideBrand && prefs.hideSidebarToggle) blocks.push(LOGO_ROW_WIDE_CSS)
  return blocks.join('\n')
}

const LOGO_ROW_WIDE_CSS = `
/* With BOTH the brand button and the toggle hidden, the wide logo row has
   nothing left to show — but the shell gives the row a FIXED height (it
   doubles as the window-drag strip), so it keeps squatting on the sidebar
   top as a blank block. Drop the row so the content below moves up. The
   wordmark anchor pins it uniquely: only the wide logo row has a direct
   button child hosting [data-slot="sidebar.brand.name"] (the rail renders
   no wordmark, so the rule is inert there); the composer emits this block
   only when both switches hold, so a row with any visible child is never
   touched. !important as below: cascade order is not guaranteed. */
div:has(> button [data-slot="sidebar.brand.name"]){display:none!important}
`.trim()

const BRAND_BUTTON_CSS = `
/* The brand shadows empty the anchors' CONTENT everywhere they render —
   including the fish mark the rail shows inside the collapse toggle — but the
   wide shell's brand BUTTON itself stays mounted: emptied, invisible, yet
   still focusable and still starting a session on click. Drop the whole
   button: it is the logo row's only button hosting the wordmark anchor
   (wide state only — the rail renders no brand button, and the rail toggle
   carries the mark anchor but never the wordmark anchor, so the rule is
   inert there). !important as below: cascade order is not guaranteed. */
div:has(> button [data-slot="sidebar.brand.mark"]) > button:has([data-slot="sidebar.brand.name"]){display:none!important}
`.trim()

const PANEL_CSS = `
/* The [data-slot] anchor for the list slot is a display:contents DIV inside
   each row button's glyph span (the shell's <nav> owns the row-per-entry
   layout). :has() climbs from the stable anchor to that nav — the descendant
   form must be used, the child-combinator form does not match the glyph span
   wrapper in between. !important is deliberate: the shipped rules live in a
   hash-scoped stylesheet whose cascade order relative to this injected sheet
   is not guaranteed, so the override must not depend on it. */
nav:has(button [data-slot="sidebar.panellist"]){flex-direction:row!important;flex-wrap:wrap!important;align-items:center;gap:2px}
nav:has(button [data-slot="sidebar.panellist"]) > button{gap:0!important;padding:7px 6px!important}
nav:has(button [data-slot="sidebar.panellist"]) > button > span:last-child{display:none!important}
[data-sidebar-collapsed="true"] nav:has(button [data-slot="sidebar.panellist"]){flex-direction:column!important;flex-wrap:nowrap!important;gap:12px!important}
[data-sidebar-collapsed="true"] nav:has(button [data-slot="sidebar.panellist"]) > button{padding:0!important}
[data-sidebar-collapsed="true"] nav:has(button [data-slot="sidebar.panellist"]) > button > span:last-child{display:inline!important}
`.trim()

const NEW_SESSION_CSS = `
/* The New Session button sits in NO slot, so it cannot be shadowed. It is
   the only direct-child <button> of the sidebar root column — the shell's
   Tooltip clones its handlers onto the button and adds no wrapper — and the
   root column is the div whose direct div child (the workspaces region)
   directly hosts the [data-slot="sidebar.workspaces"] anchor, which the
   renderer always emits. Climb from that anchor and hide the column's
   direct-child button; valid in wide, rail and windows-titlebar states alike
   (the region div is unconditional in the shell). Same !important rationale
   as the panel rules. */
div:has(> div > [data-slot="sidebar.workspaces"]) > button{display:none!important}
`.trim()

const SIDEBAR_TOGGLE_CSS = `
/* The collapse/expand toggle is not behind a slot either; it lives in the
   logo row beside the brand button, and its shape flips with the column
   state, so two never-overlapping rules cover it:
   - Wide: the logo row is the div with a direct button child hosting the
     brand-mark anchor (the brand button), and the toggle is that row's
     button WITHOUT any slot anchor inside — the brand button carries both
     brand anchors, so the :not() singles the toggle out.
   - Rail (collapsed): the brand button is gone and the toggle itself hosts
     the brand-mark rail icon and the toggle-badge anchor, which the shell
     renders whenever the column is narrow. Match the row whose direct
     button child DIRECTLY hosts the badge anchor; the wide rule cannot
     fire there (the rail toggle contains anchors) and this rule cannot
     fire in wide state (no badge anchor exists).
   In the rail the toggle is the logo row's ONLY child, so hiding it
   empties the row — and the row has a FIXED height (window-drag strip),
   which would linger as a blank block at the top. Collapse the emptied
   row itself: the badge-anchor rule form pins it (the badge anchor is a
   direct child of the row's button there, and of nothing else). In wide
   state this rule cannot fire (no badge anchor), and the wide row needs
   BOTH switches hidden before LOGO_ROW_WIDE_CSS may drop it.
   Variant coverage, for the record: the Windows titlebar mode only moves
   the toggle with position:fixed — the DOM stays inside the logo row, so
   both rules still match it. The one gap is the macOS-desktop shell, whose
   wide top drag strip hosts the toggle with no brand anchor beside it (its
   rail state IS covered via the badge anchor). This plugin targets the
   web frame, where that variant never mounts. !important as above:
   cascade order is not guaranteed. */
div:has(> button [data-slot="sidebar.brand.mark"]) > button:not(:has([data-slot])){display:none!important}
div:has(> button > [data-slot="sidebar.toggle.badge"]) > button{display:none!important}
div:has(> button > [data-slot="sidebar.toggle.badge"]){display:none!important}
`.trim()

const INPUT_PLACEHOLDER_CSS = `
/* The empty composer shows its hint as an aria-hidden DIV carrying the
   shell-stable data-composer-placeholder attribute — not as a textarea
   ::placeholder — and the text itself has several localized variants
   (the shipped dictionary carries seven placeholder.* keys: default, hero,
   plan, steerQueue, unavailable, parentOffline, workspace), so the attribute
   is the only stable thing to anchor on, never the copy. The attribute has a
   single occurrence across the whole framework tree, and the div only mounts
   while the draft is empty, so the rule costs nothing while typing. Hiding
   it leaves the editable's aria-label (which the shell also derives from the
   placeholder text) untouched, so screen readers keep announcing the field.
   !important as above: cascade order is not guaranteed. */
div[data-composer-placeholder]{display:none!important}
`.trim()

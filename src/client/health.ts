/**
 * Self-check for the switches.
 *
 * A switch is a promise about the shell's markup: a slot key it shadows, or a
 * selector it drives. A DSH upgrade can rename either one, and the switch then
 * flips a pref that changes nothing on screen — the failure the New Session
 * button shipped with until 1.2.2. The probes below encode, per switch, the
 * anchors its effect hangs on plus the screen those anchors belong to.
 *
 * The monitor remembers what it has seen for the life of the page, so a screen
 * that has not rendered yet cannot be mistaken for breakage: a switch whose
 * region was on screen while none of its anchors ever appeared is reported as
 * broken, and one whose region never rendered stays unknown. Once an anchor has
 * been seen the switch stays ok for the rest of the session — unregistering a
 * panel or closing a conversation must not raise a false alarm.
 *
 * @module dsh-ui-toggle-plugin/client/health
 */

import type { UiPrefs } from './prefs.ts'

/** Every switch this plugin offers. */
export type SwitchKey = keyof UiPrefs

/** What the monitor can say about one switch at the moment it is asked. */
export type HealthState = 'ok' | 'broken' | 'unknown'

/** One switch's verdict. */
export interface SwitchHealth {
  readonly key: SwitchKey
  readonly state: HealthState
}

/** An anchor set and the screen that anchor belongs to. */
export interface Probe {
  readonly key: SwitchKey
  /** Any one of these present means the switch still has something to act on. */
  readonly targets: readonly string[]
  /** The screen that renders those anchors; absent means "cannot judge yet". */
  readonly region: string
}

/** The parts of a document the monitor reads; lets the tests drive it directly. */
export interface HealthRoot {
  querySelector(selector: string): unknown
}

/**
 * One probe per switch. Targets are the anchors the rules in chrome.ts climb
 * from, so a rename in the shell shows up here as a missing target; regions are
 * shell slots that only render on their own screen (the composer slots exist
 * only while a conversation view is on screen, the launcher only inside the
 * Settings frame). Keep targets free of hash-scoped class names and localized
 * copy — they must survive a theme or a translation change.
 */
export const PROBES: readonly Probe[] = [
  {
    key: 'hideBrand',
    targets: ['[data-slot="sidebar.brand.name"]', '[data-slot="sidebar.brand.mark"]'],
    region: '[data-slot="sidebar.workspaces"]',
  },
  {
    key: 'hideLauncher',
    targets: ['[data-slot="settings.launcher"]'],
    region: '[data-slot="settings.section"]',
  },
  {
    key: 'panelsInline',
    targets: ['nav:has(button [data-slot="sidebar.panellist"])'],
    region: '[data-slot="sidebar.workspaces"]',
  },
  {
    key: 'hideNewSession',
    targets: [
      '[data-slot="sidebar.session.action"]',
      'div:has(> div > [data-slot="sidebar.workspaces"]) > button',
    ],
    region: '[data-slot="sidebar.workspaces"]',
  },
  {
    key: 'hideSidebarToggle',
    targets: [
      '[data-slot="sidebar.toggle.badge"]',
      'div:has(> button [data-slot="sidebar.brand.mark"]) > button:not(:has([data-slot]))',
    ],
    region: '[data-slot="sidebar.workspaces"]',
  },
  {
    key: 'hideInputPlaceholder',
    targets: ['div[data-composer-placeholder]'],
    region: '[data-slot="conversation.input.attachments"]',
  },
  {
    key: 'hidePermissionLabel',
    targets: ['[data-slot="conversation.input.permission"] button'],
    region: '[data-slot="conversation.input.attachments"]',
  },
]

const seenTargets = new Set<string>()
const seenRegions = new Set<string>()

/** Record everything currently on screen. Safe to call as often as convenient. */
export function scanHealth(root: HealthRoot): void {
  for (const probe of PROBES) {
    if (!seenRegions.has(probe.region) && root.querySelector(probe.region) !== null) seenRegions.add(probe.region)
    for (const target of probe.targets) {
      if (!seenTargets.has(target) && root.querySelector(target) !== null) seenTargets.add(target)
    }
  }
}

/** The current verdict per switch, in the section's row order. */
export function healthReport(): readonly SwitchHealth[] {
  return PROBES.map(({ key, targets, region }) => {
    if (targets.some(target => seenTargets.has(target))) return { key, state: 'ok' }
    return { key, state: seenRegions.has(region) ? 'broken' : 'unknown' }
  })
}

/** Forget everything recorded so far; the tests and a full reload both start here. */
export function resetHealth(): void {
  seenTargets.clear()
  seenRegions.clear()
}

/**
 * Keep the monitor current: one scan now, then one per interval, for as long as
 * the returned disposer is not called. The interval covers screens that appear
 * without any DOM mutation the monitor could hook, and costs one querySelector
 * per anchor on an idle page.
 *
 * @param doc - the document to scan.
 * @param intervalMs - how often to rescan.
 * @returns a disposer stopping the timer.
 */
export function observeHealth(doc: Document, intervalMs = 1000): () => void {
  scanHealth(doc)
  const timer = setInterval(() => { scanHealth(doc) }, intervalMs)
  return () => { clearInterval(timer) }
}

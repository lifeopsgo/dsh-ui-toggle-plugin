/**
 * Client body of dsh-ui-toggle-plugin. Owned surface, in registration order:
 *
 * 1. The section stylesheet (one scoped `.dshui-` tag) and the plugin's
 *    locale dictionaries.
 * 2. A one-time prefs migration: the six chrome switches used to live in the
 *    dsh-capability-toggle-plugin panel's localStorage blob; seed this plugin's
 *    own key from it once so an upgrading user keeps their setup.
 * 3. The chrome effects (sidebar slot shadows + the composed CSS sheet).
 * 4. The Settings section: one `settings.section` entry with id `ui-toggle`,
 *    ordered after the shipped Plugins section, whose component renders the
 *    switch configuration page. `ctx.slots.inject` waits for the shell's
 *    declaration, so the registration appears whenever the Settings frame
 *    loads its half — the nav row re-renders off the slot-version
 *    subscription.
 *
 * @module dsh-ui-toggle-plugin/client
 */

import { NS, dictionaries } from './locales.ts'
import { seedFromLegacyPrefs, readPrefs, onPrefsChanged } from './prefs.ts'
import { injectStyles } from './styles.ts'
import { installChrome } from './chrome.ts'
import { UiToggleSection } from './section.tsx'
import type { ClientContext, SlotComponent } from './types.ts'

/** Cordis plugin name (client half). */
export const name = 'dsh-ui-toggle-plugin/client'

/** Services this client half injects. */
export const inject = ['slots', 'locale']

export function apply(ctx: ClientContext): void {
  ctx.effect(() => injectStyles(), 'ui-toggle: styles')
  ctx.effect(() => ctx.locale.register(NS, dictionaries), 'ui-toggle: dictionaries')
  // Before the chrome reads the prefs for the first time: carry the pre-split
  // switch values over when this plugin's own key does not exist yet.
  seedFromLegacyPrefs()
  installChrome(ctx, readPrefs, onPrefsChanged)
  const t = ctx.locale.bind(NS)
  ctx.slots.inject('settings.section', () =>
    ctx.slots.register(
      {
        name: 'settings.section',
        id: 'ui-toggle',
        // After the shipped Plugins section (15); the shell sorts by order.
        order: 20,
        label: () => t('nav'),
        locale: NS,
      },
      UiToggleSection as SlotComponent,
    ),
  )
}

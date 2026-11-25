/**
 * Hides selected Host commands from the composer's slash menu.
 *
 * DSH builds that menu inside the command service: the slash source awaits
 * `commandUi.directory.ensureReady(sessionId, signal)` and turns every returned
 * descriptor into a row, while a pick resolves the descriptor again through
 * `directory.resolve()`. The service publishes no filter, and a client
 * contribution may not shadow a Host name — the shell throws on the collision —
 * so the command list is the only place to drop a row without leaving a
 * keyboard-reachable ghost behind: the highlight walks the same list the rows
 * come from.
 *
 * The wrapper filters the list on the way out and leaves `resolve()` alone, so a
 * typed `/feedback` still reaches its handler. The switch hides the menu row,
 * not the command. {@link commandFilterState} reports whether the wrapper is in
 * place; the Settings section turns a missing `directory` into its upgrade
 * warning.
 *
 * @module dsh-ui-toggle-plugin/client/command-menu
 */

import type { UiPrefs } from './prefs.ts'
import type { ClientContext } from './types.ts'

/** One command family a switch can hide. */
export interface HideableCommands {
  readonly key: keyof UiPrefs
  readonly names: readonly string[]
}

/**
 * The commands behind a switch: which pref hides them, and every Host name that
 * pref covers. Names are the Host spellings without the leading slash, so a
 * localized label or a description change never breaks the filter.
 */
export const HIDEABLE_COMMANDS: readonly HideableCommands[] = [
  { key: 'hideFeedbackCommand', names: ['feedback'] },
]

/** The directory seam this module wraps; both members are all it reads. */
interface CommandDirectoryLike {
  ensureReady(sessionId: unknown, signal: AbortSignal): Promise<readonly { readonly name: string }[]>
}

interface CommandUiLike {
  readonly directory?: CommandDirectoryLike
}

/** Host names hidden by the current prefs. */
export function hiddenCommandNames(prefs: UiPrefs): ReadonlySet<string> {
  const hidden = new Set<string>()
  for (const family of HIDEABLE_COMMANDS) {
    if (prefs[family.key] !== true) continue
    for (const name of family.names) hidden.add(name)
  }
  return hidden
}

/** Drop the hidden entries from one catalog; the same array when nothing is hidden. */
export function filterCommandNames<T extends { readonly name: string }>(
  list: readonly T[],
  prefs: UiPrefs,
): readonly T[] {
  const hidden = hiddenCommandNames(prefs)
  return hidden.size === 0 ? list : list.filter(entry => !hidden.has(entry.name))
}

let serviceSeen = false
let bound: CommandDirectoryLike | null = null

/**
 * Whether the filter still applies: `unknown` until the shell publishes the
 * command service, `broken` when it publishes one this plugin cannot wrap (an
 * upgrade renamed the directory seam), `ok` once the wrapper is bound.
 */
export function commandFilterState(): 'ok' | 'broken' | 'unknown' {
  if (!serviceSeen) return 'unknown'
  return bound === null ? 'broken' : 'ok'
}

/**
 * Bind the filter for the lifetime of the command service. Reads the prefs on
 * every call, so a flip reaches the next menu open without re-registration.
 *
 * @param ctx - client root context.
 * @param read - current prefs reader (the live chrome snapshot).
 */
export function installCommandFilter(ctx: ClientContext, read: () => UiPrefs): void {
  ctx.inject(['commandUi'], (scope) => {
    serviceSeen = true
    scope.effect(() => {
      const directory = (scope as unknown as { readonly commandUi?: CommandUiLike }).commandUi?.directory
      if (directory === undefined || typeof directory.ensureReady !== 'function') return
      const original = directory.ensureReady.bind(directory)
      directory.ensureReady = (sessionId, signal) =>
        original(sessionId, signal).then(list => filterCommandNames(list, read()))
      bound = directory
      return () => {
        directory.ensureReady = original
        if (bound === directory) bound = null
      }
    }, 'ui-toggle: command menu filter')
  })
}

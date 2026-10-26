/**
 * The Settings section page: one heading, one intro line, and the six chrome
 * switches as labelled rows. The section mounts only while its nav row is
 * active, but reads the prefs fresh on every mount, so it always shows what
 * the chrome effects currently apply. A flip updates the local state
 * optimistically and goes through writePrefs — the single write path that
 * both persists the blob and notifies the live chrome effects.
 *
 * The nav label and the section copy localize through the plugin's own
 * namespace (the registration binds `locale: NS`, so the framework injects the
 * translator as the `t` prop); the key passthrough is the pre-registration
 * fallback.
 *
 * @module dsh-ui-toggle-plugin/client/section
 */

import { useRef, useState } from 'react'
import type { ReactElement } from 'react'

import { readPrefs, writePrefs } from './prefs.ts'
import type { UiPrefs } from './prefs.ts'
import type { SectionProps, Translate } from './types.ts'

type SwitchKey = keyof UiPrefs

interface SwitchRowSpec {
  readonly key: SwitchKey
  /** Addressing hook for the browser e2e; pinned by the section test. */
  readonly cls: string
  readonly labelKey: string
  readonly hintKey: string
}

const SWITCHES: readonly SwitchRowSpec[] = [
  { key: 'hideBrand', cls: 'hidebrand', labelKey: 'prefs.brand', hintKey: 'prefs.brand.hint' },
  { key: 'hideLauncher', cls: 'hidelauncher', labelKey: 'prefs.launcher', hintKey: 'prefs.launcher.hint' },
  { key: 'panelsInline', cls: 'panelsinline', labelKey: 'prefs.panels', hintKey: 'prefs.panels.hint' },
  { key: 'hideNewSession', cls: 'hidenewsession', labelKey: 'prefs.newsession', hintKey: 'prefs.newsession.hint' },
  { key: 'hideSidebarToggle', cls: 'hidesidebartoggle', labelKey: 'prefs.sidebartoggle', hintKey: 'prefs.sidebartoggle.hint' },
  { key: 'hideInputPlaceholder', cls: 'hideinputplaceholder', labelKey: 'prefs.inputplaceholder', hintKey: 'prefs.inputplaceholder.hint' },
]

const passthrough: Translate = key => key

export function UiToggleSection(props: SectionProps): ReactElement {
  const t = props.t ?? passthrough
  // `latest` holds the values the plugin last wrote. React state drives the
  // render; this ref exists because a second flip can arrive before that state
  // has been committed, and the flip must build on the write it already made.
  const latest = useRef<UiPrefs | null>(null)
  if (latest.current === null) latest.current = readPrefs()
  const [prefs, setPrefs] = useState<UiPrefs>(latest.current)
  const flip = (key: SwitchKey): void => {
    // Flip off the LAST write, not this render's snapshot: flipping several
    // switches in one tick (all six at once, or a future caller flipping more
    // than one) would otherwise start every flip after the first from the
    // stale render value and overwrite the earlier ones — only the last switch
    // survived, which the browser run showed. The ref is written
    // synchronously here, OUTSIDE the state updater, so the persist stays one
    // side effect per click.
    const current = latest.current as UiPrefs
    const next = { ...current, [key]: !current[key] }
    latest.current = next
    setPrefs(next)
    writePrefs(next)
  }
  return (
    <div className="dshui-section">
      <h2 className="dshui-heading">{t('title')}</h2>
      <p className="dshui-intro">{t('intro')}</p>
      <div className="dshui-rows">
        {SWITCHES.map(({ key, cls, labelKey, hintKey }) => (
          <div className={`dshui-row dshui-row-${cls}`} key={key}>
            <span className="dshui-row-text">
              <span className="dshui-row-label" id={`dshui-label-${cls}`}>{t(labelKey)}</span>
              <span className="dshui-row-hint">{t(hintKey)}</span>
            </span>
            <button
              type="button"
              role="switch"
              className="dshui-switch"
              aria-checked={prefs[key]}
              aria-labelledby={`dshui-label-${cls}`}
              onClick={() => flip(key)}
            />
          </div>
        ))}
      </div>
    </div>
  )
}

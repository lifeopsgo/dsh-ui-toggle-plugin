/**
 * One injected stylesheet for the whole plugin, scoped under the `.dshui-`
 * class prefix (section page + switch visuals). Injected as a single
 * `<style>` tag by `injectStyles`; theme tokens come from the host
 * (`--dsw-alias-*`), so light/dark follow the shell.
 *
 * @module dsh-ui-toggle-plugin/client/styles
 */

/** The plugin id stamped on the injected style tag (for dedupe and cleanup). */
const STYLE_ID = 'dsh-ui-toggle-plugin'

const CSS = `
.dshui-section{display:flex;flex-direction:column;gap:4px;max-width:640px}
.dshui-heading{margin:0;color:var(--dsw-alias-label-primary);font-size:20px;font-weight:600;line-height:28px}
.dshui-intro{margin:0 0 10px;color:var(--dsw-alias-label-secondary);font-size:13px;line-height:20px}
.dshui-rows{display:flex;flex-direction:column;border:1px solid var(--dsw-alias-border-l2);border-radius:12px;background:var(--dsw-alias-bg-layer-1);overflow:hidden}
.dshui-row{display:flex;align-items:center;justify-content:space-between;gap:16px;padding:12px 16px}
.dshui-row+.dshui-row{border-top:1px solid var(--dsw-alias-border-l1)}
.dshui-row-text{display:flex;flex-direction:column;gap:3px;min-width:0}
.dshui-row-label{color:var(--dsw-alias-label-primary);font-size:13.5px;font-weight:500;line-height:1.4}
.dshui-row-hint{color:var(--dsw-alias-label-caption);font-size:12px;line-height:1.5}
.dshui-switch{position:relative;flex:none;width:40px;height:24px;padding:0;border:0;border-radius:999px;background:var(--dsw-alias-bg-layer-3,var(--dsw-alias-border-l2));cursor:pointer;transition:background .16s ease}
.dshui-switch::after{content:"";position:absolute;top:3px;left:3px;width:18px;height:18px;border-radius:50%;background:#fff;box-shadow:0 1px 2px rgba(0,0,0,.24);transition:transform .16s ease}
.dshui-switch[aria-checked=true]{background:var(--dsw-alias-state-business-primary)}
.dshui-switch[aria-checked=true]::after{transform:translateX(16px)}
.dshui-switch:focus-visible{outline:2px solid var(--dsw-alias-state-business-primary);outline-offset:2px}
`

/**
 * Inject the stylesheet once. No DOM under node --test: a safe no-op.
 *
 * @returns a disposer removing the injected tag, or a no-op when none was added.
 */
export function injectStyles(): () => void {
  if (typeof document === 'undefined') return () => {}
  // The chrome sheet (./chrome.ts) stamps the same plugin id on ITS style
  // element; the :not() keeps this dedup honest about which sheet it means,
  // so a future reordering of the two effects cannot make the chrome sheet
  // satisfy this query and silently skip the whole section stylesheet.
  if (document.querySelector(`style[data-plugin="${STYLE_ID}"]:not([data-plugin-css])`) !== null) return () => {}
  const tag = document.createElement('style')
  tag.dataset.plugin = STYLE_ID
  tag.textContent = CSS
  document.head.appendChild(tag)
  return () => { tag.remove() }
}

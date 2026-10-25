<div align="center">

# dsh-ui-toggle-plugin

**Six live switches for the DSH WebUI chrome — in one Settings page.**

[![platform](https://img.shields.io/badge/platform-DSH%20WebUI-2b7cd3?style=flat-square)](#quick-start)
![tests](https://img.shields.io/badge/tests-35%20passing-3fb950?style=flat-square)
[![license](https://img.shields.io/badge/license-MIT-blue?style=flat-square)](./LICENSE)

**English** · [简体中文](./README.zh-CN.md)

</div>

## What it is

A **DeepSeek Harness (DSH) WebUI** plugin that adds one Settings section, **UI toggle**, holding six switches over the shell's own chrome:

| Switch | Effect |
| :-- | :-- |
| **Hide the sidebar brand area** | Drops the top-left brand button whole (fish mark `sidebar.brand.mark`, "DeepSeek Harness" wordmark `sidebar.brand.name`). Settings stays reachable via its button. |
| **Keep only Settings at the sidebar foot** | Replaces the account/sign-in menu (`settings.launcher`) with a bare Settings button — the gear and its panel stay fully functional. |
| **Lay global panel icons out horizontally** | Panel entries sit side by side and wrap when out of room; text labels are hidden while expanded (each entry keeps its aria-label). The collapsed rail keeps the stock vertical layout. |
| **Hide the "New Session" button** | Hides the big New Session button at the sidebar top; the new-session shortcut keeps working. |
| **Hide the collapse-sidebar button** | Hides the sidebar collapse/expand button; its shortcut still toggles the sidebar. The logo row has a shell-fixed height, so once its switches empty it — brand + toggle in wide state, the toggle alone in the rail — the row itself collapses instead of leaving a blank strip. |
| **Hide the input placeholder** | Hides the hint text the empty composer shows. The shell renders it as an aria-hidden div carrying the stable `data-composer-placeholder` attribute (its single occurrence framework-wide), so the rule anchors on the attribute, never the copy. Typing is unaffected and the editable keeps its aria-label. |

Every switch applies **immediately** — no reload — and persists in this browser's `localStorage`.

## Compatible DSH versions

Built and verified against **DSH 0.2.1-rc.2** (peer range also admits `0.2.0-rc.1`).

| DSH version | Status | How it was checked |
| --- | --- | --- |
| 0.2.1-rc.2 | supported | Typechecks (host + client), production build, 35 automated tests, `--frozen-lockfile` install, and end-to-end browser verification of all six switches against a live WebUI |

This release makes no compatibility claim for other DSH versions.

## Quick start

Requires **Node.js ^22.19.0 or ≥ 24.0.0** (same as DSH 0.2.x).

```bash
dsh plugin --profile web add github:lifeopsgo/dsh-ui-toggle-plugin#v1.0.0
dsh --profile web web
```

Refresh the page, open **Settings → UI toggle**, and flip a switch.

<details>
<summary>Upgrade or uninstall</summary>

```bash
# Upgrade or downgrade: use any tag on the releases page
dsh plugin --profile web add github:lifeopsgo/dsh-ui-toggle-plugin#v1.0.0

# Remove
dsh plugin --profile web remove dsh-ui-toggle-plugin
```

</details>

## How it works

**A section, not a second panel.** The plugin registers one `settings.section` entry (`id: ui-toggle`, `order: 20`), so the shell renders it in the Settings nav right after Plugins and mounts the configuration page on demand. The page style lives in one `.dshui-`-scoped stylesheet.

**Two mechanisms for two kinds of chrome.** Elements that sit **behind a slot** cannot be hidden with CSS reliably — a slot's occupant is chosen by the renderer. Those seats (the brand mark and wordmark, and the launcher) are **shadowed**: the plugin registers a null component (or a Settings-only replacement for the launcher) at the explicit negative priority `-99`, and unregisters it when the switch turns off. The lowest priority wins a single slot, so this reliably displaces the shipped occupant without touching it. Elements that sit in **no slot** (the New Session button, the collapse toggle, the composer placeholder, the panel list container) are gated by **CSS** anchored on the renderer's stable `[data-slot]` / `data-composer-placeholder` attributes — never on the bundle's hash-scoped class names, which change on every DSH rebuild.

**One style element for every CSS-gated switch.** A single composer builds the sheet from whichever switches are on; a flip updates that element's `textContent`, and turning everything off removes it. No per-switch `<style>` tags, no orphaned rules.

**Values migrate from the pre-split panel.** These six switches used to live in the `dsh-capability-toggle-plugin` panel's prefs blob. On first start, when this plugin's own key is absent, it reads the six chrome fields from that legacy blob and persists them under its own key — so an upgrading user keeps their setup. The legacy key is only ever read.

## Development

```bash
pnpm install
pnpm typecheck   # host + client
pnpm build       # lib/index.js (host ESM) + lib/client.js (ModuleLoader envelope)
pnpm test        # 35 tests, node --test
```

`lib/` is committed on purpose: installs come from a git tag, and a git-hosted package has no build step unless every user allows a `prepare` script by hash.

## License

MIT

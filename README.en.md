<div align="center">

# dsh-ui-toggle-plugin

**Seven live switches for the DSH WebUI chrome — in one Settings page.**

[![platform](https://img.shields.io/badge/platform-DSH%20WebUI-2b7cd3?style=flat-square)](#quick-start)
![tests](https://img.shields.io/badge/tests-37%20passing-3fb950?style=flat-square)
[![license](https://img.shields.io/badge/license-MIT-blue?style=flat-square)](./LICENSE)

[![中文](https://img.shields.io/badge/README-中文-red?style=flat-square)](./README.md) [![English](https://img.shields.io/badge/README-English-blue?style=flat-square)](./README.en.md) [![详细中文](https://img.shields.io/badge/README-详细中文-orange?style=flat-square)](./README.zh-CN.md)

</div>

## What it is

A **DeepSeek Harness (DSH) WebUI** plugin that adds one Settings section, **UI toggle**, holding seven switches over the shell's own chrome:

| Switch | Effect |
| :-- | :-- |
| **Hide the sidebar brand area** | Drops the top-left brand button whole (fish mark `sidebar.brand.mark`, "DeepSeek Harness" wordmark `sidebar.brand.name`). Settings stays reachable via its button. |
| **Keep only Settings at the sidebar foot** | Replaces the account/sign-in menu (`settings.launcher`) with a bare Settings button — the gear and its panel stay fully functional. |
| **Lay global panel icons out horizontally** | Panel entries sit side by side and wrap when out of room; while expanded **only the icons show** — neither the text labels nor the hover unpin control render (each entry keeps its aria-label). Turn the switch off to unpin an entry. The collapsed rail keeps the stock vertical layout. |
| **Hide the "New Session" button** | Hides the big New Session button at the sidebar top, row and all, so no blank strip is left; the new-session shortcut keeps working. |
| **Hide the collapse-sidebar button** | Hides the sidebar collapse/expand button; its shortcut still toggles the sidebar. The logo row has a shell-fixed height, so once its switches empty it — brand + toggle in wide state, the toggle alone in the rail — the row itself collapses instead of leaving a blank strip. |
| **Hide the input placeholder** | Hides the hint text the empty composer shows. The shell renders it as an aria-hidden div carrying the stable `data-composer-placeholder` attribute (its single occurrence framework-wide), so the rule anchors on the attribute, never the copy. Typing is unaffected and the editable keeps its aria-label. |
| **Show only the permission icon** | Hides the preset name on the permission selector under the composer ("Full access", "Workspace write" and the others), leaving the shield glyph and the dropdown chevron. The button keeps its aria-label, and the selector still opens and switches normally. |

Every switch applies **immediately** — no reload — and persists in this browser's `localStorage`.

## Compatible DSH versions

The peer range `>=0.2.0-0 <0.3.0-0` admits **every DSH 0.2.x release** (pre-releases included): a new 0.2.x DSH needs no plugin update, and only a DSH 0.3.0 needs a fresh compatibility pass (the range excludes 0.3.0 and its pre-releases by design).

| DSH version | Status | How it was checked |
| --- | --- | --- |
| 0.2.2-rc.3 | supported | Typechecks (host + client), production build, 37 automated tests, `--frozen-lockfile` install, plus a per-surface contract check against the installed 0.2.2-rc.3 packages (slot keys, the negative-priority shadow mechanism, the launcher owner share, section props, CSS anchors, locale service signatures); the upgrade guides from 0.2.1-rc.5 to 0.2.2-rc.3 contain no break touching this plugin's surfaces |
| 0.2.1-rc.2 | supported | Typechecks (host + client), production build, 37 automated tests, `--frozen-lockfile` install, and end-to-end browser verification of the switches against a live WebUI |

This release makes no compatibility claim for DSH versions outside 0.2.x.

## Quick start

Requires **Node.js ^22.19.0 or ≥ 24.0.0** (same as DSH 0.2.x).

```bash
dsh plugin --profile web add github:lifeopsgo/dsh-ui-toggle-plugin#v1.1.0
dsh --profile web web
```

Refresh the page, open **Settings → UI toggle**, and flip a switch.

<details>
<summary>Upgrade or uninstall</summary>

```bash
# Upgrade or downgrade: use any tag on the releases page
dsh plugin --profile web add github:lifeopsgo/dsh-ui-toggle-plugin#v1.1.0

# Remove
dsh plugin --profile web remove dsh-ui-toggle-plugin
```

</details>

## License

MIT

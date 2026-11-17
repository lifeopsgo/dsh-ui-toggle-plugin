# Changelog

All notable changes to this project are documented here.

The project follows [Semantic Versioning](https://semver.org/).

## [1.2.0] - 2026-11-17

### Added

- **Show only the permission icon** — a seventh switch hides the preset name on the composer's permission selector ("完全权限" / Full access, "工作区内修改" / Workspace write and the other preset names), leaving the shield glyph and the dropdown chevron. The rule anchors on the conversation's `[data-slot="conversation.input.permission"]` wrapper and hides the trigger button's only direct-child span without `aria-hidden` — the glyph and the chevron both carry that attribute, and the preset names are localized and host-renameable, so the copy is never matched. The button keeps its aria-label and title, so the control still announces itself and still opens and switches normally.

### Changed

- **The READMEs and the Plugin Manager card now describe seven switches**, and the display metadata in `locale/zh.json` and `locale/en.json` lists the new one.

## [1.1.0] - 2026-11-17

### Changed

- **Support every DSH 0.2.x release without a plugin update.** The three `@deepseek-ai/dsh-client-*` peerDependencies widen from the exact `0.2.0-rc.1 || 0.2.1-rc.2` pins to the open range `>=0.2.0-0 <0.3.0-0`, so DSH 0.2.2-rc.3 and every later 0.2.x (pre-releases included) pass the startup compatibility check on their own — no per-version exemption, and no plugin release per DSH point release. Only a DSH 0.3.0 needs a fresh compatibility pass; the range excludes it and its pre-releases by design. The `@deepseek-ai/cordis` peer widens from `~4.0.4` to `^4.0.4`, covering the cordis 4.1.0 line DSH 0.2.2-rc.3 ships.

- **devDependencies refresh to the current runtime** — cordis 4.1.0 and the three client packages at 0.2.2-rc.3 — so typechecks, builds and tests run against what the live 0.2.x GUI actually ships. Compatibility of every surface the plugin touches was verified against the installed 0.2.2-rc.3 packages: the slot keys (`sidebar.brand.mark`, `sidebar.brand.name`, `settings.launcher`, `settings.section`), the negative-priority shadow mechanism (`--nextPriority` in dsh-cordis-client-runner), the launcher owner share (`wide`, `openSettings`), the section props (`t`, `close`, `renderSlot`), the CSS anchors (`[data-slot]`, `data-composer-placeholder`, `data-sidebar-collapsed`), and the locale service signatures (`register`, `bind`). The upgrade guides from 0.2.1-rc.5 to 0.2.2-rc.3 contain no break affecting these surfaces.

### Fixed

- **"Lay global panel icons out horizontally" now actually leaves only the icons.** DSH 0.2.2 restructured the sidebar panel rows: the row button moved inside an entry div, the label became a conditional sibling span, and the wide row reserved a right gutter for a hover-only unpin control. The layout half of the rule still matched, so entries did sit side by side, but the label-hide rule was pinned to `> button > span:last-child` and no longer matched — every entry kept its text. The rules now select row buttons by "has a direct-child span", hide the direct-child span that is neither the `aria-hidden` glyph nor the `[data-slot]` anchor carrier, and size each row to its icon. The hover-only unpin control shrinks to a 16px corner badge instead of overlaying the icon; it stays reachable on hover because the More menu only offers PIN for unpinned entries, so hiding it would strand pinned panels. Verified against a live 0.2.2-rc.3 WebUI: every row is 28–34px wide, its label computes to `display:none`, and its glyph stays mounted.

## [1.0.0] - 2026-10-25

First release. The six DSH WebUI chrome switches, split out of
`dsh-capability-toggle-plugin`'s panel into a Settings section of their own.

### Added

- **Settings → UI toggle** — one `settings.section` entry (`id: ui-toggle`,
  `order: 20`, sorted right after the shipped Plugins section) whose page holds
  six live switches with a label and a one-line explanation each.

- **Hide the sidebar brand area** — shadows the `sidebar.brand.mark` and
  `sidebar.brand.name` seats with a null component at the explicit negative
  priority `-99`, and drops the emptied brand button plus the emptied logo row
  by CSS so no invisible click target or blank strip is left behind.

- **Keep only Settings at the sidebar foot** — replaces the `settings.launcher`
  occupant with a Settings-only button (the seat is replaced, not emptied: the
  Settings gear is that same slot's fallback).

- **Lay global panel icons out horizontally** — the `sidebar.panellist` entries
  flow side by side and wrap, labels hidden while expanded; the collapsed rail
  keeps the stock vertical layout.

- **Hide the "New Session" button** and **Hide the collapse-sidebar button** —
  CSS rules anchored on the renderer's stable `[data-slot]` attributes, since
  these buttons sit in no slot. Both keyboard shortcuts keep working; the
  shell-fixed logo row collapses once its switches empty it.

- **Hide the input placeholder** — the composer's aria-hidden hint div carries
  the shell-stable `data-composer-placeholder` attribute (its only occurrence
  framework-wide), so the rule anchors there rather than on the copy, which has
  several localized variants.

- **Values migrate from the pre-split panel** — on first start, when this
  plugin's own key is absent, the six chrome fields are read from
  `dsh-capability-toggle-plugin:panel-prefs` and persisted under
  `dsh-ui-toggle-plugin:ui-prefs`. The legacy key is never written.

### Fixed

- **Flipping several switches in one batch kept only the last one.** Each flip
  computed from the render-time snapshot, so a second click before React
  re-rendered silently overwrote the first. The section now tracks the latest
  value synchronously in a ref and flips off that, so every click accumulates.
  Caught by driving all six switches in a single browser tick; pinned by a
  regression test that flips six switches without an intervening re-render.

- **A throwing chrome subscriber swallowed the whole flip.** `writePrefs`
  notified listeners before persisting, but the loop had no per-listener
  guard: one subscriber that threw skipped every later subscriber *and* the
  `setItem`, leaving the flip neither applied nor durable. The chrome
  subscriber walks the live DOM, so a throw is a realistic case. Each listener
  now runs in its own try/catch with a warning, and the persist still follows
  the notifications.

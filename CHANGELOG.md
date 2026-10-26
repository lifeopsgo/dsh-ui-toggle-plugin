# Changelog

All notable changes to this project are documented here.

The project follows [Semantic Versioning](https://semver.org/).

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

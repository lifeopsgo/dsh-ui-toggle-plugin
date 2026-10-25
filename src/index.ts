/**
 * Host half of the dsh-ui-toggle-plugin bundle. The plugin owns no Host-side
 * capability: all of it — the Settings section, the sidebar chrome effects and
 * the composer-placeholder rule — runs in the Client half (see
 * `src/client/index.tsx`, built to `lib/client.js`). The Loader still needs a
 * Node entry for the inserted layer row, so this module only satisfies the
 * plugin export contract.
 *
 * @module dsh-ui-toggle-plugin
 */

export function apply(): void {}

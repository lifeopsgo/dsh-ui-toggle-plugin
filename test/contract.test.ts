/**
 * Contract suite for dsh-ui-toggle-plugin: pins the package manifest against
 * what the DSH Plugin Manager and the client loader actually read — the
 * cordis patch row, the two-artifact build output, the display metadata
 * (locale/en.json + zh.json meta.title/description, icon.svg), the peer
 * ranges the live profile must satisfy, and the display-metadata export map.
 *
 * @module dsh-ui-toggle-plugin/test/contract
 */

import { readFileSync, existsSync, statSync } from 'node:fs'
import test from 'node:test'
import assert from 'node:assert/strict'

test('the package manifest carries the plugin display metadata the Plugin Manager reads', async () => {
  const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8')) as {
    name?: string
    version?: string
    private?: boolean
    exports?: Record<string, unknown>
    files?: string[]
    dsh?: { bundle?: { patch?: string }; client?: { platform?: string; inject?: string[] } }
    peerDependencies?: Record<string, string>
    devDependencies?: Record<string, string>
  }
  assert.equal(pkg.name, 'dsh-ui-toggle-plugin', 'the package must keep the plugin id as its name')
  assert.equal(pkg.version, '1.0.0', 'the initial split release is 1.0.0')
  assert.equal(pkg.private, true, 'a profile-local plugin must not be publishable')

  const expectedExports: Record<string, unknown> = {
    './client': './lib/client.js',
    './locale/*.json': './locale/*.json',
    './icon': './icon.svg',
    './cordis.patch.yml': './cordis.patch.yml',
    './package.json': './package.json',
  }
  for (const [key, target] of Object.entries(expectedExports)) {
    assert.deepEqual(pkg.exports?.[key], target, `the exports map must expose ${key}`)
  }
  for (const required of ['lib', 'src', 'cordis.patch.yml', 'locale/*.json', 'icon.svg', 'LICENSE', 'README.md', 'README.zh-CN.md']) {
    assert.ok(pkg.files?.includes(required), `files must include ${required}`)
  }

  assert.equal(pkg.dsh?.bundle?.patch, './cordis.patch.yml', 'the manifest must point at the patch file')
  assert.equal(pkg.dsh?.client?.platform, 'web', 'the client half must target the web platform')
  assert.equal(pkg.dsh?.client?.inject?.[0], '@deepseek-ai/dsh-client-locale',
    'the client inject list must lead with the locale service package')

  // Peer ranges: the live profile runs cordis 4.0.4 (0.2.0-rc.1) or the 4.0.x
  // line (0.2.1-rc.2); devDependencies pin the version the peers gate last
  // passed against.
  const expectedPeers: Record<string, string> = {
    '@deepseek-ai/cordis': '~4.0.4',
    '@deepseek-ai/dsh-client-locale': '0.2.0-rc.1 || 0.2.1-rc.2',
    '@deepseek-ai/dsh-client-ui-conversation': '0.2.0-rc.1 || 0.2.1-rc.2',
    '@deepseek-ai/dsh-client-ui-settings-general': '0.2.0-rc.1 || 0.2.1-rc.2',
    react: '^18.3.1',
  }
  for (const [name, range] of Object.entries(expectedPeers)) {
    assert.equal(pkg.peerDependencies?.[name], range, `peer ${name} must declare ${range}`)
  }
  assert.equal(pkg.devDependencies?.['@deepseek-ai/cordis'], '4.0.5',
    'the cordis devDependency must stay pinned ahead of the peer range so the peers gate keeps checking the real runtime line')
  assert.equal(pkg.devDependencies?.react, '18.3.1', 'react must pin the same minor the GUI ships')
})

test('the cordis patch inserts exactly this plugin as a layer row', () => {
  const patch = readFileSync(new URL('../cordis.patch.yml', import.meta.url), 'utf8')
  assert.match(patch, /- insert:/, 'the patch must insert a row')
  assert.match(patch, /- id: dsh-ui-toggle-plugin$/m, 'the row id must be the plugin id')
  assert.match(patch, /name: 'dsh-ui-toggle-plugin'/, 'the row name must be the plugin id')
  assert.match(patch, /config: \{ global: \{\}, projects: \{\}, sessions: \{\} \}/,
    'the row must carry the empty three-scope config the Host half expects')
})

test('the display metadata localizes the Plugin Manager card in both languages', async () => {
  const en = JSON.parse(readFileSync(new URL('../locale/en.json', import.meta.url), 'utf8')) as { meta?: { title?: string; description?: string } }
  const zh = JSON.parse(readFileSync(new URL('../locale/zh.json', import.meta.url), 'utf8')) as { meta?: { title?: string; description?: string } }
  for (const [locale, meta] of [['en', en], ['zh', zh]] as const) {
    assert.equal(typeof meta.meta?.title, 'string', `locale/${locale}.json must carry meta.title`)
    assert.ok((meta.meta?.title ?? '').length > 0, `locale/${locale}.json meta.title must not be empty`)
    assert.equal(typeof meta.meta?.description, 'string', `locale/${locale}.json must carry meta.description`)
    assert.ok((meta.meta?.description ?? '').length > 0, `locale/${locale}.json meta.description must not be empty`)
  }
  assert.equal(en.meta?.title, 'UI toggle', 'the English card title must match the nav entry')
  assert.equal(zh.meta?.title, 'UI 开关', 'the Chinese card title must match the nav entry')
  assert.notEqual(en.meta?.description, zh.meta?.description, 'the descriptions must be localized, not copied')
})

test('the plugin icon exists, is an SVG and stays well under the 256 KiB cap', () => {
  const icon = readFileSync(new URL('../icon.svg', import.meta.url), 'utf8')
  assert.match(icon, /<svg[^>]*xmlns="http:\/\/www\.w3\.org\/2000\/svg"/, 'the icon must be a real SVG with a namespace')
  const size = statSync(new URL('../icon.svg', import.meta.url)).size
  assert.ok(size > 0, 'the icon must not be empty')
  assert.ok(size < 256 * 1024, 'the icon must stay under the 256 KiB display-metadata cap')
})

test('the built client bundle is committed with the loader envelope and the chrome markers', () => {
  const clientPath = new URL('../lib/client.js', import.meta.url)
  assert.ok(existsSync(clientPath), 'lib/client.js must be committed (git-tag installs have no build step)')
  const bundle = readFileSync(clientPath, 'utf8')
  assert.match(bundle, /window\.__ModuleLoader__\.load\(\{\s*id: "dsh-ui-toggle-plugin",\s*factory: \(require\) => \{/,
    'the bundle must be wrapped in the ModuleLoader envelope')
  assert.match(bundle, /"settings\.section"/, 'the settings.section registration must survive the build')
  assert.match(bundle, /"sidebar\.brand\.mark"/, 'the brand shadow must survive the build')
  assert.match(bundle, /"settings\.launcher"/, 'the launcher shadow must survive the build')
  assert.match(bundle, /data-composer-placeholder/, 'the placeholder rule must survive the build')
  assert.match(bundle, /dsh-capability-toggle-plugin:panel-prefs/, 'the legacy seed key must survive the build')
  assert.doesNotMatch(bundle, /conversation\.input\.left/, 'the panel-era input zone must not ship in this bundle')
  assert.doesNotMatch(bundle, /dshct-/, 'the old plugin\'s dshct- stylesheet must not ship in this bundle')
  assert.doesNotMatch(bundle, /showFraction|showUsage/, 'the panel display prefs must not ship in this bundle')

  const hostPath = new URL('../lib/index.js', import.meta.url)
  assert.ok(existsSync(hostPath), 'lib/index.js must be committed (the patch row loads the Host half)')
  assert.match(readFileSync(hostPath, 'utf8'), /function apply/, 'the Host half must export the empty apply')
})

test('the lockfile pins the checked runtime and matches the manifest devDependencies', async () => {
  const lockPath = new URL('../pnpm-lock.yaml', import.meta.url)
  assert.ok(existsSync(lockPath), 'pnpm-lock.yaml must be committed so installs stay frozen')
  const lock = readFileSync(lockPath, 'utf8')
  assert.match(lock, /'@deepseek-ai\/cordis@4\.0\.5'/, 'the lockfile must pin the cordis devDependency at 4.0.5')
  assert.match(lock, /react@18\.3\.1/, 'the lockfile must pin react at 18.3.1')
})

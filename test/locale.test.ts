/**
 * Locale suite for dsh-ui-toggle-plugin: the zh/en dictionaries must carry
 * identical key sets (parity), every key in the source must exist in both
 * dictionaries (no dead keys), and every t('…') literal in the source must be
 * covered (reverse) — a missing key renders as a bare key in the live UI, so
 * both directions get pinned here, not just one.
 *
 * @module dsh-ui-toggle-plugin/test/locale
 */

import { readFileSync, readdirSync } from 'node:fs'
import test from 'node:test'
import assert from 'node:assert/strict'

const { dictionaries, NS } = await import('../src/client/locales.ts')
const zhKeys = new Set(Object.keys(dictionaries.zh))
const enKeys = new Set(Object.keys(dictionaries.en))

test('the locale namespace is the plugin id', () => {
  assert.equal(NS, 'dsh-ui-toggle-plugin', 'the namespace must equal the plugin id so ctx.locale.bind(NS) resolves the section translator')
})

test('zh and en dictionaries carry identical key sets', () => {
  const onlyZh = [...zhKeys].filter(k => !enKeys.has(k))
  const onlyEn = [...enKeys].filter(k => !zhKeys.has(k))
  assert.deepEqual(onlyZh, [], 'every zh key must exist in en')
  assert.deepEqual(onlyEn, [], 'every en key must exist in zh')
})

test('every dictionary key is referenced from the client source (no dead keys)', () => {
  const sources = readdirSync(new URL('../src/client', import.meta.url))
    .filter(f => f.endsWith('.ts') || f.endsWith('.tsx'))
    .map(f => readFileSync(new URL(`../src/client/${f}`, import.meta.url), 'utf8'))
    .join('\n')
  for (const key of zhKeys) {
    assert.ok(sources.includes(`'${key}'`),
      `key ${key} must be referenced from src/client (dead key)`)
  }
})

test('every t(…) call site and row spec key in the client source exists in both dictionaries (reverse)', () => {
  const files = readdirSync(new URL('../src/client', import.meta.url))
    .filter(f => f.endsWith('.ts') || f.endsWith('.tsx'))
  const used = new Set<string>()
  for (const f of files) {
    const src = readFileSync(new URL(`../src/client/${f}`, import.meta.url), 'utf8')
    for (const m of src.matchAll(/\bt\?\.\('([^']+)'/g)) used.add(m[1])
    for (const m of src.matchAll(/\bt\('([^']+)'/g)) used.add(m[1])
    for (const m of src.matchAll(/labelKey: '([^']+)'/g)) used.add(m[1])
    for (const m of src.matchAll(/hintKey: '([^']+)'/g)) used.add(m[1])
  }
  assert.ok(used.size > 0, 'the scan must find the call sites')
  for (const key of used) {
    assert.ok(zhKeys.has(key), `used key ${key} must exist in the zh dictionary`)
    assert.ok(enKeys.has(key), `used key ${key} must exist in the en dictionary`)
  }
})

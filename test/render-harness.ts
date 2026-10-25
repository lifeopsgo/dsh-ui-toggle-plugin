/**
 * Renders section.tsx without a DOM: transform the TSX with the repo's own
 * bundler, install a hook dispatcher, then call UiToggleSection directly and
 * walk the element tree it returns. The component keeps one hook scope for
 * its own useState, so a re-render after a flip reads the updated state.
 *
 * Why walk the element tree instead of mounting it: `react-dom`, `jsdom`, and
 * `@testing-library/react` are all absent from devDependencies, so nothing here
 * can attach this component to a document. Reading the props off the elements
 * React returns is enough for what these tests pin — which switch carries
 * which row class and accessible name, and that a click goes through
 * writePrefs. `userClick` supplies the element-tree equivalent of a click.
 *
 * React 18 exposes the dispatcher through a private internals object that
 * React 19 removed. `available` reports whether the hook dispatcher was
 * installed; the sentinel test in ./section.test.ts asserts it, so a React
 * bump fails loudly instead of skipping the render suite green.
 *
 * @module dsh-ui-toggle-plugin/test/render-harness
 */

import { Rolldown } from 'tsdown'
import { writeFileSync, mkdirSync } from 'node:fs'
import React from 'react'

const internals = (React as unknown as {
  __SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED?: { ReactCurrentDispatcher?: { current: unknown } }
}).__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED

const dispatcherSeat = internals?.ReactCurrentDispatcher

export const available = dispatcherSeat !== undefined

interface Scope { slots: unknown[]; idx: number }
export interface Element { readonly tag: string; readonly props: Record<string, unknown>; readonly path: string }

const scopes = new Map<string, Scope>()
let current: Scope | null = null

function scopeFor(path: string): Scope {
  let scope = scopes.get(path)
  if (scope === undefined) {
    scope = { slots: [], idx: 0 }
    scopes.set(path, scope)
  }
  return scope
}

if (dispatcherSeat !== undefined) {
  dispatcherSeat.current = {
    useState(init: unknown) {
      const scope = current as Scope
      const at = scope.idx++
      if (!(at in scope.slots)) {
        scope.slots[at] = typeof init === 'function' ? (init as () => unknown)() : init
      }
      return [scope.slots[at], (next: unknown) => {
        scope.slots[at] = typeof next === 'function' ? (next as (v: unknown) => unknown)(scope.slots[at]) : next
      }]
    },
    useRef(init: unknown) {
      const scope = current as Scope
      const at = scope.idx++
      if (!(at in scope.slots)) scope.slots[at] = { current: init }
      return scope.slots[at]
    },
    useEffect() {},
    useCallback(fn: unknown) { return fn },
    useMemo(fn: () => unknown) { return fn() },
  }
}

let Section: ((props: unknown) => unknown) | null = null
let mod: Record<string, unknown> | null = null

async function loadModule(): Promise<Record<string, unknown>> {
  if (mod !== null) return mod
  mkdirSync(new URL('../.temp/', import.meta.url), { recursive: true })
  // One stable path, overwritten per run; the version query defeats the ESM
  // import cache so a rebuild is always picked up.
  const out = new URL('../.temp/section-render.mjs', import.meta.url)
  const bundle = await Rolldown.rolldown({
    input: new URL('../src/client/section.tsx', import.meta.url).pathname,
    // prefs.ts must NOT inline: the section's flips go through the module's
    // own writePrefs/onPrefsChanged pair, and the tests subscribe on the SAME
    // module instance they import from src. The import stays external and the
    // generate() paths option below rewrites it to the real source file, so
    // the bundle and the tests share one module instance.
    external: (id: string) =>
      id === 'react' ||
      id === 'react/jsx-runtime' ||
      id.endsWith('/prefs.ts') ||
      id === './prefs.ts',
  })
  const { output } = await bundle.generate({ format: 'esm' })
  // Rolldown does not implement rollup's output.paths, so rewrite the external
  // import by hand: './prefs.ts' is bundle-relative and wrong from .temp/;
  // '../src/client/prefs.ts' points back at the real source module.
  const code = output[0].code.replace(/(['"])\.\/prefs\.ts\1/g,
    (_m, q: string) => `${q}../src/client/prefs.ts${q}`)
  writeFileSync(out, code)
  mod = (await import(`${out.pathname}?v=${Date.now()}`)) as Record<string, unknown>
  return mod
}

async function load(): Promise<(props: unknown) => unknown> {
  if (Section !== null) return Section
  const m = await loadModule()
  Section = m.UiToggleSection as (props: unknown) => unknown
  return Section
}

function walk(node: unknown, path: string, out: Element[], depth: number): Element[] {
  if (node === null || node === undefined || node === false || depth > 80) return out
  if (Array.isArray(node)) {
    node.forEach((child, i) => walk(child, `${path}/${i}`, out, depth + 1))
    return out
  }
  const el = node as { type?: unknown; props?: Record<string, unknown> }
  if (typeof el.type === 'function') {
    const scope = scopeFor(path)
    const outer = current
    current = scope
    scope.idx = 0
    try {
      walk((el.type as (p: unknown) => unknown)(el.props ?? {}), path, out, depth + 1)
    } catch {
      // A child that needs a real renderer (context, portal) is skipped; the
      // section rows render without either.
    } finally {
      current = outer
    }
    return out
  }
  if (typeof el.type === 'string') {
    const props = (el.props ?? {}) as Record<string, unknown>
    out.push({ tag: el.type, props, path })
    const { children, ...rest } = props
    for (const [key, value] of Object.entries(rest)) {
      if (value !== null && typeof value === 'object' && 'type' in (value as object)) {
        walk(value, `${path}.${key}`, out, depth + 1)
      }
    }
    walk(children, `${path}/children`, out, depth + 1)
  }
  return out
}

export interface Rendered {
  readonly elements: readonly Element[]
  readonly find: (className: string) => Element | undefined
  readonly findAll: (className: string) => readonly Element[]
}

function toRendered(elements: Element[]): Rendered {
  const hasClass = (el: Element, name: string): boolean => {
    const value = el.props.className
    return typeof value === 'string' && value.split(/\s+/).includes(name)
  }
  return {
    elements,
    find: name => elements.find(el => hasClass(el, name)),
    findAll: name => elements.filter(el => hasClass(el, name)),
  }
}

/** A click on an element of the walked tree: invoke its onClick handler. */
export function userClick(el: Element): void {
  const onClick = el.props.onClick
  if (typeof onClick !== 'function') throw new Error('the element takes no onClick')
  ;(onClick as () => void)()
}

export async function renderSection(props: unknown, keepState = false): Promise<Rendered> {
  const render = await load()
  if (!keepState) scopes.clear()
  const root = scopeFor('')
  const outer = current
  current = root
  root.idx = 0
  try {
    return toRendered(walk(render(props), '', [], 0))
  } finally {
    current = outer
  }
}

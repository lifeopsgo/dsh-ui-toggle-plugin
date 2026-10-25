/**
 * Minimal local type surface for the browser half. The client-side slot and
 * locale services live in platform modules the harness provides at runtime
 * (`@deepseek-ai/dsh-client-ui-slots`, `-primitives`) that are NOT resolvable
 * npm packages in a standalone build, so their prop and service types cannot
 * be imported. This module declares exactly the shapes this plugin reads —
 * nothing more — matching the runtime contract verified against the harness
 * source (dsh-client-ui-settings-plugins registers its section through the
 * same `settings.section` list slot with id/order/label/locale options, and
 * builds its label translator with ctx.locale.bind). The emitted JavaScript is
 * identical to using the framework types; only the compile-time surface is
 * local.
 *
 * @module dsh-ui-toggle-plugin/client/types
 */

/** A locale dictionary: flat key to template string. */
export type LocaleDict = Record<string, string>

/** The translator handed to a slot component bound to a `locale` namespace. */
export type Translate = (key: string, params?: Record<string, string | number>) => string

/**
 * The client root context, narrowed to the services this plugin injects.
 * `slots.inject` waits for a slot declaration and installs a registration for
 * its lifetime; `locale.register` adds this plugin's dictionaries under a
 * namespace; `locale.bind` returns that namespace's translator (the shipped
 * settings sections build their section labels with it).
 */
export interface ClientContext {
  effect(factory: () => (() => void) | void, label?: string): () => void
  readonly slots: {
    inject(key: string, callback: () => (() => void) | void): () => void
    register(spec: SlotSpec, component: SlotComponent): () => void
  }
  readonly locale: {
    register(namespace: string, dictionaries: { readonly zh: LocaleDict; readonly en: LocaleDict }): () => void
    bind(namespace: string): Translate
  }
}

/** The registration spec for one slot entry. */
export interface SlotSpec {
  /** The slot key being occupied. */
  readonly name: string
  /** Stable entry id within the slot. */
  readonly id?: string
  /** Ordering hint among sibling entries (lower renders first). */
  readonly order?: number
  /** Render priority among a single slot's occupants (lowest renders). */
  readonly priority?: number
  /** Locale namespace whose translator is injected as the `t` prop. */
  readonly locale?: string
  /**
   * Nav-row label for a settings.section entry: the shell resolves it through
   * resolveSlotLabel and sorts the section list by `order`.
   */
  readonly label?: () => string
}

/** A component the slots renderer mounts for one registration. */
export type SlotComponent = (props: unknown) => unknown

/** Props the settings.section shell hands to the section component. */
export interface SectionProps {
  /** Translator bound to the registration's `locale` namespace. */
  readonly t?: Translate
  /** Present on the shell's renderSlot call; unused by this section. */
  readonly close?: () => void
  /** Scoped slot renderer for the section's declared children; none here. */
  readonly renderSlot?: unknown
}

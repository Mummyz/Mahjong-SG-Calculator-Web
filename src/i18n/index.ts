/**
 * CONSTITUTION: from the first UI commit, every user-visible string goes
 * through t(). No hardcoded UI text, ever. See CLAUDE.md.
 *
 * LANGUAGE POLICY, owner's decision of Run 7, and it widened again — but not
 * to everything. The app is LOCALISED, not translated: the sentences that
 * explain, warn, count and settle are Indonesian; the words a player taps and
 * the words that NAME things are English in both modes.
 *
 * Which is which lives in ONE place — ./scope.ts — and it is enumerated
 * there, not guessed here.
 */

import en from './en.json'
import id from './id.json'
import { TRANSLATED, translates } from './scope'

export const LOCALES = ['en', 'id'] as const
export type Locale = (typeof LOCALES)[number]
export type MessageKey = keyof typeof en

const BUNDLES: Record<Locale, Record<string, string>> = { en, id }

export { TRANSLATED, ENGLISH_ONLY, translates } from './scope'

/**
 * The language a given string is actually IN.
 *
 * Every screen is now a mix: Indonesian prose with English names and buttons
 * in it. The DOCUMENT takes the active locale — the sentences are the bulk of
 * what a screen reader has to pronounce — and this marks the English islands
 * that are long enough for the wrong phonology to matter.
 */
export const contentLocale = (key: string): Locale => (translates(key) ? current : 'en')

/** Names in their own language, which is the only way a switcher works. */
export const LOCALE_NAMES: Record<Locale, string> = { en: 'English', id: 'Bahasa Indonesia' }
export const LOCALE_SHORT: Record<Locale, string> = { en: 'EN', id: 'ID' }

const KEY = 'mahjongyuk.locale'
const isLocale = (x: unknown): x is Locale => (LOCALES as readonly string[]).includes(x as string)

const stored = (): Locale | null => {
  try {
    const v = localStorage.getItem(KEY)
    return isLocale(v) ? v : null
  } catch {
    return null
  }
}

let current: Locale = stored() ?? 'en'
const stamp = (l: Locale) => {
  try { document.documentElement.lang = l } catch { /* no document in tests */ }
}
stamp(current)
const listeners = new Set<() => void>()

export const setLocale = (l: Locale): void => {
  if (!isLocale(l) || l === current) return
  current = l
  try { localStorage.setItem(KEY, l) } catch { /* private mode — it just forgets */ }
  stamp(l)
  for (const fn of [...listeners]) fn()
}
export const getLocale = (): Locale => current

/** Subscribe to locale changes. The app re-renders itself; nothing reloads. */
export const onLocaleChange = (fn: () => void): (() => void) => {
  listeners.add(fn)
  return () => listeners.delete(fn)
}

/**
 * Look up `key` and substitute `{name}` placeholders.
 * An unknown key returns the key itself, which makes gaps obvious in the UI
 * rather than silently blank.
 */
export function t(key: MessageKey | string, vars?: Record<string, string | number>): string {
  // English unless this exact key is one the switch is allowed to change.
  const bundle = TRANSLATED.has(key) ? BUNDLES[current] : BUNDLES.en
  const raw = bundle[key] ?? BUNDLES.en[key] ?? key
  if (!vars) return raw
  return raw.replace(/\{(\w+)\}/g, (m, name: string) =>
    Object.prototype.hasOwnProperty.call(vars, name) ? String(vars[name]) : m,
  )
}

/**
 * A string that may differ between variants.
 *
 * Resolves `key.<variant>` when the bundle carries one and plain `key`
 * otherwise, so only the strings that genuinely differ have to be written
 * twice. Singapore's Four Great Blessings and Hong Kong's Great Four Winds
 * are the same hand; the two regions simply do not call it the same thing.
 */
export function tv(
  variant: string,
  key: MessageKey | string,
  vars?: Record<string, string | number>,
): string {
  const specific = `${key}.${variant}`
  const has = BUNDLES.en[specific] !== undefined
  return t(has ? specific : key, vars)
}

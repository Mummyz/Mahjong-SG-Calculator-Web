/**
 * CONSTITUTION: from the first UI commit, every user-visible string goes
 * through t(). No hardcoded UI text, ever. See CLAUDE.md.
 *
 * LANGUAGE POLICY, owner's decision of 2026-08-31 — and it narrowed sharply.
 * The interface is ENGLISH in both language modes. The language switch
 * changes exactly the strings in TRANSLATED below: the two variant
 * descriptions on the front door. Everything else resolves from English no
 * matter which mode is on.
 *
 * The full Indonesian bundle stays in the repo. It is complete, it passed the
 * Language Critic in Run 4, and it is what a future owner decision would
 * switch back on — so it is kept rather than deleted, and TRANSLATED is the
 * one line that would have to change. What it must NOT do is drift: the
 * coverage test still holds every key in it to the glossary.
 */

import en from './en.json'
import id from './id.json'

export const LOCALES = ['en', 'id'] as const
export type Locale = (typeof LOCALES)[number]
export type MessageKey = keyof typeof en

const BUNDLES: Record<Locale, Record<string, string>> = { en, id }

/**
 * The only keys the language switch reaches.
 *
 * Two sentences, and they are the two the owner picked: what each variant IS.
 * A player choosing between Singapore and Hong Kong is the one moment on the
 * front door where the words carry a decision rather than a label, so that is
 * where reading it in your own language is worth something.
 */
export const TRANSLATED: ReadonlySet<string> = new Set([
  'variant.singapore.blurb',
  'variant.hongkong.blurb',
])

/** Whether `key` is one the language switch actually changes. */
export const translates = (key: string): boolean => TRANSLATED.has(key)

/**
 * The language a translated string is IN, for a `lang` attribute on the one
 * element that carries it. The document itself stays `en`: an English page
 * with an Indonesian sentence in it is exactly what the markup should say,
 * and it is what makes a screen reader pronounce that sentence properly.
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
// The document is English whatever the switch says — see the policy above.
try { document.documentElement.lang = 'en' } catch { /* no document in tests */ }
const listeners = new Set<() => void>()

export const setLocale = (l: Locale): void => {
  if (!isLocale(l) || l === current) return
  current = l
  try { localStorage.setItem(KEY, l) } catch { /* private mode — it just forgets */ }
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

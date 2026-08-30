/**
 * CONSTITUTION: from the first UI commit, every user-visible string goes
 * through t(). No hardcoded UI text, ever. See CLAUDE.md.
 *
 * Two locales. English is the source of truth and the default; Bahasa
 * Indonesia is the one where the brand's own joke lands natively — the product
 * is called "Mahjong, yuk!" — and its terms are fixed by docs/GLOSSARY-ID.md.
 *
 * A missing Indonesian string falls back to English rather than showing a raw
 * key, because a player mid-hand needs a word, not a bug report. The coverage
 * test makes sure that fallback never has to fire.
 */

import en from './en.json'
import id from './id.json'

export const LOCALES = ['en', 'id'] as const
export type Locale = (typeof LOCALES)[number]
export type MessageKey = keyof typeof en

const BUNDLES: Record<Locale, Record<string, string>> = { en, id }

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
try { document.documentElement.lang = current } catch { /* no document in tests */ }
const listeners = new Set<() => void>()

export const setLocale = (l: Locale): void => {
  if (!isLocale(l) || l === current) return
  current = l
  try { localStorage.setItem(KEY, l) } catch { /* private mode — it just forgets */ }
  try { document.documentElement.lang = l } catch { /* no document in tests */ }
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
  const raw = BUNDLES[current][key] ?? BUNDLES.en[key] ?? key
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
  const has = BUNDLES[current][specific] !== undefined || BUNDLES.en[specific] !== undefined
  return t(has ? specific : key, vars)
}

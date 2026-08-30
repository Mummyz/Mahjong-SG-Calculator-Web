/**
 * CONSTITUTION: from the first UI commit, every user-visible string goes
 * through t(). No hardcoded UI text, ever. See CLAUDE.md.
 *
 * Run 5 adds Bahasa Indonesia and a locale switch; until then `en` is the only
 * bundle and t() resolves against it directly.
 */

import en from './en.json'

export type Locale = 'en'
export type MessageKey = keyof typeof en

const BUNDLES: Record<Locale, Record<string, string>> = { en }

let current: Locale = 'en'
export const setLocale = (l: Locale): void => {
  current = l
}
export const getLocale = (): Locale => current

/**
 * Look up `key` and substitute `{name}` placeholders.
 * An unknown key returns the key itself, which makes gaps obvious in the UI
 * rather than silently blank.
 */
export function t(key: MessageKey | string, vars?: Record<string, string | number>): string {
  const raw = BUNDLES[current][key] ?? key
  if (!vars) return raw
  return raw.replace(/\{(\w+)\}/g, (m, name: string) =>
    Object.prototype.hasOwnProperty.call(vars, name) ? String(vars[name]) : m,
  )
}

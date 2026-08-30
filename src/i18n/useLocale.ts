import { useEffect, useState } from 'preact/hooks'
import { getLocale, onLocaleChange, setLocale, type Locale } from './index'

/**
 * The whole app re-renders when the locale changes — no reload, no flash, and
 * the hand the player is halfway through keying stays exactly where it was.
 */
export function useLocale(): [Locale, (l: Locale) => void] {
  const [locale, set] = useState<Locale>(getLocale())
  useEffect(() => onLocaleChange(() => set(getLocale())), [])
  return [locale, setLocale]
}

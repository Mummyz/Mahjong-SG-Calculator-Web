import { t, LOCALES, LOCALE_SHORT } from '../../i18n'
import { useLocale } from '../../i18n/useLocale'

/**
 * The language switch.
 *
 * Each language is named in its own language, because a player who cannot
 * read the current one cannot read a label about it either. Switching is
 * instant and keeps the hand in progress: nothing reloads.
 *
 * Since the owner narrowed the language policy the switch reaches exactly the
 * two variant descriptions — see TRANSLATED in src/i18n. The group's
 * accessible name says so, because "Language" on a control that changes two
 * sentences is a promise the app does not keep.
 */
export function LanguageToggle({ compact }: { compact?: boolean }) {
  const [locale, set] = useLocale()
  return (
    <div class={`langtoggle${compact ? ' langtoggle--compact' : ''}`}
      role="radiogroup" aria-label={t('menu.languageScope')}>
      {LOCALES.map((l) => (
        <button type="button" key={l} class="langtoggle__opt" role="radio" lang={l}
          aria-checked={locale === l ? 'true' : 'false'}
          onClick={() => set(l)}>
          {compact ? LOCALE_SHORT[l] : t(`lang.${l}`)}
        </button>
      ))}
    </div>
  )
}

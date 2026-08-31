import { contentLocale, t } from '../../i18n'
import { Logo } from '../components/Brand'
import { LanguageToggle } from '../components/LanguageToggle'
import { VARIANTS, type VariantId } from '../../engine/variants'

/**
 * The front door.
 *
 * Run 5 emptied it out. The wall of green tile backs is gone, the three
 * sample tiles are off the cards, and the line that hedged about rules is
 * deleted. What is left is the logo, the promise under it, and two choices —
 * which is the whole job of a front door, and the artwork can now be the
 * loudest thing on the screen because nothing else is competing with it.
 */
const ORDER: VariantId[] = ['singapore', 'hongkong']

export function VariantSelect({ onPick }: { onPick: (v: VariantId) => void }) {
  return (
    <div class="shell">
      <div class="scroll">
        <div class="hero">
          <div class="hero__lang"><LanguageToggle compact /></div>
          <div class="hero__inner">
            <Logo />
            <p class="hero__tagline">{t('app.tagline')}</p>
          </div>
        </div>

        <h2 class="title">{t('variant.title')}</h2>

        {ORDER.map((id) => (
          <button type="button" class="card gamecard" key={id} onClick={() => onPick(id)}>
            <span class="gamecard__top">
              <span class="gamecard__name">{t(`variant.${id}.name`)}</span>
              <span class="gamecard__n" aria-hidden="true">{VARIANTS[id].tileSet.total}</span>
            </span>
            {/* The blurb is the ONE string on this screen that translates —
                see CLAUDE.md, LANGUAGE POLICY. It already names the tile
                count in words, so the badge beside it stays aria-hidden.
                Play sits ON the blurb's row: with the sample tiles gone it
                had a third of the card to itself and read as an orphan. */}
            <span class="gamecard__foot">
              <span class="gamecard__blurb" lang={contentLocale(`variant.${id}.blurb`)}>
                <span>{t(`variant.${id}.blurb`)}</span>
              </span>
              <span class="gamecard__go">{t('variant.play')}</span>
            </span>
          </button>
        ))}
      </div>
    </div>
  )
}

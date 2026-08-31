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

/**
 * THE AMERICAN CARD IS NOT A VARIANT AND NEVER WILL BE.
 *
 * The owner's decision, Run 6B: it is a permanent teaser, shown because
 * players ask for it, never built because the NMJL card is copyrighted. It is
 * deliberately NOT in VARIANTS, has no tile set, no rules and no corpus, and
 * `onPick` cannot be reached from it — it renders as a plain element, so
 * there is nothing to tap, nothing to focus and nothing to activate.
 *
 * See CLAUDE.md, VARIANTS. Do not promote this to a roadmap item.
 */
const TEASER_TILES = 152

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

        {/* Inert BY CONSTRUCTION, not by a disabled attribute: a <div> has no
            activation behaviour, is not in the tab order and fires no click
            handler, so there is no path from this card into onPick. It keeps
            the other cards' anatomy — name, tile count, one line, a pill in
            the Play slot — because the point is that it looks like the same
            kind of thing, not that it looks broken. */}
        <div class="card gamecard gamecard--teaser">
          <span class="gamecard__top">
            <span class="gamecard__name">{t('variant.american.name')}</span>
            <span class="gamecard__n" aria-hidden="true">{TEASER_TILES}</span>
          </span>
          <span class="gamecard__foot">
            <span class="gamecard__blurb" lang={contentLocale('variant.american.blurb')}>
              <span>{t('variant.american.blurb')}</span>
            </span>
            <span class="gamecard__wip">{t('variant.american.badge')}</span>
          </span>
        </div>
      </div>
    </div>
  )
}

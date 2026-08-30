import { t } from '../../i18n'
import { Tile, BonusTile } from '../components/Tile'
import { Wordmark, HeroWall } from '../components/Brand'
import { LanguageToggle } from '../components/LanguageToggle'
import { VARIANTS, inventoryOf, type VariantId } from '../../engine/variants'
import type { BonusId, TileId } from '../../engine/core/tiles'

/**
 * The front door.
 *
 * It opens on an actual mahjong wall — a clipped row of real tile backs — so
 * the first thing on screen is the game rather than a form. Each variant card
 * carries three real tiles, and the tiles are chosen to TEACH the difference
 * the cards are describing: Singapore shows an animal, Hong Kong shows a wind
 * where the animal would be.
 */
const ORDER: VariantId[] = ['singapore', 'hongkong']

/**
 * Two ordinary tiles, and then the tile that makes this variant DIFFERENT
 * from the other one.
 *
 * The third slot holds the first tile of a bonus group this variant has and
 * the other does not — Singapore's animals. A variant with no such group
 * shows a third ordinary tile instead, which is the whole lesson: one card
 * has a peach tile on the end and the other does not. Derived from the tile
 * sets, so if the lineup ever changed the card would change with it, and
 * showing a season on both cards would teach nothing at all.
 */
const sampleFor = (id: VariantId): { tiles: TileId[]; bonus: BonusId[] } => {
  const mine = inventoryOf(VARIANTS[id]).bonusGroups
  const others = new Set(
    ORDER.filter((v) => v !== id)
      .flatMap((v) => inventoryOf(VARIANTS[v]).bonusGroups.map((g) => g.key)),
  )
  const only = mine.find((g) => !others.has(g.key))
  return only
    ? { tiles: ['5p', 'E'], bonus: [only.tiles[0] as BonusId] }
    : { tiles: ['5p', 'E', '3s'], bonus: [] }
}

export function VariantSelect({ onPick }: { onPick: (v: VariantId) => void }) {
  return (
    <div class="shell">
      <div class="scroll">
        <div class="hero">
          <HeroWall />
          {/* compact: the full names run to 210px and covered most of the
              hero wall. The menu carries the same control. */}
          <div class="hero__lang"><LanguageToggle compact /></div>
          <div class="hero__inner">
            <Wordmark />
            <p class="sub" style="margin:8px 0 0">{t('app.tagline')}</p>
            <p class="hero__invite">{t('app.invite')}</p>
          </div>
        </div>

        <h2 class="title">{t('variant.title')}</h2>
        <p class="sub">{t('variant.subtitle')}</p>

        {ORDER.map((id) => (
          <button type="button" class="card gamecard" key={id} onClick={() => onPick(id)}>
            <span class="gamecard__top">
              <span class="gamecard__name">{t(`variant.${id}.name`)}</span>
              <span class="gamecard__n" aria-hidden="true">{VARIANTS[id].tileSet.total}</span>
            </span>
            <span class="gamecard__blurb"><span>{t(`variant.${id}.blurb`)}</span></span>
            <span class="gamecard__foot">
              <span class="gamecard__tiles" aria-hidden="true">
                {sampleFor(id).tiles.map((x) => <Tile key={x} id={x} />)}
                {sampleFor(id).bonus.map((b) => (
                  <BonusTile key={b} id={b} seat="E" decorative />
                ))}
              </span>
              <span class="gamecard__go">{t('variant.play')}</span>
            </span>
          </button>
        ))}
      </div>
    </div>
  )
}

import { t } from '../../i18n'
import { Tile, BonusTile } from '../components/Tile'
import { VARIANTS, inventoryOf, type VariantId } from '../../engine/variants'
import type { BonusId, TileId, Wind } from '../../engine/core/tiles'

/**
 * How a group is laid out, if we happen to know it. This is presentation
 * only: the GROUPS THEMSELVES come from the variant, so a variant without
 * animals simply has no animal section and a variant with a group nobody
 * anticipated still renders, at four columns and without a stamp.
 */
const LAYOUT: Record<string, { cols: 4 | 5; stamp?: string }> = {
  characters: { cols: 5, stamp: '萬' },
  dots: { cols: 5, stamp: '筒' },
  bamboo: { cols: 5, stamp: '索' },
  winds: { cols: 4 },
  dragons: { cols: 4, stamp: '箭' },
}

export function TileInfo({ variant, seat, fromHand, onBack, onContinue }: {
  variant: VariantId
  seat: Wind
  /** Opened from a hand in progress, so both dock actions return to it. */
  fromHand?: boolean
  onBack: () => void
  onContinue: () => void
}) {
  const plugin = VARIANTS[variant]
  const inv = inventoryOf(plugin)
  const groups = [...inv.wallGroups, ...inv.bonusGroups]
  return (
    <div class="shell">
      <div class="scroll">
        <h1 class="title">{t('tileinfo.title')}</h1>
        <p class="sub">
          {t('tileinfo.subtitle', {
            variant: t(`variant.${variant}.name`),
            count: plugin.tileSet.total,
          })}
        </p>

        {groups.map((g) => {
          const row = LAYOUT[g.key] ?? { cols: 4 as const }
          const total = g.tiles.length * g.copies
          const isBonus = inv.bonusTiles.has(g.tiles[0] as never)
          return (
            <section key={g.key}>
              <div class="grouplabel">
                <span class="caps">{t(`tileinfo.group.${g.key}`)}</span>
                <span class="grouplabel__rule" />
                <span class="grouplabel__n">
                  {isBonus
                    ? t('tileinfo.groupCountSingle', { total })
                    : t('tileinfo.groupCount', { tiles: g.tiles.length, copies: g.copies, total })}
                </span>
              </div>
              <div class={`grid grid--${row.cols}`}>
                {g.tiles.map((id) =>
                  isBonus
                    ? <BonusTile key={id} id={id as BonusId} seat={seat} />
                    : <Tile key={id} id={id as TileId} />,
                )}
                {row.stamp && (
                  <div class="stampcell" aria-hidden="true">
                    <span class="stampcell__glyph">{row.stamp}</span>
                    <span class="stampcell__n">×{total}</span>
                  </div>
                )}
              </div>
            </section>
          )
        })}

        <div class="slip" style="margin-top:16px">
          <p class="caps" style="margin:0 0 6px">{t('tileinfo.jokers.title')}</p>
          <p style="margin:0">
            {variant === 'hongkong'
              ? t('tileinfo.jokers.hongkong')
              : t('tileinfo.jokers.singapore')}
          </p>
        </div>

        <div class="grouplabel" style="margin-top:16px">
          <span class="caps">{t('tileinfo.total')}</span>
          <span class="grouplabel__rule" />
          <span class="grouplabel__n">{plugin.tileSet.total}</span>
        </div>
      </div>

      <div class="dock">
        {fromHand ? (
          <button type="button" class="btn btn--primary btn--block" onClick={onContinue}>
            {t('nav.backToHand')}
          </button>
        ) : (
          <div class="dock__row">
            <button type="button" class="btn btn--ghost" onClick={onBack}>{t('nav.back')}</button>
            <button type="button" class="btn btn--primary btn--block" onClick={onContinue}>
              {t('nav.continue')}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

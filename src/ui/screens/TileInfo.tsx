import { t } from '../../i18n'
import { Tile, BonusTile } from '../components/Tile'
import { singapore } from '../../engine/variants/singapore'
import type { BonusId, TileId, Wind } from '../../engine/core/tiles'

const LAYOUT: { key: string; cols: 4 | 5; stamp?: string }[] = [
  { key: 'characters', cols: 5, stamp: '萬' },
  { key: 'dots', cols: 5, stamp: '筒' },
  { key: 'bamboo', cols: 5, stamp: '索' },
  { key: 'winds', cols: 4 },
  { key: 'dragons', cols: 4, stamp: '箭' },
  { key: 'flowers', cols: 4 },
  { key: 'seasons', cols: 4 },
  { key: 'animals', cols: 4 },
]

export function TileInfo({ seat, fromHand, onBack, onContinue }: {
  seat: Wind
  /** Opened from a hand in progress, so both dock actions return to it. */
  fromHand?: boolean
  onBack: () => void
  onContinue: () => void
}) {
  const groups = singapore.tileSet.groups
  return (
    <div class="shell">
      <div class="scroll">
        <h1 class="title">{t('tileinfo.title')}</h1>
        <p class="sub">
          {t('tileinfo.subtitle', {
            variant: t('variant.singapore.name'),
            count: singapore.tileSet.total,
          })}
        </p>

        {LAYOUT.map((row) => {
          const g = groups.find((x) => x.key === row.key)
          if (!g) return null
          const total = g.tiles.length * g.copies
          const isBonus = g.copies === 1
          return (
            <section key={row.key}>
              <div class="grouplabel">
                <span class="caps">{t(`tileinfo.group.${row.key}`)}</span>
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
          <p style="margin:0">{t('tileinfo.jokers.body')}</p>
        </div>

        <div class="grouplabel" style="margin-top:16px">
          <span class="caps">{t('tileinfo.total')}</span>
          <span class="grouplabel__rule" />
          <span class="grouplabel__n">{singapore.tileSet.total}</span>
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

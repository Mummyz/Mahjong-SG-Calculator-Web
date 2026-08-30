import { t } from '../../i18n'
import { formatStake } from '../format'
import {
  isDealer, prevailingWind, yourSeat, type TableState,
} from '../../engine/variants/singapore/table'

const WIND_GLYPH: Record<string, string> = { E: '東', S: '南', W: '西', N: '北' }

/** Always on screen: which hand, which round, which wind you are, and the money. */
export function Signboard({ table, stake, limit, onMenu }: {
  table: TableState
  stake: number
  limit: number
  onMenu: () => void
}) {
  const round = prevailingWind(table)
  const seat = yourSeat(table)
  const dealer = isDealer(table, table.youIndex)

  return (
    <div class="signboard">
      <div class="signboard__seg">
        <span class="signboard__k">{t('signboard.hand', { n: table.handNumber })}</span>
        <span class="signboard__v">
          {WIND_GLYPH[round]} {t('signboard.round', { wind: t(`wind.${round}.short`) })}
        </span>
      </div>
      <div class="signboard__seg">
        <span class="signboard__k">
          {t('table.youTag')}{dealer ? ` · ${t('table.dealerTag')}` : ''}
        </span>
        <span class="signboard__v">
          {WIND_GLYPH[seat]} {t(`wind.${seat}`)}
        </span>
      </div>
      <div class="signboard__seg">
        <span class="signboard__k">{t('signboard.stake')}</span>
        <span class="signboard__v">{t('signboard.money', {
          stake: formatStake(stake), limit,
        })}</span>
      </div>
      <button type="button" class="signboard__info" onClick={onMenu}
        aria-label={t('signboard.menu')}>⋯</button>
    </div>
  )
}

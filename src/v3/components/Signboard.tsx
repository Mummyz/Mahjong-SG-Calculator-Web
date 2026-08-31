import { t } from '../../i18n'
import { formatStake } from '../format'
import { seatWindOf, yourSeat, type TableState } from '../../engine/session/table'

const WIND_GLYPH: Record<string, string> = { E: '東', S: '南', W: '西', N: '北' }

/** The name at seat `i`, or the number the table knows them by. */
export const playerName = (table: TableState, i: number): string =>
  table.players[i] || (i === table.youIndex
    ? t('table.youName')
    : t('table.playerN', { n: i + 1 }))

/**
 * Always on screen: which round, who you are, who is dealing, and the money.
 *
 * Run 5 folded the four-seat strip into here. It ran the full width under the
 * signboard to say four things, of which two mattered — which wind you are
 * and who deals — and both are scoring inputs. They now sit in the two cells
 * that were saying "Hand 1" and "You · Dealer", which cost nothing and gave
 * the hand back a hundred pixels of screen.
 */
export function Signboard({ table, stake, limit, onMenu, disabled }: {
  table: TableState
  stake: number
  limit: number
  onMenu: () => void
  /** Focus mode: a meld is being declared and nothing else responds. */
  disabled?: boolean
}) {
  const seat = yourSeat(table)
  // Always 東, and that is the rule rather than a bug: seatWindOf puts East on
  // the dealer by construction, because in mahjong the dealer IS East. It is
  // kept because it says which wind the dealer's seat is, which is exactly
  // what a player learning the game needs from this cell.
  const dealerWind = seatWindOf(table, table.dealerIndex)

  return (
    <div class="signboard">
      <div class="signboard__seg">
        <span class="signboard__k">{t('signboard.roundN', { n: table.handNumber })}</span>
        <span class="signboard__v">
          <span class="signboard__w" aria-hidden="true">{WIND_GLYPH[seat]}</span>
          <span class="sr">{t(`wind.${seat}`)}</span>
          <span class="signboard__name">{playerName(table, table.youIndex)}</span>
        </span>
      </div>
      <div class="signboard__seg">
        <span class="signboard__k">{t('signboard.dealer')}</span>
        <span class="signboard__v">
          <span class="signboard__w" aria-hidden="true">{WIND_GLYPH[dealerWind]}</span>
          <span class="sr">{t(`wind.${dealerWind}`)}</span>
          <span class="signboard__name">{playerName(table, table.dealerIndex)}</span>
        </span>
      </div>
      <div class="signboard__seg">
        <span class="signboard__k">{t('signboard.stake')}</span>
        <span class="signboard__v">
          <span class="signboard__name">{t('signboard.money', {
            stake: formatStake(stake), limit,
          })}</span>
        </span>
      </div>
      {/* The prevailing wind left the strip when the seat row did. It is a
          scoring input, so the table menu behind this button carries it as a
          visible fact — a control's name says what the control does, not what
          the game currently happens to be. */}
      <button type="button" class="signboard__info" onClick={onMenu} disabled={disabled}
        aria-label={t('signboard.menu')}>⋯</button>
    </div>
  )
}

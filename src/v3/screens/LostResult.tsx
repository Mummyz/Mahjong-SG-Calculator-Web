import { t } from '../../i18n'
import { Tile } from '../components/Tile'
import { formatMoney } from '../format'
import { seatWindOf, type TableState } from '../../engine/session/table'

/**
 * WHAT A HAND YOU DID NOT WIN COST YOU.
 *
 * The scored-win result screen answers "what is this hand worth" and shows all
 * four players, because the player is the winner and the whole table is the
 * answer. This screen answers a different question — "what do I owe" — so it
 * leads with that one figure and says who won and for how much as context.
 *
 * The other two losers' amounts are deliberately NOT featured. They are
 * recorded (the ledger keeps all four signed amounts, so the running total
 * stays right and still balances) but nobody at the table asks this app what
 * the player on their left owes; they ask what THEY owe.
 */
export function LostResult({
  table, winnerIndex, discarderIndex, fan, deltas, stake, onNext, onMenu,
}: {
  table: TableState
  winnerIndex: number
  discarderIndex: number | null
  fan: number
  /** All four signed amounts, winner positive. */
  deltas: readonly number[]
  stake: number
  onNext: () => void
  onMenu: () => void
}) {
  const nameOf = (i: number) => table.players[i] || t('table.playerN', { n: i + 1 })
  /**
   * `+ 0` because negating a zero delta gives -0, which formats as "−0".
   * Paying nothing is a real Hong Kong outcome and it has to read like one.
   */
  const owed = -(deltas[table.youIndex] ?? 0) + 0

  return (
    <div class="shell">
      <div class="scroll">
        <h1 class="title">{t('lost.title')}</h1>

        <div class="card resultblock">
          {/* THE HEADLINE. One figure, the one the player came for. */}
          {owed === 0 ? (
            <p class="resultblock__fan resultblock__fan--none">{t('lost.youPayNothing')}</p>
          ) : (
            <p class="resultblock__fan">
              <span class="resultblock__unit">{t('lost.youPay')}</span>
              <br />
              {formatMoney(owed, stake)}
            </p>
          )}

          {/* Why. Who won, how, and for how much — the context for the figure
              above, not a second table of numbers. */}
          <p class="lostwho">
            <span class="seatcell">
              <Tile id={seatWindOf(table, winnerIndex)} small />
              <span>
                <span class="seatcell__name">{nameOf(winnerIndex)}</span><br />
                <span class="seatcell__verb">
                  {discarderIndex === null
                    ? t('lost.wonSelfDraw')
                    : discarderIndex === table.youIndex
                      ? t('lost.wonOffYou')
                      : t('lost.wonOffThem', { name: nameOf(discarderIndex) })}
                </span>
              </span>
            </span>
            <span class="lostwho__fan">{t('result.fan', { n: fan })}</span>
          </p>

          {owed === 0 && (
            <p class="capnote" style="margin:10px 0 0">{t('lost.nothingWhy')}</p>
          )}
          <p class="capnote" style="margin:10px 0 0">{t('lost.recorded')}</p>
        </div>
      </div>

      <div class="dock">
        <div class="dock__row">
          <button type="button" class="btn btn--ghost" onClick={onMenu}>
            {t('signboard.menu')}
          </button>
          <button type="button" class="btn btn--primary btn--block" onClick={onNext}>
            {t('result.nextHand')}
          </button>
        </div>
      </div>
    </div>
  )
}

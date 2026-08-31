import { useState } from 'preact/hooks'
import { t } from '../../i18n'
import { formatMoney } from '../format'
import { Tile } from '../components/Tile'
import { runningTotal, seatWindOf, type HandLedger, type TableState } from '../../engine/session/table'

/**
 * The end of the night.
 *
 * One question: who is up and who is down, across everything this table
 * settled. The figures are the same signed units the result screen shows, so
 * a player can check the last hand against the total without converting
 * anything in their head — and the total balances for the same reason that
 * one hand does: it is a sum of movements between players.
 *
 * It says how many hands are covered as well as how many were played. A hand
 * somebody else won moved money the app never saw, and a total that quietly
 * pretended otherwise would be worse than no total.
 */
export function EndGame({ table, stake, ledger, pending, onBack, onNewGame }: {
  table: TableState
  stake: number
  ledger: readonly HandLedger[]
  /** The hand still on the result screen: settled, not yet committed. */
  pending?: readonly number[] | null
  onBack: () => void
  onNewGame: () => void
}) {
  const [confirm, setConfirm] = useState(false)
  const entries: HandLedger[] = pending
    ? [...ledger, {
      handNumber: table.handNumber, round: 1,
      winnerIndex: table.youIndex, deltas: [...pending],
    }]
    : [...ledger]
  const totals = runningTotal(entries, table.players.length)
  const nameOf = (i: number) => table.players[i] || t('table.playerN', { n: i + 1 })
  /**
   * handNumber is the hand being PLAYED, so completed hands are one fewer —
   * unless `pending` is set, in which case the hand on the result screen has
   * just been settled and counts. Without that the screen under-reported a
   * night by one whenever a washout had advanced the deal without adding a
   * ledger row. The max keeps washouts counted: they are hands played that
   * nobody settled.
   */
  const played = Math.max(pending ? table.handNumber : table.handNumber - 1, entries.length)
  const best = totals.reduce((b, v, i) => (v > (totals[b] ?? 0) ? i : b), 0)
  const level = totals.every((v) => v === 0)
  // Highest first: the question this screen answers is who came out ahead.
  const order = table.players.map((_, i) => i)
    .sort((a, b) => (totals[b] ?? 0) - (totals[a] ?? 0))

  return (
    <div class="shell">
      <div class="scroll">
        <h1 class="title">{t('endgame.title')}</h1>
        <p class="sub">{t('endgame.sub')}</p>

        <div class="card">
          <p class="capnote" style="margin:0 0 10px">
            {t('endgame.handsPlayed', { played, settled: entries.length })}
          </p>
          <table class="ledger">
            <tbody>
              {order.map((i) => {
                const units = totals[i] ?? 0
                return (
                  <tr key={i}>
                    <td>
                      <span class="seatcell">
                        <Tile id={seatWindOf(table, i)} small />
                        <span>
                          <span class="seatcell__name">{nameOf(i)}</span><br />
                          <span class="seatcell__verb">
                            {i === table.youIndex ? t('result.you') : ''}
                          </span>
                        </span>
                      </span>
                    </td>
                    <td class={`ledger__amt ${units === 0 ? 'zero' : units > 0 ? 'collect' : 'pay'}`}>
                      {units === 0 ? '—' : formatMoney(units, stake, true)}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          <div class="totalband">
            <span class="totalband__k">
              {level ? t('endgame.level') : t('endgame.ahead', { name: nameOf(best) })}
            </span>
            {/* The WINNER'S total, not the sum of all four — that sum is zero
                by construction (settleHand moves units, it never writes them),
                so this slot printed a permanent "0" beside a label naming who
                came out ahead. On the result screen the same band IS the
                zero-balance proof; here the label asks a different question
                and the figure has to answer it. */}
            <span class="totalband__v">
              {level ? '—' : formatMoney(totals[best] ?? 0, stake, true)}
            </span>
          </div>
        </div>
      </div>

      <div class="dock">
        <div class="dock__row">
          <button type="button" class="btn btn--ghost" onClick={onBack}>
            {t('endgame.back')}
          </button>
          <button type="button" class="btn btn--primary btn--block"
            aria-pressed={confirm ? 'true' : 'false'}
            onClick={() => {
              if (!confirm) {
                setConfirm(true)
                window.setTimeout(() => setConfirm(false), 4000)
                return
              }
              onNewGame()
            }}>
            {confirm ? t('endgame.confirm') : t('endgame.newGame')}
          </button>
        </div>
      </div>
    </div>
  )
}

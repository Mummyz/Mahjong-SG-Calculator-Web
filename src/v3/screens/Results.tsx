import { useState } from 'preact/hooks'
import { t, tv } from '../../i18n'
import { formatMoney, formatStake } from '../format'
import { Tile } from '../components/Tile'

import type { HandState } from './HandEntry'
import type { WinSubmission } from '../../engine/session/table'
import { VARIANTS, type VariantId } from '../../engine/variants'
import {
  prevailingWind, runningTotal, scoreKeyedHand, seatWindOf, settleHand, yourSeat,
  type HandLedger, type TableState,
} from '../../engine/session/table'
import type { RuleOptions, ScoreResult, WinContext } from '../../engine/core/variant'


/**
 * Components that describe how the hand was won or what was in the flower
 * tray, rather than naming the hand. Everything else is a hand name.
 */
const NOT_A_HAND = new Set([
  'fullyConcealed', 'robbingKong', 'lastTile', 'lastDiscard', 'selfDraw',
  'kongReplacement', 'flowerReplacement', 'noFlowers',
  'dragonTriplet', 'seatWind', 'prevailingWind', 'seatPrevailingWind',
  'seatFlower', 'seatSeason', 'completeFlowerGroup', 'completeSeasonGroup',
  'animal', 'allAnimals',
])

/** Value sets: present, they mean the hand is not a bare 雞胡 after all. */
const VALUE_SETS = ['dragonTriplet', 'seatWind', 'prevailingWind', 'seatPrevailingWind']

export function Results({
  variant, table, stake, limit, halfPayment, hand, submission, onEdit, onNext,
  onEndGame, ledger,
}: {
  variant: VariantId
  table: TableState
  stake: number
  limit: number
  halfPayment: boolean
  hand: HandState
  submission: WinSubmission
  onEdit: () => void
  /** Hands this table has already settled. This one is not in it yet. */
  ledger: readonly HandLedger[]
  onNext: (deltas: readonly number[]) => void
  onEndGame: (deltas: readonly number[]) => void
}) {
  const plugin = VARIANTS[variant]
  const nameOf = (i: number) => table.players[i] || t('table.playerN', { n: i + 1 })
  const [confirmNext, setConfirmNext] = useState(false)
  const [tab, setTab] = useState<'this' | 'total'>('this')

  const ctx: WinContext = {
    seat: yourSeat(table),
    prevailing: prevailingWind(table),
    win: submission.win,
    winningTile: submission.winningTile,
    flags: submission.flags as never,
    pao: submission.pao,
  }
  const opts: Partial<RuleOptions> = { limit, halfPayment }
  // Everything below is read off the engine. The UI computes no score — it
  // only hands over every reading of the keyed hand and keeps the best.
  const { result }: { result: ScoreResult } = scoreKeyedHand(
    plugin, { concealed: hand.concealed, melds: hand.melds, bonus: hand.bonus }, ctx, opts,
  )
  const pay = plugin.payments(result, ctx, opts)
  const instant = plugin.instantPayouts?.(hand.bonus, yourSeat(table)) ?? []
  /**
   * This hand, signed, per player. Built by moving units between players, so
   * it balances by construction rather than by the arithmetic being right.
   */
  const deltas = pay
    ? settleHand({
      playerCount: table.players.length,
      winnerIndex: table.youIndex,
      pay,
      win: submission.win,
      discarderIndex: submission.discarderIndex,
      instants: instant,
    })
    : table.players.map(() => 0)
  // The running total INCLUDES this hand: a player reading it wants the state
  // of the night as it stands, not as it stood before the hand they just won.
  const totals = runningTotal(
    [...ledger, { handNumber: table.handNumber, round: 1, winnerIndex: table.youIndex, deltas }],
    table.players.length,
  )

  if (!result.valid) {
    return (
      <div class="shell">
        <div class="scroll">
          <h1 class="title">{t('result.title')}</h1>
          <div class="card">
            <p class="handname" style="color:var(--mj-pay)">{t('result.notAWin')}</p>
            <p style="margin:8px 0 0">
              {tv(variant, `reject.${result.reason}`, { min: plugin.defaults.minTai })}
            </p>
          </div>
        </div>
        <div class="dock">
          <button type="button" class="btn btn--primary btn--block" onClick={onEdit}>
            {t('result.editHand')}
          </button>
        </div>
      </div>
    )
  }

  const names = result.fan.map((f) => f.key).filter((k) => !NOT_A_HAND.has(k))
  const seen = new Set<string>()
  const uniqueNames = names.filter((n) => (seen.has(n) ? false : (seen.add(n), true)))

  // A plain hand — no scoring pattern, no value pong — is 雞胡 in both
  // variants. The engine emits no component for it, so the UI names it when
  // nothing else did.
  const shown = uniqueNames.length === 0
      && !result.fan.some((f) => VALUE_SETS.includes(f.key))
    ? ['chickenHand']
    : uniqueNames

  const flowerHand = result.patterns.includes('sevenFlowers')
    || result.patterns.includes('eightFlowers')
  const thirteenNote = variant === 'singapore' && result.patterns.includes('thirteenWonders')
  const paoNote = submission.pao && submission.win === 'discard'
    && submission.discarderIndex !== null && !thirteenNote

  return (
    <div class="shell">
      <div class="scroll">
        <h1 class="title">{t('result.title')}</h1>

        {/* ONE BLOCK. The medal and the mascot were a second and third thing
            competing with the number they were decorating, and the breakdown
            that explains the number sat two cards further down. What the hand
            scored, what it is called, and where the fan came from are one
            fact, so they are one block, and it is the first thing under the
            heading. */}
        <div class="card resultblock">
          <div class="resultblock__top">
            <span class="resultblock__fan">{result.totalTai}</span>
            <span class="resultblock__unit">{t('result.fanUnit')}</span>
            <span class="resultblock__names">
              {/* English only, and one name per line — see Run 7. */}
              {shown.map((k) => (
                <span class="handname" key={k}>{tv(variant, `pattern.${k}`)}</span>
              ))}
            </span>
          </div>
          {result.limitApplied && (
            <p class="capnote" style="margin:8px 0 0">
              {t('result.fanCapped', { limit, raw: result.rawTai })}
            </p>
          )}
          <table class="breakdown" style="margin-top:10px">
            <tbody>
              {result.fan.map((f, i) => (
                <tr key={`${f.key}-${i}`}>
                  <td>{tv(variant, `pattern.${f.key}`)}</td>
                  <td>+{f.tai}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div class="grouplabel">
            <span class="caps">{tv(variant, 'result.basePoints')}</span>
            <span class="grouplabel__rule" />
            <span class="grouplabel__n">{result.base}</span>
          </div>
        </div>

        {instant.length > 0 && (
          <div class="card" style="margin-top:12px">
            <div class="grouplabel" style="margin-top:0">
              <span class="caps">{t('result.instant')}</span>
              <span class="grouplabel__rule" />
            </div>
            <p class="sub" style="margin:0 0 8px">{t('result.instantHint')}</p>
            <table class="breakdown">
              <tbody>
                {instant.map((p) => (
                  <tr key={p.key}>
                    <td>{t(`instant.${p.key}`)}</td>
                    <td>{t('result.instantEach', {
                      amount: formatMoney(p.fromEachPlayer, stake),
                    })}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {pay && (
          <div class="card" style="margin-top:12px">
            <div class="grouplabel" style="margin-top:0">
              <span class="caps">{t('result.payments')}</span>
              <span class="grouplabel__rule" />
            </div>
            <p class="capnote" style="margin:0 0 10px">
              {tv(variant, 'result.terms', {
                win: submission.win === 'selfDraw' ? t('win.selfDraw') : t('win.discard'),
                stake: formatStake(stake),
                limit,
              })}
            </p>
            {variant === 'hongkong' && submission.win === 'discard' && !flowerHand && (
              <p class="capnote" style="margin:0 0 10px">
                {halfPayment && !submission.pao
                  ? t('result.paymentHalf')
                  : t('result.paymentFull')}
              </p>
            )}
            {paoNote && (
              <p class="capnote" style="margin:0 0 10px">
                {t('result.paoNote', { wind: nameOf(submission.discarderIndex!) })}
              </p>
            )}
            {thirteenNote && (
              <p class="capnote" style="margin:0 0 10px">{t('result.thirteenNote')}</p>
            )}
            {flowerHand && (
              <p class="capnote" style="margin:0 0 10px">{t('result.flowerNote')}</p>
            )}
            {/* FOUR PLAYERS, SIGNED, SUMMING TO ZERO — including the winner.
                The old ledger showed the three people who pay you and left the
                winner implied by their absence, which is a settlement you
                cannot check. Every row is that player's own change for the
                hand, and the signs balance because settleHand MOVES units
                between players rather than writing them. */}
            <div class="ledgertabs" role="tablist" aria-label={t('result.payments')}>
              {(['this', 'total'] as const).map((k) => (
                <button type="button" key={k} role="tab" class="ledgertab"
                  aria-selected={tab === k ? 'true' : 'false'}
                  onClick={() => setTab(k)}>
                  {k === 'this' ? t('result.tabThis') : t('result.tabTotal')}
                </button>
              ))}
            </div>
            {/* `totals` already includes the hand on screen, so the boundary
                is whether there is anything BEFORE it. It used to be
                `> 1`, which made a table with one hand behind it claim to
                have no history — and the "no history" line then sat above
                four non-zero figures. On the first hand the two tabs show
                the same numbers, and that is what the caption now says. */}
            {tab === 'total' && (
              <p class="capnote" style="margin:10px 0 0">
                {ledger.length > 0 ? t('result.ledgerHint') : t('result.noHistory')}
              </p>
            )}
            <table class="ledger">
              <tbody>
                {table.players.map((_, i) => {
                  const units = (tab === 'this' ? deltas : totals)[i] ?? 0
                  const w = seatWindOf(table, i)
                  return (
                    <tr key={i}>
                      <td>
                        <span class="seatcell">
                          <Tile id={w} small />
                          <span>
                            <span class="seatcell__name">{nameOf(i)}</span><br />
                            <span class="seatcell__verb">
                              {i === table.youIndex ? t('result.you') : t(`wind.${w}`)}
                            </span>
                          </span>
                        </span>
                      </td>
                      <td class={`ledger__amt ${units === 0 ? 'zero' : units > 0 ? 'collect' : 'pay'}`}>
                        {units === 0 ? '\u2014' : formatMoney(units, stake, true)}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
            <div class="totalband">
              <span class="totalband__k">{t('result.balanced')}</span>
              <span class="totalband__v">
                {formatMoney((tab === 'this' ? deltas : totals)
                  .reduce((a, b) => a + b, 0), stake)}
              </span>
            </div>
          </div>
        )}

      </div>

      <div class="dock">
        <div class="dock__row dock__row--three">
          <button type="button" class="btn btn--ghost" onClick={onEdit}>
            {t('result.editHand')}
          </button>
          <button type="button" class="btn btn--ghost" onClick={() => onEndGame(deltas)}>
            {t('result.endGame')}
          </button>
          <button type="button" class="btn btn--primary btn--block"
            aria-pressed={confirmNext ? 'true' : 'false'}
            onClick={() => {
              if (!confirmNext) {
                setConfirmNext(true)
                window.setTimeout(() => setConfirmNext(false), 4000)
                return
              }
              onNext(deltas)
            }}>
            {confirmNext ? t('result.nextConfirm') : t('result.nextHand')}
          </button>
        </div>
      </div>
    </div>
  )
}

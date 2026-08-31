import { useState } from 'preact/hooks'
import { t, tv } from '../../i18n'
import { formatMoney, formatStake } from '../format'
import { Prediction } from '../components/Prediction'
import { Cuit } from '../components/Brand'
import { Tile } from '../components/Tile'

import type { HandState } from './HandEntry'
import type { WinSubmission } from '../../engine/session/table'
import { VARIANTS, type VariantId } from '../../engine/variants'
import {
  prevailingWind, scoreKeyedHand, seatWindOf, yourSeat, type TableState,
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
  predictOpen, onPredictToggle,
}: {
  variant: VariantId
  table: TableState
  stake: number
  limit: number
  halfPayment: boolean
  hand: HandState
  submission: WinSubmission
  onEdit: () => void
  onNext: () => void
  predictOpen: boolean
  onPredictToggle: () => void
}) {
  const plugin = VARIANTS[variant]
  const nameOf = (i: number) => table.players[i] || t('table.playerN', { n: i + 1 })
  const [confirmNext, setConfirmNext] = useState(false)

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
  const others = table.players.map((_, i) => i).filter((i) => i !== table.youIndex)

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

        <div class="resulthead">
          <div class="fanmedal">
            <div class="fan">{result.totalTai}</div>
            <div class="fan__unit">{t('result.fanUnit')}</div>
          </div>
          <Cuit mood="cheer" size={64} />
        </div>
        {/* English only. Run 7 took the Chinese names off every surface: they
            were a second name for the same hand, in a script most of the people
            at this table cannot read, sitting next to the number that is the
            reason anybody opened the screen. */}
        {shown.map((k) => (
          <p class="handname" key={k}>{tv(variant, `pattern.${k}`)}</p>
        ))}
        {result.limitApplied && (
          <p class="capnote" style="margin-top:8px">
            {t('result.fanCapped', { limit, raw: result.rawTai })}
          </p>
        )}

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
            <table class="ledger">
              <tbody>
                {others.map((i) => {
                  const isDiscarder = pay.fromDiscarder !== null
                    && submission.win === 'discard' && i === submission.discarderIndex
                  // Both numbers come straight off the engine's breakdown; the
                  // pao and payment-convention settlements are already in them.
                  const units = isDiscarder ? pay.fromDiscarder! : pay.fromEachOther
                  const w = seatWindOf(table, i)
                  // The sign is relative to the READER. This screen only ever
                  // renders a hand YOU won, so every figure on it is money
                  // arriving: plus, and green. Rendering each row as the other
                  // player's loss painted a winning night red. The verb is
                  // always spelled out, so direction is never colour alone.
                  return (
                    <tr key={i}>
                      <td>
                        <span class="seatcell">
                          <Tile id={w} small />
                          <span>
                            <span class="seatcell__name">{nameOf(i)}</span><br />
                            <span class="seatcell__verb">
                              {units === 0 ? t('result.nothing') : t('result.paysVerb')}
                            </span>
                          </span>
                        </span>
                      </td>
                      <td class={`ledger__amt ${units === 0 ? 'zero' : 'collect'}`}>
                        {units === 0 ? '—' : formatMoney(units, stake, true)}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
            <div class="totalband">
              <span class="totalband__k">{t('result.youCollect')}</span>
              <span class="totalband__v">{formatMoney(pay.winnerTotal, stake, true)}</span>
            </div>
          </div>
        )}


        <div class="card" style="margin-top:12px">
          <div class="grouplabel" style="margin-top:0">
            <span class="caps">{t('result.breakdown')}</span>
            <span class="grouplabel__rule" />
          </div>
          <table class="breakdown">
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


        <Prediction variant={variant} hand={hand} rules={opts}
          ctx={{ seat: yourSeat(table), prevailing: prevailingWind(table) }}
          open={predictOpen} onToggle={onPredictToggle} />
      </div>

      <div class="dock">
        <div class="dock__row">
          <button type="button" class="btn btn--ghost" onClick={onEdit}>
            {t('result.editHand')}
          </button>
          <button type="button" class="btn btn--primary btn--block"
            aria-pressed={confirmNext ? 'true' : 'false'}
            onClick={() => {
              if (!confirmNext) {
                setConfirmNext(true)
                window.setTimeout(() => setConfirmNext(false), 4000)
                return
              }
              onNext()
            }}>
            {confirmNext ? t('result.nextConfirm') : t('result.nextHand')}
          </button>
        </div>
      </div>
    </div>
  )
}

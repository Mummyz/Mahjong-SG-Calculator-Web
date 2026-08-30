import { useState } from 'preact/hooks'
import { t } from '../../i18n'
import { formatMoney, formatStake } from '../format'

import type { HandState } from './HandEntry'
import { singapore } from '../../engine/variants/singapore'
import {
  prevailingWind, scoreKeyedHand, seatWindOf, yourSeat, type TableState,
} from '../../engine/variants/singapore/table'
import type { Wind } from '../../engine/core/tiles'
import type { ScoreResult, WinContext } from '../../engine/core/variant'

const WIND_GLYPH: Record<Wind, string> = { E: '東', S: '南', W: '西', N: '北' }

/** Canonical Chinese names. Content, like the characters on a tile face. */
const CJK: Record<string, string> = {
  chickenHand: '雞胡', lesserSequence: '小平胡', sequenceHand: '平胡', triplets: '碰碰胡',
  halfFlush: '混一色', fullFlush: '清一色', fullFlushSequence: '清一色平胡',
  fullFlushTriplets: '清一色碰碰胡', fullFlushLesserSequence: '清一色小平胡',
  mixedTerminals: '混么九', pureTerminals: '清么九', allHonours: '字一色', pureGreen: '綠一色',
  nineGates: '九蓮寶燈', hiddenTreasure: '四暗刻', eighteenArhats: '十八羅漢',
  thirteenWonders: '十三幺', eightFlowers: '八仙過海', kongOnKong: '槓槓胡',
  heavenly: '天胡', earthly: '地胡', humanly: '人胡',
  smallThreeDragons: '小三元', bigThreeDragons: '大三元',
  smallFourWinds: '小四喜', bigFourWinds: '大四喜',
  fullyConcealed: '門清', robbingKong: '搶槓', lastTile: '海底撈月',
}

/** The keys that name a hand, as opposed to a bonus or a circumstance. */
const HAND_PATTERNS = new Set(Object.keys(CJK).filter(
  (k) => !['fullyConcealed', 'robbingKong', 'lastTile'].includes(k),
))

export function Results({ table, stake, limit, hand, onEdit, onNext }: {
  table: TableState
  stake: number
  limit: number
  hand: HandState
  onEdit: () => void
  onNext: () => void
}) {
  const nameOf = (i: number) => table.players[i] || t('table.playerN', { n: i + 1 })
  const [confirmNext, setConfirmNext] = useState(false)

  const incomplete = hand.win === null
    || (hand.win === 'discard' && hand.discarderIndex === null)
    || hand.winningTile === null

  const ctx: WinContext = {
    seat: yourSeat(table),
    prevailing: prevailingWind(table),
    win: hand.win ?? 'selfDraw',
    winningTile: hand.winningTile ?? undefined,
    flags: hand.flags,
    pao: hand.pao,
  }
  const opts = { limit }
  // Everything below is read off the engine. The UI computes no score — it
  // only hands over every reading of the keyed hand and keeps the best.
  const { result }: { result: ScoreResult } = scoreKeyedHand(
    { concealed: hand.concealed, melds: hand.melds, bonus: hand.bonus }, ctx, opts,
  )
  const pay = singapore.payments(result, ctx, opts)
  const instant = singapore.instantPayouts!(hand.bonus, yourSeat(table))
  const others = table.players.map((_, i) => i).filter((i) => i !== table.youIndex)

  if (incomplete) {
    return (
      <div class="shell">
        <div class="scroll">
          <h1 class="title">{t('result.title')}</h1>
          <div class="chit">
            <p class="handname" style="color:var(--mj-ang-ink)">{t('result.notAWin')}</p>
            <p style="margin:8px 0 0">{t('result.incomplete')}</p>
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

  if (!result.valid) {
    return (
      <div class="shell">
        <div class="scroll">
          <h1 class="title">{t('result.title')}</h1>
          <div class="chit">
            <p class="handname" style="color:var(--mj-ang-ink)">{t('result.notAWin')}</p>
            <p style="margin:8px 0 0">
              {t(`reject.${result.reason}`, { min: singapore.defaults.minTai })}
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

  const names = result.fan.map((f) => f.key).filter((k) => HAND_PATTERNS.has(k))
  const seen = new Set<string>()
  const uniqueNames = names.filter((n) => (seen.has(n) ? false : (seen.add(n), true)))

  // TT names the plain hand 雞胡: no scoring pattern, no value pong, carried
  // only by bonus tiles. The engine emits no component for it, so the UI names
  // it when nothing else did.
  const VALUE_SETS = ['dragonTriplet', 'seatWind', 'prevailingWind', 'seatPrevailingWind']
  const shown = uniqueNames.length === 0
      && !result.fan.some((f) => VALUE_SETS.includes(f.key))
    ? ['chickenHand']
    : uniqueNames

  return (
    <div class="shell">
      <div class="scroll">
        <h1 class="title">{t('result.title')}</h1>

        <div class="chit">
          <span class="chit__chop" aria-hidden="true">和</span>

          <div class="fan">{result.totalTai}</div>
          <div class="fan__unit">{t('result.fanUnit')}</div>
          {result.limitApplied && (
            <p class="capnote">
              {t('result.fanCapped', { limit, raw: result.rawTai })}
            </p>
          )}

          {shown.length > 0 && (
            <>
              <div class="grouplabel">
                <span class="caps">{t('result.hands')}</span>
                <span class="grouplabel__rule" />
              </div>
              {shown.map((k) => (
                <p class="handname" key={k}>
                  {t(`pattern.${k}`)}{' '}
                  <span class="handname__cjk" aria-hidden="true">{CJK[k]}</span>
                </p>
              ))}
            </>
          )}

        </div>

        {pay && (
          <div class="chit" style="margin-top:10px">
            <div class="grouplabel" style="margin-top:0">
              <span class="caps">{t('result.payments')}</span>
              <span class="grouplabel__rule" />
            </div>
            <p class="capnote" style="margin:0 0 10px">
              {t('result.terms', {
                win: hand.win === 'selfDraw' ? t('win.selfDraw') : t('win.discard'),
                stake: formatStake(stake),
                limit,
              })}
            </p>
            {hand.pao && hand.win === 'discard' && hand.discarderIndex !== null
              && !result.patterns.includes('thirteenWonders') && (
              <p class="capnote" style="margin:0 0 10px">
                {t('result.paoNote', { wind: nameOf(hand.discarderIndex) })}
              </p>
            )}
            {result.patterns.includes('thirteenWonders') && (
              <p class="capnote" style="margin:0 0 10px">{t('result.thirteenNote')}</p>
            )}
            <p class="collectline">
              <span class="collectline__k">{t('result.youCollect')}</span>
              <span class="collectline__v collect">
                {formatMoney(pay.winnerTotal, stake, true)}
              </span>
            </p>
            <table class="ledger">
              <tbody>
                {others.map((i) => {
                  const isDiscarder = hand.win === 'discard' && i === hand.discarderIndex
                  // Both numbers come straight off the engine's breakdown; the
                  // pao settlement is already baked into them.
                  const units = isDiscarder ? (pay.fromDiscarder ?? 0) : pay.fromEachOther
                  const w = seatWindOf(table, i)
                  return (
                    <tr key={i}>
                      <td>
                        <span class="seatcell">
                          <span class="seatchip" aria-hidden="true">{WIND_GLYPH[w]}</span>
                          <span>{t('result.pays', { name: nameOf(i) })}</span>
                        </span>
                      </td>
                      <td class={`ledger__amt ${units === 0 ? 'zero' : 'pay'}`}>
                        {units === 0 ? t('result.nothing') : formatMoney(-units, stake, true)}
                      </td>
                    </tr>
                  )
                })}
                <tr class="ledger__total">
                  <td>
                    <span class="seatcell">
                      <span class="seatchip" aria-hidden="true">{WIND_GLYPH[yourSeat(table)]}</span>
                      <span>{t('result.you')}</span>
                    </span>
                  </td>
                  <td class="ledger__amt collect">
                    {formatMoney(pay.winnerTotal, stake, true)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        )}


        <div class="chit" style="margin-top:10px">
          <div class="grouplabel" style="margin-top:0">
            <span class="caps">{t('result.breakdown')}</span>
            <span class="grouplabel__rule" />
          </div>
          <table class="breakdown">
            <tbody>
              {result.fan.map((f, i) => (
                <tr key={`${f.key}-${i}`}>
                  <td>
                    {t(`pattern.${f.key}`)}
                    {CJK[f.key] && (
                      <span class="handname__cjk" aria-hidden="true"> {CJK[f.key]}</span>
                    )}
                  </td>
                  <td>+{f.tai}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div class="grouplabel">
            <span class="caps">{t('result.basePoints')}</span>
            <span class="grouplabel__rule" />
            <span class="grouplabel__n">{result.base}</span>
          </div>

        </div>

        {instant.length > 0 && (
          <div class="chit" style="margin-top:10px">
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

        <div class="placeholder">
          <p class="caps" style="margin:0 0 4px">{t('predict.title')}</p>
          <p style="margin:0">{t('predict.comingSoon')}</p>
        </div>
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

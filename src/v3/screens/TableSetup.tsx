import { useState } from 'preact/hooks'
import { t, tv } from '../../i18n'
import { formatStake } from '../format'
import { WINDS } from '../../engine/core/tiles'
import { seatWindOf, type TableState } from '../../engine/session/table'
import type { VariantId } from '../../engine/variants'

export const LIMIT_MIN = 1
export const LIMIT_MAX = 13
/**
 * The owner's presets. They are the same numbers in both games because the
 * UNIT differs, not the ladder: Singapore's is per fan and Hong Kong's is per
 * point, which `tv()` says on the label above them.
 */
const STAKES = [1, 100, 1000, 10000]
const WIND_GLYPH: Record<string, string> = { E: '東', S: '南', W: '西', N: '北' }

export interface Money {
  stake: number
  limit: number
  /** RULING HK4 — 陪銃制. Hong Kong only; the Singapore engine never reads it. */
  halfPayment: boolean
}

/**
 * Set up once. Names are the point: every seat is referred to by name from
 * here on, so the ledger reads like the table talks.
 */
export function TableSetup({ variant, table, money, onTable, onMoney, onDone, firstRun }: {
  variant: VariantId
  table: TableState
  money: Money
  onTable: (patch: Partial<TableState>) => void
  onMoney: (patch: Partial<Money>) => void
  onDone: () => void
  firstRun: boolean
}) {
  const isHK = variant === 'hongkong'
  const [limitText, setLimitText] = useState(String(money.limit))
  const [stakeText, setStakeText] = useState(
    STAKES.includes(money.stake) ? '' : String(money.stake),
  )

  const commitLimit = () => {
    const n = Number(limitText)
    const next = Number.isFinite(n) && limitText.trim() !== ''
      ? Math.min(LIMIT_MAX, Math.max(LIMIT_MIN, Math.floor(n)))
      : money.limit
    setLimitText(String(next))
    onMoney({ limit: next })
  }
  const commitStake = () => {
    if (stakeText.trim() === '') return
    const n = Number(stakeText.replace(/[^0-9.,-]/g, '').replace(/,(?=\d{3}\b)/g, ''))
    const q = Math.round(n * 100) / 100
    if (Number.isFinite(q) && q > 0) { onMoney({ stake: q }); setStakeText(String(q)); return }
    setStakeText(STAKES.includes(money.stake) ? '' : String(money.stake))
  }

  const setName = (i: number, name: string) => {
    const players = [...table.players]
    players[i] = name
    onTable({ players })
  }

  return (
    <div class="shell">
      <div class="scroll">
        <h1 class="title">{firstRun ? t('table.title') : t('table.settingsTitle')}</h1>
        <p class="sub">{t('table.subtitle')}</p>

        <div class="field">
          <span class="field__label">{t('table.players')}</span>
          {table.players.map((name, i) => (
            <div class="namerow" key={i}>
              <span class="namerow__wind" aria-hidden="true">
                {WIND_GLYPH[seatWindOf(table, i)]}
              </span>
              <input class="input" type="text" value={name}
                aria-label={t('table.playerLabel', { n: i + 1 })}
                placeholder={t('table.playerN', { n: i + 1 })}
                onInput={(e) => setName(i, (e.target as HTMLInputElement).value)} />
              {i === table.youIndex && <span class="namerow__you">{t('table.youTag')}</span>}
            </div>
          ))}
        </div>

        <div class="field">
          <span class="field__label">{t('table.you')}</span>
          <div class="chiprow" role="radiogroup" aria-label={t('table.you')}>
            {table.players.map((name, i) => (
              <button type="button" key={i} class="chip" role="radio"
                aria-checked={table.youIndex === i ? 'true' : 'false'}
                onClick={() => onTable({ youIndex: i })}>
                {name || t('table.playerN', { n: i + 1 })}
              </button>
            ))}
          </div>
        </div>

        {firstRun ? (
        <>
        <div class="field">
          <span class="field__label">{t('table.firstDealer')}</span>
          <div class="chiprow" role="radiogroup" aria-label={t('table.firstDealer')}>
            {table.players.map((name, i) => (
              <button type="button" key={i} class="chip" role="radio"
                aria-checked={table.dealerIndex === i ? 'true' : 'false'}
                onClick={() => onTable({ dealerIndex: i })}>
                {name || t('table.playerN', { n: i + 1 })}
              </button>
            ))}
          </div>
          <span class="field__hint">{t('table.firstDealerHint')}</span>
        </div>

        <div class="field">
          <span class="field__label">{t('table.prevailing')}</span>
          <div class="windrow" role="radiogroup" aria-label={t('table.prevailing')}>
            {WINDS.map((w, i) => (
              <button type="button" key={w} class="windchip" role="radio"
                aria-checked={table.prevailingIndex === i ? 'true' : 'false'}
                onClick={() => onTable({ prevailingIndex: i })}>
                <span class="windchip__cjk" aria-hidden="true">{WIND_GLYPH[w]}</span>
                <span class="windchip__cap">{t(`wind.${w}`)}</span>
              </button>
            ))}
          </div>
          <span class="field__hint">{t('table.prevailingHint')}</span>
        </div>
        </>
        ) : (
          <p class="chipnote">
            {t('table.dealerLocked', {
              name: table.players[table.dealerIndex] || t('table.playerN', {
                n: table.dealerIndex + 1,
              }),
            })}
          </p>
        )}

        {isHK && (
          <div class="field">
            <span class="field__label">{t('table.payment')}</span>
            <div class="chiprow" role="radiogroup" aria-label={t('table.payment')}>
              <button type="button" class="chip" role="radio"
                aria-checked={money.halfPayment ? 'false' : 'true'}
                onClick={() => onMoney({ halfPayment: false })}>
                {t('table.payment.full')}
              </button>
              <button type="button" class="chip" role="radio"
                aria-checked={money.halfPayment ? 'true' : 'false'}
                onClick={() => onMoney({ halfPayment: true })}>
                {t('table.payment.half')}
              </button>
            </div>
            <span class="field__hint">{t('table.paymentHint')}</span>
          </div>
        )}

        <div class="field">
          <span class="field__label">{tv(variant, 'table.stake')}</span>
          <div class="chiprow" role="radiogroup" aria-label={t('table.stake')}>
            {STAKES.map((s) => (
              <button type="button" key={s} class="chip" role="radio"
                aria-checked={money.stake === s ? 'true' : 'false'}
                onClick={() => { setStakeText(''); onMoney({ stake: s }) }}>
                {formatStake(s)}
              </button>
            ))}
          </div>
          <label class="field__label" for="stake-custom" style="margin:10px 0 6px">
            {t('table.stakeCustom')}
          </label>
          <input id="stake-custom" class="input" type="text" inputMode="decimal"
            value={stakeText} placeholder={formatStake(money.stake)}
            onInput={(e) => setStakeText((e.target as HTMLInputElement).value)}
            onBlur={commitStake} />
          <span class="field__hint">{tv(variant, 'table.stakeHint')}</span>
        </div>

        <div class="field">
          <label class="field__label" for="limit">{t('table.limit')}</label>
          <input id="limit" class="input" type="text" inputMode="numeric" value={limitText}
            onInput={(e) => setLimitText((e.target as HTMLInputElement).value)}
            onBlur={commitLimit} />
          <span class="field__hint">
            {tv(variant, 'table.limitHint', { min: LIMIT_MIN, max: LIMIT_MAX })}
          </span>
        </div>
      </div>

      <div class="dock">
        <button type="button" class="btn btn--primary btn--block"
          onClick={() => { commitLimit(); commitStake(); onDone() }}>
          {firstRun ? t('table.start') : t('table.save')}
        </button>
      </div>
    </div>
  )
}

import { useState } from 'preact/hooks'
import { t } from '../../i18n'
import { WINDS, type Wind } from '../../engine/core/tiles'
import { formatStake } from '../format'

const WIND_GLYPH: Record<Wind, string> = { E: '東', S: '南', W: '西', N: '北' }
const STAKES = [0.1, 0.2, 0.5, 1]

export interface GameSettings {
  seat: Wind
  prevailing: Wind
  stake: number
  limit: number
}

/** A hand cannot be worth less than 1 fan, and no table plays past 13. */
export const LIMIT_MIN = 1
export const LIMIT_MAX = 13

function WindRow({ value, onChange, label, hint }: {
  value: Wind
  onChange: (w: Wind) => void
  label: string
  hint: string
}) {
  return (
    <div class="field">
      <span class="field__label">{label}</span>
      <div class="windrow" role="radiogroup" aria-label={label}>
        {WINDS.map((w) => (
          <button type="button" key={w} class="windchip" role="radio"
            aria-checked={value === w ? 'true' : 'false'}
            onClick={() => onChange(w)}>
            <span class="windchip__cjk" aria-hidden="true">{WIND_GLYPH[w]}</span>
            <span class="windchip__cap">{t(`wind.${w}`)}</span>
          </button>
        ))}
      </div>
      <span class="field__hint">{hint}</span>
    </div>
  )
}

export function Setup({ value, onChange, onBack, onContinue, singleLabel }: {
  value: GameSettings
  onChange: (patch: Partial<GameSettings>) => void
  onBack: () => void
  onContinue: () => void
  /** When set, the dock is a single primary action with this label. */
  singleLabel?: string | undefined
}) {
  const [limitText, setLimitText] = useState(String(value.limit))
  const [stakeText, setStakeText] = useState(
    STAKES.includes(value.stake) ? '' : String(value.stake),
  )

  const commitLimit = () => {
    const n = Number(limitText)
    const next = Number.isFinite(n) && limitText.trim() !== ''
      ? Math.min(LIMIT_MAX, Math.max(LIMIT_MIN, Math.floor(n)))
      : value.limit
    setLimitText(String(next))
    onChange({ limit: next })
  }
  const commitStake = () => {
    // Accept the number back in the shape the app printed it, group separators
    // and all.
    const n = Number(stakeText.replace(/[^0-9.,-]/g, '').replace(/,(?=\d{3}\b)/g, ''))
    if (stakeText.trim() === '') return
    // Quantise to the two decimals the ledger can print. Otherwise the rows
    // round independently and stop summing to the total.
    const q = Math.round(n * 100) / 100
    if (Number.isFinite(q) && q > 0) { onChange({ stake: q }); setStakeText(String(q)); return }
    setStakeText(STAKES.includes(value.stake) ? '' : String(value.stake))
  }
  return (
    <div class="shell">
      <div class="scroll">
        <h1 class="title">{t('setup.title')}</h1>
        <p class="sub">{t('setup.subtitle')}</p>

        <WindRow label={t('setup.seat')} hint={t('setup.seatHint')}
          value={value.seat} onChange={(seat) => onChange({ seat })} />

        <WindRow label={t('setup.prevailing')} hint={t('setup.prevailingHint')}
          value={value.prevailing} onChange={(prevailing) => onChange({ prevailing })} />

        <div class="field">
          <span class="field__label">{t('setup.stake')}</span>
          <div class="chiprow" role="radiogroup" aria-label={t('setup.stake')}>
            {STAKES.map((s) => (
              <button type="button" key={s} class="chip" role="radio"
                aria-checked={value.stake === s ? 'true' : 'false'}
                onClick={() => { setStakeText(''); onChange({ stake: s }) }}>{formatStake(s)}</button>
            ))}
          </div>
          <label class="field__label" for="stake-custom" style="margin:10px 0 6px">
            {t('setup.stakeCustom')}
          </label>
          <input id="stake-custom" class="input" type="text" inputMode="decimal"
            value={stakeText}
            placeholder={formatStake(value.stake)}
            onInput={(e) => setStakeText((e.target as HTMLInputElement).value)}
            onBlur={commitStake} />
          <span class="field__hint">{t('setup.stakeHint')}</span>
        </div>

        <div class="field">
          <label class="field__label" for="limit">{t('setup.limit')}</label>
          <input id="limit" class="input" type="text" inputMode="numeric"
            value={limitText}
            onInput={(e) => setLimitText((e.target as HTMLInputElement).value)}
            onBlur={commitLimit} />
          <span class="field__hint">{t('setup.limitHint', { min: LIMIT_MIN, max: LIMIT_MAX })}</span>
        </div>

      </div>

      <div class="dock">
        {singleLabel ? (
          <button type="button" class="btn btn--primary btn--block"
            onClick={() => { commitLimit(); commitStake(); onContinue() }}>
            {singleLabel}
          </button>
        ) : (
          <div class="dock__row">
            <button type="button" class="btn btn--ghost" onClick={onBack}>{t('nav.back')}</button>
            <button type="button" class="btn btn--primary btn--block"
              onClick={() => { commitLimit(); commitStake(); onContinue() }}>
              {t('nav.continue')}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

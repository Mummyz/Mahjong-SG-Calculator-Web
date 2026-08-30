import { t } from '../../i18n'
import { formatStake } from '../format'
import type { Wind } from '../../engine/core/tiles'

const WIND_GLYPH: Record<Wind, string> = { E: '東', S: '南', W: '西', N: '北' }

export function Signboard({
  seat, prevailing, stake, limit, onSeat, onInfo,
}: {
  seat: Wind
  prevailing: Wind
  stake: number
  limit: number
  onSeat: () => void
  onInfo: () => void
}) {
  return (
    <div class="signboard">
      <button type="button" class="signboard__seg" onClick={onSeat}
        aria-label={t('signboard.segment', {
          label: t('signboard.round'), value: t(`wind.${prevailing}`),
        })}>
        <span class="signboard__k">{t('signboard.round')}</span>
        <span class="signboard__v" aria-hidden="true">
          {t('signboard.wind', { glyph: WIND_GLYPH[prevailing], short: t(`wind.${prevailing}.short`) })}
        </span>
      </button>
      <button type="button" class="signboard__seg" onClick={onSeat}
        aria-label={t('signboard.segment', {
          label: t('signboard.seat'), value: t(`wind.${seat}`),
        })}>
        <span class="signboard__k">{t('signboard.seat')}</span>
        <span class="signboard__v" aria-hidden="true">
          {t('signboard.wind', { glyph: WIND_GLYPH[seat], short: t(`wind.${seat}.short`) })}
        </span>
      </button>
      <button type="button" class="signboard__seg" onClick={onSeat}>
        <span class="signboard__k">{t('signboard.stake')}</span>
        <span class="signboard__v">{formatStake(stake)}</span>
      </button>
      <button type="button" class="signboard__seg" onClick={onSeat}>
        <span class="signboard__k">{t('signboard.limit')}</span>
        <span class="signboard__v">{limit}</span>
      </button>
      <button type="button" class="signboard__info" onClick={onInfo}
              aria-label={t('tileinfo.title')}>i</button>
    </div>
  )
}

/**
 * Money formatting only.
 *
 * The engine returns every amount as a multiple of the agreed one-fan stake.
 * Turning that into currency is presentation, not scoring: the UI multiplies
 * by the stake and formats. It never computes fan, base points, or who owes
 * what — all of that arrives from the engine already decided.
 */

import { getLocale } from '../i18n'

const FORMATS: Record<string, Intl.NumberFormat> = {}
const money = () => {
  const locale = getLocale()
  FORMATS[locale] ??= new Intl.NumberFormat(locale, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
  return FORMATS[locale]!
}

/** Units × stake, always two decimals, U+2212 for a real minus sign. */
export function formatMoney(units: number, stake: number, signed = false): string {
  const value = units * stake
  const body = money().format(Math.abs(value))
  if (!signed) return body
  if (value === 0) return body
  return `${value < 0 ? '−' : '+'}${body}`
}

export const formatStake = (stake: number): string => money().format(stake)

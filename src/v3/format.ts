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

/**
 * Grouped, and decimals only when there are decimals.
 *
 * The stake presets run to 10,000, and a limit hand off a 10,000 stake is
 * 1,280,000 — which has to read as money at a glance on a 360px screen. Two
 * forced decimals turned that into 1,280,000.00 and pushed the ledger's
 * numbers into each other. Fractional stakes still show their cents.
 */
const money = (fractional: boolean) => {
  const key = `${getLocale()}:${fractional ? 2 : 0}`
  FORMATS[key] ??= new Intl.NumberFormat(getLocale(), {
    useGrouping: true,
    minimumFractionDigits: fractional ? 2 : 0,
    maximumFractionDigits: 2,
  })
  return FORMATS[key]!
}

const fmt = (n: number): string => money(!Number.isInteger(n)).format(Math.abs(n))

/** Units × stake, grouped, U+2212 for a real minus sign. */
export function formatMoney(units: number, stake: number, signed = false): string {
  const value = units * stake
  const body = fmt(value)
  if (!signed || value === 0) return body
  return `${value < 0 ? '−' : '+'}${body}`
}

export const formatStake = (stake: number): string => fmt(stake)

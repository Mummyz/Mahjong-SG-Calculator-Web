/**
 * Money reads the way the reader's language writes money.
 *
 * Indonesian groups thousands with a FULL STOP and marks decimals with a
 * comma — 1.280.000, not 1,280,000. Getting that backwards on a settlement
 * screen is not a typographic nicety: "1.280" is one thousand two hundred and
 * eighty to an Indonesian reader and one point two eight to an English one,
 * and this app exists to stop arguments about money.
 */

import { afterAll, describe, expect, it } from 'vitest'
import { setLocale, getLocale } from '../i18n'
import { formatMoney, formatStake } from './format'

const was = getLocale()
afterAll(() => setLocale(was))

describe('English', () => {
  it('groups with commas', () => {
    setLocale('en')
    expect(formatStake(10000)).toBe('10,000')
    expect(formatMoney(128, 10000)).toBe('1,280,000')
  })
})

describe('Indonesian', () => {
  it('groups with full stops', () => {
    setLocale('id')
    expect(formatStake(10000)).toBe('10.000')
    expect(formatMoney(128, 10000)).toBe('1.280.000')
  })

  it('marks the decimal with a comma', () => {
    setLocale('id')
    expect(formatStake(0.5)).toBe('0,50')
  })

  it('keeps the sign a real minus, in both languages', () => {
    for (const l of ['en', 'id'] as const) {
      setLocale(l)
      expect(formatMoney(-3, 100, true).startsWith('−')).toBe(true)
      expect(formatMoney(3, 100, true).startsWith('+')).toBe(true)
    }
  })

  it('re-reads the locale after a switch rather than caching one format', () => {
    // The formatter is memoised per locale; the bug this guards is memoising
    // ONE formatter and handing English separators to an Indonesian reader
    // who switched mid-hand.
    setLocale('en')
    const en = formatStake(1000)
    setLocale('id')
    const id = formatStake(1000)
    expect(en).not.toBe(id)
    expect([en, id]).toEqual(['1,000', '1.000'])
  })
})

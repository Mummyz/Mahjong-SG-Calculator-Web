/**
 * The golden corpus gate.
 *
 * Every entry in src/engine/corpus/singapore/ is run against the Singapore
 * plugin. These files are the authority: they were written from the published
 * sources, before the engine existed. When one fails, the engine is wrong
 * until a cited source says otherwise (see docs/sources/RULING-LOG.md).
 */

import { readFileSync, readdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

import { singapore } from '../variants/singapore'
import type { RuleOptions, WinContext } from '../core/variant'
import type { BonusId } from '../core/tiles'
import type { HandInput } from '../core/hand'

interface Entry {
  id: string
  title: string
  cite: string
  note?: string
  hand: HandInput
  ctx: WinContext & { pao?: boolean }
  opts?: Partial<RuleOptions> & { reason?: string }
  expect: {
    valid: boolean
    reason?: string
    patterns?: string[]
    fan?: [string, number][]
    rawTai?: number
    totalTai?: number
    limitApplied?: boolean
    base?: number
    pay?: { fromDiscarder: number | null; fromEachOther: number; winnerTotal: number }
  }
}

const dir = fileURLToPath(new URL('./singapore/', import.meta.url))
const all = readdirSync(dir).filter((f) => f.endsWith('.json')).sort()
const INSTANT = '12-instant-payouts.json'
const files = all.filter((f) => f !== INSTANT)

const sortedFan = (f: readonly { key: string; tai: number }[] | [string, number][]) =>
  f
    .map((x) => (Array.isArray(x) ? `${x[0]}:${x[1]}` : `${x.key}:${x.tai}`))
    .sort()

let total = 0

for (const file of files) {
  const doc = JSON.parse(readFileSync(dir + file, 'utf8')) as {
    description: string
    entries: Entry[]
  }
  total += doc.entries.length

  describe(`${file} — ${doc.description}`, () => {
    for (const e of doc.entries) {
      it(`${e.id}: ${e.title}`, () => {
        const opts = e.opts
        const result = singapore.score(e.hand, e.ctx, opts)

        if (!e.expect.valid) {
          expect(result.valid, `expected REJECT (${e.expect.reason}) — ${e.cite}`).toBe(false)
          if (!result.valid) expect(result.reason).toBe(e.expect.reason)
          return
        }

        expect(
          result.valid,
          `expected a valid win but got ${result.valid ? '' : (result as { reason: string }).reason} — ${e.cite}`,
        ).toBe(true)
        if (!result.valid) return

        expect(sortedFan(result.fan), `fan breakdown — ${e.cite}`).toEqual(sortedFan(e.expect.fan!))
        expect([...result.patterns].sort()).toEqual([...e.expect.patterns!].sort())
        expect(result.rawTai, `raw tai — ${e.cite}`).toBe(e.expect.rawTai)
        expect(result.totalTai, `total tai — ${e.cite}`).toBe(e.expect.totalTai)
        expect(result.limitApplied).toBe(e.expect.limitApplied)
        expect(result.base, `base points — ${e.cite}`).toBe(e.expect.base)

        const pay = singapore.payments(result, e.ctx, opts)
        expect(pay, `payments — ${e.cite}`).toEqual(e.expect.pay)

        // Money is conserved: what the winner gains is exactly what the
        // losers hand over, however the win was reached.
        const paid = e.ctx.pao && e.ctx.win === 'discard'
          ? pay!.fromDiscarder!
          : e.ctx.win === 'selfDraw'
            ? pay!.fromEachOther * 3
            : pay!.fromDiscarder! + pay!.fromEachOther * 2
        expect(paid, `payments must sum to the winner's gain — ${e.id}`).toBe(pay!.winnerTotal)
      })
    }
  })
}

interface InstantEntry {
  id: string
  title: string
  cite: string
  seat: 'E' | 'S' | 'W' | 'N'
  bonus: BonusId[]
  expect: { payouts: { key: string; fromEachPlayer: number; total: number }[] }
}

{
  const doc = JSON.parse(readFileSync(dir + INSTANT, 'utf8')) as {
    description: string
    entries: InstantEntry[]
  }
  total += doc.entries.length
  describe(`${INSTANT} — ${doc.description}`, () => {
    for (const e of doc.entries) {
      it(`${e.id}: ${e.title}`, () => {
        const got = singapore.instantPayouts!(e.bonus, e.seat)
        expect([...got].sort((a, b) => a.key.localeCompare(b.key)))
          .toEqual([...e.expect.payouts].sort((a, b) => a.key.localeCompare(b.key)))
      })
    }
  })
}

describe('corpus coverage', () => {
  it('carries at least 150 entries', () => {
    expect(total).toBeGreaterThanOrEqual(150)
  })
  it('gives every entry a source citation', () => {
    for (const file of all) {
      const doc = JSON.parse(readFileSync(dir + file, 'utf8')) as { entries: Entry[] }
      for (const e of doc.entries) {
        expect(e.cite, `${e.id} has no citation`).toBeTruthy()
      }
    }
  })
})

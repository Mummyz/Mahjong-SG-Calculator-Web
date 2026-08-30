/**
 * The Hong Kong golden corpus gate.
 *
 * Every entry in src/engine/corpus/hongkong/ is run against the Hong Kong
 * plugin. These files are the authority: they were written from the archived
 * sources in docs/sources/, before the engine existed. When one fails, the
 * engine is wrong until a cited source says otherwise — see
 * docs/sources/RULING-LOG-HK.md.
 */

import { readFileSync, readdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

import { hongkong, basePoints } from '../variants/hongkong'
import type { RuleOptions, WinContext } from '../core/variant'
import type { HandInput } from '../core/hand'

interface Entry {
  id: string
  title: string
  cite: string
  note?: string
  hand: HandInput
  ctx: WinContext & { pao?: boolean }
  opts?: Partial<RuleOptions>
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

const dir = fileURLToPath(new URL('./hongkong/', import.meta.url))
const files = readdirSync(dir).filter((f) => f.endsWith('.json')).sort()

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
        const result = hongkong.score(e.hand, e.ctx, e.opts)

        if (!e.expect.valid) {
          expect(result.valid, `expected REJECT (${e.expect.reason}) — ${e.cite}`).toBe(false)
          if (!result.valid) {
            expect(result.reason).toBe(e.expect.reason)
            if (e.expect.rawTai !== undefined) expect(result.rawTai).toBe(e.expect.rawTai)
          }
          return
        }

        expect(
          result.valid,
          `expected a valid win but got ${result.valid ? '' : (result as { reason: string }).reason} — ${e.cite}`,
        ).toBe(true)
        if (!result.valid) return

        expect(sortedFan(result.fan), `fan breakdown — ${e.cite}`).toEqual(sortedFan(e.expect.fan!))
        expect([...result.patterns].sort()).toEqual([...e.expect.patterns!].sort())
        expect(result.rawTai, `raw faan — ${e.cite}`).toBe(e.expect.rawTai)
        expect(result.totalTai, `total faan — ${e.cite}`).toBe(e.expect.totalTai)
        expect(result.limitApplied).toBe(e.expect.limitApplied)
        expect(result.base, `base points — ${e.cite}`).toBe(e.expect.base)

        const pay = hongkong.payments(result, e.ctx, e.opts)
        expect(pay, `payments — ${e.cite}`).toEqual(e.expect.pay)

        // Money is conserved: what the winner gains is exactly what the
        // losers hand over, however the win was reached.
        const paid = pay!.fromDiscarder === null
          ? pay!.fromEachOther * 3
          : pay!.fromDiscarder + pay!.fromEachOther * 2
        expect(paid, `payments must sum to the winner's gain — ${e.id}`).toBe(pay!.winnerTotal)
      })
    }
  })
}

describe('corpus coverage', () => {
  it('carries at least 150 entries', () => {
    expect(total).toBeGreaterThanOrEqual(150)
  })

  it('gives every entry a source citation', () => {
    for (const file of files) {
      const doc = JSON.parse(readFileSync(dir + file, 'utf8')) as { entries: Entry[] }
      for (const e of doc.entries) {
        expect(e.cite, `${e.id} has no citation`).toBeTruthy()
      }
    }
  })

  it('never repeats an entry id', () => {
    const seen = new Set<string>()
    for (const file of files) {
      const doc = JSON.parse(readFileSync(dir + file, 'utf8')) as { entries: Entry[] }
      for (const e of doc.entries) {
        expect(seen.has(e.id), `${e.id} appears twice`).toBe(false)
        seen.add(e.id)
      }
    }
  })

  // RULING HK17 — Family A's published table, typed out. If basePoints() and
  // this column ever part company, the curve is wrong and so is every payment.
  it('reproduces Family A的 published 出銃 column exactly', () => {
    const published = [1, 2, 4, 8, 16, 24, 32, 48, 64, 96, 128, 192, 256, 384]
    expect(published.map((_, n) => basePoints(n))).toEqual(published)
  })
})

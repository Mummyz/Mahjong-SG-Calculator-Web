/**
 * THE KONG-RESOLUTION GATE.
 *
 * Run 6C removed the chip that asked the player whether four held copies were
 * a kong. The tiles answer it instead: a winning hand is fourteen tiles plus
 * one for every kong, so the SIZE of the hand says how many of its quads are
 * kongs. This file is the corpus for that rule — written from the counting
 * rule in kong-resolution.corpus.json, which cites both variants' sources.
 *
 * It also holds the key-order guarantee. A player keys tiles in whatever
 * order they pick them up, and the resolver reads a multiset: taps must never
 * change a score.
 */

import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

import { VARIANTS, type VariantId } from '../variants'
import {
  concealedTargets, handIsReadable, readingKongs, resolveTarget, scoreKeyedHand,
  type KeyedHand,
} from '../session/table'
import type { MeldInput } from '../core/hand'
import type { TileId } from '../core/tiles'
import type { WinContext } from '../core/variant'

interface Entry {
  id: string
  title: string
  why: string
  variants: VariantId[]
  concealed: string
  melds?: MeldInput[]
  expect: {
    length: number
    min: number
    max: number
    target: number
    readable: boolean
    readingKongs?: TileId[]
    readingKongsCount?: number
  }
}

interface OrderCase {
  id: string
  title: string
  variants: VariantId[]
  ctx: WinContext
  orders: Record<string, string>
}

const doc = JSON.parse(readFileSync(
  fileURLToPath(new URL('./kong-resolution.corpus.json', import.meta.url)), 'utf8')) as {
    description: string
    cite: Record<string, string>
    entries: Entry[]
    keyOrder: { description: string; cases: OrderCase[] }
  }

const tiles = (s: string) => s.trim().split(/\s+/) as TileId[]
const handOf = (e: { concealed: string; melds?: MeldInput[] }): KeyedHand => ({
  concealed: tiles(e.concealed),
  melds: e.melds ?? [],
  bonus: [],
})

describe(`kong resolution — ${doc.description}`, () => {
  it('every entry cites a source', () => {
    for (const v of ['singapore', 'hongkong']) {
      expect(doc.cite[v], `no citation for ${v}`).toBeTruthy()
    }
    for (const e of doc.entries) {
      expect(e.why, `${e.id} has no reasoning`).toBeTruthy()
      expect(e.variants.length, `${e.id} names no variant`).toBeGreaterThan(0)
    }
  })

  for (const e of doc.entries) {
    describe(`${e.id} — ${e.title}`, () => {
      for (const v of e.variants) {
        const plugin = VARIANTS[v]
        const hand = handOf(e)

        it(`${v}: is ${e.expect.length} tiles, aiming at ${e.expect.target}`, () => {
          expect(hand.concealed).toHaveLength(e.expect.length)
          expect(concealedTargets(hand)).toEqual({ min: e.expect.min, max: e.expect.max })
          expect(resolveTarget(plugin, hand), e.why).toBe(e.expect.target)
        })

        it(`${v}: reads as a hand: ${e.expect.readable}`, () => {
          expect(handIsReadable(plugin, hand), e.why).toBe(e.expect.readable)
        })

        if (e.expect.readingKongs !== undefined) {
          it(`${v}: treats ${e.expect.readingKongs.length} quad(s) as concealed kongs`, () => {
            expect([...readingKongs(plugin, hand)].sort(), e.why)
              .toEqual([...e.expect.readingKongs!].sort())
          })
        }
        if (e.expect.readingKongsCount !== undefined) {
          it(`${v}: treats exactly ${e.expect.readingKongsCount} quad(s) as kongs`, () => {
            expect(readingKongs(plugin, hand), e.why)
              .toHaveLength(e.expect.readingKongsCount!)
          })
        }

        it(`${v}: the target never exceeds what the wall may hold`, () => {
          // The resolver may ask for one more tile, never for one the wall
          // would refuse. This is the invariant the old decline path broke.
          expect(resolveTarget(plugin, hand)).toBeLessThanOrEqual(e.expect.max)
          expect(resolveTarget(plugin, hand)).toBeGreaterThanOrEqual(
            Math.min(e.expect.length, e.expect.min))
        })
      }
    })
  }
})

describe(`key order — ${doc.keyOrder.description}`, () => {
  for (const c of doc.keyOrder.cases) {
    describe(`${c.id} — ${c.title}`, () => {
      const names = Object.keys(c.orders)

      it('every order is the same multiset of tiles', () => {
        const sorted = names.map((n) => [...tiles(c.orders[n]!)].sort().join(' '))
        for (const s of sorted) expect(s).toBe(sorted[0])
      })

      for (const v of c.variants) {
        const plugin = VARIANTS[v]

        it(`${v}: resolves to the same target in every order`, () => {
          const targets = names.map((n) =>
            resolveTarget(plugin, handOf({ concealed: c.orders[n]! })))
          for (const t of targets) expect(t, `orders: ${names.join(', ')}`).toBe(targets[0])
        })

        it(`${v}: reads the same quads as kongs in every order`, () => {
          const ks = names.map((n) =>
            [...readingKongs(plugin, handOf({ concealed: c.orders[n]! }))].sort().join(','))
          for (const k of ks) expect(k).toBe(ks[0])
        })

        it(`${v}: SCORES IDENTICALLY in every order`, () => {
          /**
           * The SCORE, not the echo. `result.hand` replays the tiles in the
           * order they were handed in — that is the input, not an outcome,
           * and comparing it would fail on a difference the player cannot
           * see. Everything a hand is worth is below.
           */
          const scores = names.map((n) => {
            const { result } = scoreKeyedHand(plugin, handOf({ concealed: c.orders[n]! }), c.ctx)
            const r = result as unknown as Record<string, unknown>
            return JSON.stringify({
              valid: r.valid,
              reason: r.reason ?? null,
              patterns: [...((r.patterns as string[]) ?? [])].sort(),
              fan: [...((r.fan as { key: string; tai: number }[]) ?? [])]
                .map((f) => `${f.key}:${f.tai}`).sort(),
              rawTai: r.rawTai ?? null,
              totalTai: r.totalTai ?? null,
              faan: r.faan ?? null,
              points: r.points ?? null,
              limitApplied: r.limitApplied ?? null,
              base: r.base ?? null,
              kongCount: (r.hand as { kongCount?: number } | undefined)?.kongCount ?? null,
            })
          })
          for (let i = 0; i < scores.length; i++) {
            expect(scores[i], `${names[i]} scored differently from ${names[0]}`)
              .toBe(scores[0])
          }
        })
      }
    })
  }
})

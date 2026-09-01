/**
 * THE LOST-HAND GATE.
 *
 * Run 6C made "someone else won this one" a real settlement. Before it, the
 * deal moved on and no money did — so the running total was a record of the
 * hands this player happened to win, not of the night, and losing off your own
 * discard cost nothing at all.
 *
 * Every figure in lost-hand.corpus.json comes from the variant's published
 * payment table applied to the fan the player entered, written before the
 * settlement code existed. The engine is wrong until a cited source says
 * otherwise (docs/sources/RULING-LOG.md, RULING-LOG-HK.md).
 */

import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

import { VARIANTS, type VariantId } from '../variants'
import { fanBounds, settleLostHand } from '../session/table'
import type { RuleOptions } from '../core/variant'

interface Entry {
  id: string
  variant: VariantId
  title: string
  why: string
  fan: number
  win: 'discard' | 'selfDraw'
  winner: number
  you: number
  discarder: number | null
  opts: Partial<RuleOptions>
  expect: {
    pay: { fromDiscarder: number | null; fromEachOther: number; winnerTotal: number }
    deltas: number[]
    youPay: number
  }
}

const doc = JSON.parse(readFileSync(
  fileURLToPath(new URL('./lost-hand.corpus.json', import.meta.url)), 'utf8')) as {
    description: string
    cite: Record<string, string>
    entries: Entry[]
    bounds: {
      description: string
      cases: { variant: VariantId; opts: Partial<RuleOptions>; min: number; max: number }[]
    }
  }

describe(`lost hands — ${doc.description}`, () => {
  it('every variant cites its payment table', () => {
    for (const v of ['singapore', 'hongkong', 'minimum']) {
      expect(doc.cite[v], `no citation for ${v}`).toBeTruthy()
    }
    for (const e of doc.entries) expect(e.why, `${e.id} has no reasoning`).toBeTruthy()
  })

  for (const e of doc.entries) {
    describe(`${e.id} — ${e.title}`, () => {
      const plugin = VARIANTS[e.variant]
      const run = () => settleLostHand({
        plugin,
        playerCount: 4,
        winnerIndex: e.winner,
        discarderIndex: e.discarder,
        fan: e.fan,
        opts: e.opts,
      })

      it('settles at all', () => {
        expect(run(), e.why).not.toBeNull()
      })

      it('pays what the published table says', () => {
        expect(run()!.pay, e.why).toEqual(e.expect.pay)
      })

      it('records all four signed amounts', () => {
        expect(run()!.deltas, e.why).toEqual(e.expect.deltas)
      })

      it('the winner collects and nobody else does', () => {
        const d = run()!.deltas
        expect(d[e.winner]).toBeGreaterThan(0)
        for (let i = 0; i < 4; i++) {
          if (i !== e.winner) expect(d[i], `player ${i}`).toBeLessThanOrEqual(0)
        }
      })

      it(`the player's own headline is ${e.expect.youPay}`, () => {
        // What the result screen leads with. A zero here is a real outcome
        // under Hong Kong full payment, not a missing number.
        //
        // `+ 0` because negating a zero delta gives -0, and Object.is(-0, 0)
        // is false. The same normalisation belongs on the screen, where the
        // difference would print as "\u22120".
        expect(-(run()!.deltas[e.you] ?? 0) + 0, e.why).toBe(e.expect.youPay)
      })

      it('balances to zero', () => {
        expect(run()!.deltas.reduce((a, b) => a + b, 0)).toBe(0)
      })
    })
  }
})

describe(`the fan a player may enter — ${doc.bounds.description}`, () => {
  for (const c of doc.bounds.cases) {
    const plugin = VARIANTS[c.variant]
    const label = `${c.variant} limit ${c.opts.limit} min ${c.opts.minTai}`

    it(`${label}: bounded to ${c.min}–${c.max}`, () => {
      expect(fanBounds(plugin, c.opts)).toEqual({ min: c.min, max: c.max })
    })

    it(`${label}: refuses fan below the minimum`, () => {
      expect(settleLostHand({
        plugin, playerCount: 4, winnerIndex: 1, discarderIndex: null,
        fan: c.min - 1, opts: c.opts,
      })).toBeNull()
    })

    it(`${label}: refuses fan above the limit`, () => {
      expect(settleLostHand({
        plugin, playerCount: 4, winnerIndex: 1, discarderIndex: null,
        fan: c.max + 1, opts: c.opts,
      })).toBeNull()
    })

    it(`${label}: every fan in range settles and balances`, () => {
      for (let fan = c.min; fan <= c.max; fan++) {
        for (const discarder of [null, 0, 2] as const) {
          const r = settleLostHand({
            plugin, playerCount: 4, winnerIndex: 1, discarderIndex: discarder,
            fan, opts: c.opts,
          })
          expect(r, `${label} fan ${fan} discarder ${discarder}`).not.toBeNull()
          expect(r!.deltas.reduce((a, b) => a + b, 0), `fan ${fan}`).toBe(0)
          expect(r!.deltas[1]).toBeGreaterThan(0)
        }
      }
    })
  }

  it('the winner can never also be the discarder', () => {
    expect(settleLostHand({
      plugin: VARIANTS.singapore, playerCount: 4, winnerIndex: 2,
      discarderIndex: 2, fan: 3, opts: { limit: 5, minTai: 1 },
    })).toBeNull()
  })

  it('a non-integer fan is refused rather than rounded', () => {
    expect(settleLostHand({
      plugin: VARIANTS.singapore, playerCount: 4, winnerIndex: 1,
      discarderIndex: null, fan: 2.5, opts: { limit: 5, minTai: 1 },
    })).toBeNull()
  })
})

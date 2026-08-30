/**
 * The prediction gate.
 *
 * Prediction is a search, not a rule, so this corpus works differently from
 * the two scoring ones. It asserts two kinds of thing:
 *
 *   1. STRUCTURE, per entry — the state the panel should be in, how far from
 *      home the hand is, and which hands must or must not be on offer. These
 *      were written by hand from the tiles.
 *   2. INVARIANTS, on every candidate of every entry — the properties that
 *      make a suggestion safe to show a player at a table. These are the ones
 *      that matter: a suggestion that cannot be built, or is worth less than
 *      it says, is worse than no suggestion at all.
 *
 * The fan figures are cited because a fan claim is a rules claim.
 */

import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

import { predict, SPARSE_BELOW, type Candidate } from '../predict'
import { handSignature } from '../patterns'
import { VARIANTS, inventoryOf, type VariantId } from '../variants'
import { concealedTargets } from '../session/table'
import { parseTiles, tally, type TileId } from '../core/tiles'
import type { MeldInput } from '../core/hand'

interface Entry {
  id: string
  title: string
  cite: string
  note?: string
  variant: VariantId
  hand: { concealed: string; melds?: MeldInput[]; bonus?: string[] }
  ctx: { seat: 'E' | 'S' | 'W' | 'N'; prevailing: 'E' | 'S' | 'W' | 'N' }
  opts?: { rules?: Record<string, unknown>; limit?: number }
  expect: {
    state: string
    keyed: number
    target: number
    candidates?: number
    minCandidates?: number
    nearestAway?: number
    hintsInclude?: string[]
    includes?: {
      signature: string; away?: number; fan?: number; fanBest?: number
      bestWin?: 'discard' | 'selfDraw'; needed?: string
      /** No finish of this hand is a legal win on a claimed tile. */
      selfDrawOnly?: boolean
    }[]
    noAnimals?: boolean
    everyCandidateAtLeast?: number
    maxCopiesOf?: Record<string, number>
    anyDiscard?: boolean
    /** At least one suggestion whose value depends on how it is finished. */
    conditionalFan?: boolean
    /** A tile that must never appear in any suggestion's discard list. */
    neverDiscards?: string[]
    /** Exact `seen` counts for named hints. */
    hintSeen?: Record<string, number>
  }
}

const file = fileURLToPath(new URL('./predict/01-prediction.json', import.meta.url))
const doc = JSON.parse(readFileSync(file, 'utf8')) as { description: string; entries: Entry[] }

const keyed = (e: Entry) => ({
  concealed: e.hand.concealed.trim() ? (parseTiles(e.hand.concealed) as TileId[]) : [],
  melds: e.hand.melds ?? [],
  bonus: e.hand.bonus ?? [],
})

const meldTiles = (m: MeldInput) => m.tiles.trim().split(/\s+/) as TileId[]

describe(`predict — ${doc.description}`, () => {
  for (const e of doc.entries) {
    it(`${e.id}: ${e.title}`, () => {
      const plugin = VARIANTS[e.variant]
      const hand = keyed(e)
      const p = predict(plugin, hand, e.ctx, e.opts as never)

      expect(p.state, `state — ${e.cite}`).toBe(e.expect.state)
      expect(p.keyed).toBe(e.expect.keyed)
      expect(p.target).toBe(e.expect.target)

      if (e.expect.candidates !== undefined) {
        expect(p.candidates).toHaveLength(e.expect.candidates)
      }
      if (e.expect.minCandidates !== undefined) {
        expect(p.candidates.length).toBeGreaterThanOrEqual(e.expect.minCandidates)
      }
      if (e.expect.nearestAway !== undefined) {
        expect(Math.min(...p.candidates.map((c) => c.away)), `nearest — ${e.cite}`)
          .toBe(e.expect.nearestAway)
      }
      for (const h of e.expect.hintsInclude ?? []) {
        expect(p.hints.map((x) => x.key)).toContain(h)
      }
      for (const want of e.expect.includes ?? []) {
        const hit = p.candidates.find((c) => handSignature(c.patterns).split('+').includes(want.signature))
        expect(hit, `expected a ${want.signature} suggestion — ${e.cite}`).toBeTruthy()
        if (!hit) continue
        if (want.away !== undefined) expect(hit.away, `away — ${e.cite}`).toBe(want.away)
        if (want.fan !== undefined) expect(hit.fan, `fan — ${e.cite}`).toBe(want.fan)
        if (want.fanBest !== undefined) {
          expect(hit.fanBest, `fanBest — ${e.cite}`).toBe(want.fanBest)
        }
        if (want.bestWin !== undefined) {
          expect(hit.bestWin, `bestWin — ${e.cite}`).toBe(want.bestWin)
        }
        if (want.selfDrawOnly !== undefined) {
          expect(hit.winsOnDiscard, `${e.id} / ${want.signature} — winsOnDiscard`)
            .toBe(!want.selfDrawOnly)
        }
        if (want.needed !== undefined) {
          const flat = hit.needed.flatMap((n) => Array<string>(n.count).fill(n.tile)).join(' ')
          expect(flat, `tiles needed — ${e.cite}`).toBe(want.needed)
        }
      }
      if (e.expect.everyCandidateAtLeast !== undefined) {
        for (const c of p.candidates) {
          expect(c.fan, `${c.key} is below the minimum — ${e.cite}`)
            .toBeGreaterThanOrEqual(e.expect.everyCandidateAtLeast)
        }
      }
      if (e.expect.noAnimals) {
        // Declared on the Entry type and set on pred-hk-003, and until now
        // never actually read — the entry named the guard without asserting it.
        const inv = inventoryOf(plugin)
        for (const c of p.candidates) {
          for (const b of c.example.bonus ?? []) {
            expect(inv.bonusTiles.has(b as never), `${e.id} suggests ${b}`).toBe(true)
          }
          for (const t of parseTiles(c.example.concealed)) {
            expect(inv.wallTiles.has(t), `${e.id} suggests ${t}`).toBe(true)
          }
        }
      }
      for (const t of e.expect.neverDiscards ?? []) {
        for (const c of p.candidates) {
          expect(c.discard, `${e.id} / ${c.key} throws away ${t}`).not.toContain(t)
        }
      }
      for (const [k, n] of Object.entries(e.expect.hintSeen ?? {})) {
        expect(p.hints.find((h) => h.key === k)?.seen, `${e.id} hint ${k}`).toBe(n)
      }
      if (e.expect.conditionalFan) {
        const conditional = p.candidates.some(
          (c) => c.fan !== c.fanBest || c.finishOn.length < c.needed.length)
        expect(conditional, `${e.id} — no suggestion here is order-dependent`).toBe(true)
      }
      if (e.expect.anyDiscard) {
        expect(p.candidates.some((c) => c.discard.length > 0)).toBe(true)
      }
      if (e.expect.maxCopiesOf) {
        for (const c of p.candidates) {
          const all = tally([...parseTiles(c.example.concealed),
                             ...(c.example.melds ?? []).flatMap(meldTiles)])
          for (const [t, max] of Object.entries(e.expect.maxCopiesOf)) {
            expect(all.get(t) ?? 0, `${c.key} uses too many ${t}`).toBeLessThanOrEqual(max)
          }
        }
      }
    })
  }
})

// ─────────────────────────────────────────────────────────────────────
// The invariants. Every candidate of every entry, every time.
// ─────────────────────────────────────────────────────────────────────
describe('every suggestion is a hand that can actually be built and won', () => {
  const all: { e: Entry; c: Candidate }[] = []
  for (const e of doc.entries) {
    const p = predict(VARIANTS[e.variant], keyed(e), e.ctx, e.opts as never)
    for (const c of p.candidates) all.push({ e, c })
  }

  it('found candidates to check', () => {
    expect(all.length).toBeGreaterThan(30)
  })

  it('CERTIFIES every fan figure against EVERY way the hand can finish', () => {
    // The one that matters, and it must not ask the engine the same leading
    // question the engine asked itself. A hand is not worth one number: which
    // of the missing tiles arrives last, and whether it is drawn or claimed,
    // both change the answer. So every realisation is re-scored here, from
    // scratch, and the claim is checked against all of them:
    //   * `fan` is the FLOOR — no realisation that wins pays less
    //   * `fanBest` is the ceiling — none pays more
    //   * `finishOn` names exactly the tiles that can finish it legally
    // Scoring only the canonically-first missing tile made this test circular
    // with the defect it was supposed to catch.
    for (const { e, c } of all) {
      const plugin = VARIANTS[e.variant]
      const seen: number[] = []
      const winners: string[] = []
      for (const n of c.needed) {
        let any = false
        for (const win of ['discard', 'selfDraw'] as const) {
          const r = plugin.score(c.example, { ...e.ctx, win, winningTile: n.tile },
            e.opts?.rules as never)
          if (!r.valid) continue
          any = true
          seen.push(r.totalTai)
        }
        if (any) winners.push(n.tile)
      }
      expect(seen.length, `${e.id} / ${c.key} cannot be won any way at all`)
        .toBeGreaterThan(0)
      expect(Math.min(...seen), `${e.id} / ${c.key} claims a floor of ${c.fan}`).toBe(c.fan)
      expect(Math.max(...seen), `${e.id} / ${c.key} claims a best of ${c.fanBest}`).toBe(c.fanBest)
      expect(winners, `${e.id} / ${c.key} names the wrong finishing tiles`)
        .toEqual([...c.finishOn])
    }
  })

  it('never claims more than the least it can pay', () => {
    for (const { e, c } of all) {
      expect(c.fan, `${e.id} / ${c.key}`).toBeLessThanOrEqual(c.fanBest)
    }
  })

  it('names a finishing tile the hand actually needs', () => {
    for (const { e, c } of all) {
      const needed = new Set(c.needed.map((n) => n.tile))
      for (const t of c.finishOn) expect(needed.has(t), `${e.id} / ${t}`).toBe(true)
      expect(c.finishOn.length).toBeGreaterThan(0)
    }
  })

  it('never needs a fifth copy of any tile', () => {
    for (const { e, c } of all) {
      const all4 = tally([...parseTiles(c.example.concealed),
                          ...(c.example.melds ?? []).flatMap(meldTiles)])
      for (const [t, n] of all4) {
        expect(n, `${e.id} / ${c.key} wants ${n} × ${t}`).toBeLessThanOrEqual(4)
      }
    }
  })

  it('never suggests a tile the variant does not play', () => {
    for (const { e, c } of all) {
      const inv = inventoryOf(VARIANTS[e.variant])
      for (const t of parseTiles(c.example.concealed)) {
        expect(inv.wallTiles.has(t), `${e.id} / ${c.key} suggests ${t}`).toBe(true)
      }
      for (const n of c.needed) {
        expect(inv.wallTiles.has(n.tile), `${e.id} / ${c.key} needs ${n.tile}`).toBe(true)
      }
    }
  })

  it('keeps the declared melds exactly as they were', () => {
    for (const { e, c } of all) {
      expect(c.example.melds ?? []).toEqual(e.hand.melds ?? [])
      expect(c.example.bonus ?? []).toEqual(e.hand.bonus ?? [])
    }
  })

  it('finishes at exactly the hand size the variant asks for', () => {
    for (const { e, c } of all) {
      const target = concealedTargets(keyed(e)).min
      expect(parseTiles(c.example.concealed), `${e.id} / ${c.key}`).toHaveLength(target)
    }
  })

  it('says a distance that matches the tiles it asks for', () => {
    for (const { e, c } of all) {
      const total = c.needed.reduce((n, x) => n + x.count, 0)
      expect(total, `${e.id} / ${c.key}`).toBe(c.away)
      expect(c.away).toBeGreaterThan(0)
    }
  })

  it('only asks for tiles the hand is actually short of', () => {
    for (const { e, c } of all) {
      const have = tally(keyed(e).concealed)
      const want = tally(parseTiles(c.example.concealed))
      for (const n of c.needed) {
        expect(n.count, `${e.id} / ${c.key} / ${n.tile}`)
          .toBe((want.get(n.tile) ?? 0) - (have.get(n.tile) ?? 0))
      }
    }
  })

  it('names every discard as a tile actually held', () => {
    for (const { e, c } of all) {
      const have = tally(keyed(e).concealed)
      for (const d of c.discard) expect(have.get(d) ?? 0, `${e.id} / ${d}`).toBeGreaterThan(0)
    }
  })

  it('offers each hand at most once', () => {
    for (const e of doc.entries) {
      const p = predict(VARIANTS[e.variant], keyed(e), e.ctx, e.opts as never)
      const sigs = p.candidates.map((c) => handSignature(c.patterns))
      expect(new Set(sigs).size, `${e.id} repeats a suggestion`).toBe(sigs.length)
    }
  })
})

describe('the corpus itself', () => {
  it('cites every entry', () => {
    for (const e of doc.entries) expect(e.cite, `${e.id}`).toBeTruthy()
  })
  it('never repeats an id', () => {
    const ids = doc.entries.map((e) => e.id)
    expect(new Set(ids).size).toBe(ids.length)
  })
  it('covers both variants and every state', () => {
    expect(new Set(doc.entries.map((e) => e.variant))).toEqual(new Set(['singapore', 'hongkong']))
    expect(new Set(doc.entries.map((e) => e.expect.state)))
      .toEqual(new Set(['empty', 'sparse', 'candidates', 'complete', 'won', 'notAHand']))
  })
  it('pins the sparse threshold the entries were written against', () => {
    expect(SPARSE_BELOW).toBe(5)
  })
})

/**
 * The table session and the guided declare flow.
 *
 * These are the rules the UI leans on, so they are tested here rather than
 * inside a component: rotation and the greyed-out guidance both decide money.
 */

import { describe, expect, it } from 'vitest'
import { tally, type TileId } from '../core/tiles'
import {
  advanceTable, buildMeld, composeHands, concealedKongs, concealedTarget,
  isDealer, legalNextTiles, newTable, playerOnWind, prevailingWind, seatWindOf,
  handIsComplete, handIsReadable, scoreKeyedHand, submissionMatchesHand, tilesRemaining,
  yourSeat, concealedTargets, settleHand, runningTotal, roundNumber, dealInRound,
} from './table'
import { hongkong, singapore } from '../variants'

const NAMES = ['Ming', 'Ah Hock', 'Siti', 'Wei']
const table = () => newTable(NAMES, 1, 0)

describe('seating', () => {
  it('gives East to whoever holds the deal', () => {
    const t = table()
    expect(seatWindOf(t, 0)).toBe('E')
    expect(seatWindOf(t, 1)).toBe('S')
    expect(seatWindOf(t, 2)).toBe('W')
    expect(seatWindOf(t, 3)).toBe('N')
    expect(isDealer(t, 0)).toBe(true)
    expect(isDealer(t, 1)).toBe(false)
  })

  it('reports your own seat', () => {
    expect(yourSeat(table())).toBe('S')
  })

  it('maps a wind back to the player sitting on it', () => {
    const t = table()
    for (const [i, w] of (['E', 'S', 'W', 'N'] as const).entries()) {
      expect(playerOnWind(t, w)).toBe(i)
    }
  })

  it('starts in the East round', () => {
    expect(prevailingWind(table())).toBe('E')
  })
})

describe('rotation', () => {
  it('keeps the deal when the dealer wins, and counts the hand', () => {
    const t = advanceTable(table(), 0)
    expect(t.dealerIndex).toBe(0)
    expect(t.handNumber).toBe(2)
    expect(prevailingWind(t)).toBe('E')
  })

  it('passes the deal on when anyone else wins', () => {
    const t = advanceTable(table(), 2)
    expect(t.dealerIndex).toBe(1)
    expect(seatWindOf(t, 1)).toBe('E')
    expect(seatWindOf(t, 0)).toBe('N')
  })

  it('keeps the deal on a washout', () => {
    // RULING R16 — the usual Singapore convention.
    const t = advanceTable(table(), null)
    expect(t.dealerIndex).toBe(0)
    expect(t.handNumber).toBe(2)
  })

  it('advances the prevailing wind once the deal has been all the way round', () => {
    let t = table()
    expect(prevailingWind(t)).toBe('E')
    t = advanceTable(t, 1)   // dealer 0 -> 1
    t = advanceTable(t, 2)   // 1 -> 2
    t = advanceTable(t, 3)   // 2 -> 3
    expect(prevailingWind(t)).toBe('E')
    t = advanceTable(t, 0)   // fourth pass — a full circuit
    expect(t.dealerIndex).toBe(0)
    expect(prevailingWind(t)).toBe('S')
    expect(t.handNumber).toBe(5)
  })

  it('does not advance the round on a dealer repeat mid-circuit', () => {
    let t = advanceTable(table(), 1)      // dealer now 1
    t = advanceTable(t, 1)                // dealer 1 wins, holds
    expect(t.dealerIndex).toBe(1)
    expect(prevailingWind(t)).toBe('E')
    expect(t.handNumber).toBe(3)
  })

  it('advances the round after four deals whoever dealt first', () => {
    // A table that starts with player 2 dealing must still turn the round over
    // after four passes, not when the deal happens to reach player 0.
    let t = newTable(NAMES, 1, 2)
    expect(prevailingWind(t)).toBe('E')
    for (let i = 0; i < 3; i++) t = advanceTable(t, (t.dealerIndex + 1) % 4)
    expect(prevailingWind(t)).toBe('E')
    t = advanceTable(t, (t.dealerIndex + 1) % 4)
    expect(prevailingWind(t)).toBe('S')
    expect(t.dealerIndex).toBe(2)
  })

  it('does not let a dealer repeat shorten the round', () => {
    let t = newTable(NAMES, 1, 0)
    t = advanceTable(t, 1)          // pass 1
    t = advanceTable(t, 1)          // dealer 1 holds
    t = advanceTable(t, 2)          // pass 2
    t = advanceTable(t, 3)          // pass 3
    expect(prevailingWind(t)).toBe('E')
    t = advanceTable(t, 0)          // pass 4 -> round turns
    expect(prevailingWind(t)).toBe('S')
  })

  it('carries the names and your identity through every hand', () => {
    let t = table()
    for (let i = 0; i < 9; i++) t = advanceTable(t, i % 4)
    expect(t.players).toEqual(NAMES)
    expect(t.youIndex).toBe(1)
  })
})

describe('concealed kongs', () => {
  const keyed = (concealed: string, melds: never[] = []) => ({
    concealed: concealed.split(' ') as TileId[], melds, bonus: [],
  })

  it('spots four of a kind in hand', () => {
    expect(concealedKongs(keyed('1m 1m 1m 1m 2p').concealed)).toEqual(['1m'])
    expect(concealedKongs(keyed('1m 1m 1m 2p').concealed)).toEqual([])
  })

  it('grows the hand by one for each kong', () => {
    expect(concealedTarget(keyed('2p 3p 4p'))).toBe(14)
    expect(concealedTarget(keyed('1m 1m 1m 1m'))).toBe(15)
    expect(concealedTarget(keyed('1m 1m 1m 1m 2p 2p 2p 2p'))).toBe(16)
  })

  it('accounts for declared melds', () => {
    const h = { concealed: [] as TileId[], bonus: [],
      melds: [{ t: 'chow' as const, tiles: '1m 2m 3m', open: true }] }
    expect(concealedTarget(h)).toBe(11)
    const withKong = { ...h,
      melds: [{ t: 'kong' as const, tiles: 'CCCC'.split('').join(' '), open: true }] }
    expect(concealedTarget(withKong)).toBe(11)
  })

  it('offers the konged reading first but keeps the plain one', () => {
    const [konged, plain] = composeHands(keyed('1m 1m 1m 1m 2p 2p'))
    expect(konged!.melds).toHaveLength(1)
    expect(konged!.melds![0]!.tiles).toBe('1m 1m 1m 1m')
    expect(konged!.melds![0]!.open).toBe(false)
    expect(konged!.concealed).toBe('2p 2p')
    // Nine Gates can hold four of a terminal with no meld at all, so the
    // un-konged reading has to survive.
    expect(plain!.melds).toHaveLength(0)
    expect(plain!.concealed).toBe('1m 1m 1m 1m 2p 2p')
  })

  /**
   * THE DEAD END, and the shape of it.
   *
   * A player taps a tile four times. The app used to call the hand complete at
   * fourteen — because fourteen is a legal size when the quad is read as a
   * pong plus a floater — refuse to score it, and offer nothing: no empty
   * slot, no prompt, no reason. The fifteenth tile that makes the kong reading
   * work was reachable and never mentioned.
   *
   * The engine's half of the fix is that every kong subset is now a reading,
   * and that any size between min and max counts as complete. The UI's half is
   * that the kong is taken by default and can be declined.
   */
  it('offers every subset of the concealed kongs, fullest first', () => {
    const two = keyed('1m 1m 1m 1m 9s 9s 9s 9s 2p 2p')
    const readings = composeHands(two)
    // both, 1m only, 9s only, none
    expect(readings).toHaveLength(4)
    expect(readings.map((r) => r.melds!.length)).toEqual([2, 1, 1, 0])
    const sizes = readings.map((r) => r.concealed.split(/\s+/).filter(Boolean).length)
    expect(sizes).toEqual([2, 6, 6, 10])
  })

  it('reads a hand that kongs one quad and not the other', () => {
    // 1m1m1m1m as a kong; 9s9s9s9s as a pong plus a 9s that never gets used —
    // fifteen tiles, and before Run 6 there was no reading of this size at all.
    const h = keyed('1m 1m 1m 1m 9s 9s 9s 9s 7s 8s 9s 2p 3p 4p 5p')
    expect(handIsComplete(h)).toBe(true)
    const sizes = composeHands(h).map(
      (r) => r.concealed.split(/\s+/).filter(Boolean).length + r.melds!.length * 4)
    expect(sizes).toContain(15)
  })

  /**
   * KEY ORDER CANNOT CHANGE THE SCORE.
   *
   * The four copies of a tile can be tapped first, last, or scattered through
   * the hand, and a player at a table does all three. The keyed hand is a
   * multiset; anything that reads it positionally is a bug that only shows up
   * for whoever taps in an unusual order.
   */
  it('scores the same however the four copies were tapped', () => {
    const rest = '2p 3p 4p 6p 7p 8p 1s 2s 3s 9m 9m'.split(' ')
    const quad = ['5s', '5s', '5s', '5s']
    const orders: Record<string, TileId[]> = {
      first: [...quad, ...rest],
      last: [...rest, ...quad],
      middle: [...rest.slice(0, 5), ...quad, ...rest.slice(5)],
      scattered: rest.flatMap((t, i) => (i < 4 ? [quad[i]!, t] : [t])),
    }
    const ctx = { seat: 'E', prevailing: 'E', win: 'selfDraw', winningTile: '5s' } as const
    const scores = Object.entries(orders).map(([name, concealed]) => {
      const h = { concealed, melds: [], bonus: [] }
      expect(h.concealed, `${name} is not fifteen tiles`).toHaveLength(15)
      expect(handIsComplete(h), `${name} is not complete`).toBe(true)
      return [name, scoreKeyedHand(singapore, h, ctx).result] as const
    })
    const [, first] = scores[0]!
    for (const [name, r] of scores) {
      expect(r.valid, `${name} did not score`).toBe(first.valid)
      if (r.valid && first.valid) {
        expect(r.totalTai, `${name} scored differently`).toBe(first.totalTai)
        expect([...r.patterns].sort(), `${name} read differently`)
          .toEqual([...first.patterns].sort())
      }
    }
  })

  it('offers a single reading when there is no kong', () => {
    expect(composeHands(keyed('1m 2m 3m'))).toHaveLength(1)
  })
})

describe('guided declaration', () => {
  const used = (s: string) => tally(s ? (s.split(' ') as TileId[]) : [])

  it('offers every tile for a pong when nothing is committed', () => {
    expect(legalNextTiles('pong', [], used('')).size).toBe(34)
  })

  it('refuses a pong of a tile with fewer than three left', () => {
    const legal = legalNextTiles('pong', [], used('5p 5p'))
    expect(legal.has('5p')).toBe(false)
    expect(legal.has('6p')).toBe(true)
  })

  it('refuses a kong unless all four are free', () => {
    expect(legalNextTiles('kong', [], used('5p')).has('5p')).toBe(false)
    expect(legalNextTiles('kong', [], used('')).has('5p')).toBe(true)
  })

  it('offers only suited tiles that can start a run', () => {
    const legal = legalNextTiles('chow', [], used(''))
    expect(legal.has('E')).toBe(false)
    expect(legal.has('C')).toBe(false)
    expect(legal.size).toBe(27)
  })

  it('narrows to the run neighbours after the first tap', () => {
    const legal = legalNextTiles('chow', ['3m'], used(''))
    expect([...legal].sort()).toEqual(['1m', '2m', '4m', '5m'])
  })

  it('narrows to a single completion after the second tap', () => {
    expect([...legalNextTiles('chow', ['3m', '4m'], used(''))].sort()).toEqual(['2m', '5m'])
    expect([...legalNextTiles('chow', ['3m', '5m'], used(''))]).toEqual(['4m'])
  })

  it('never offers a tile from another suit', () => {
    const legal = legalNextTiles('chow', ['3m'], used(''))
    for (const t of legal) expect(t.endsWith('m')).toBe(true)
  })

  it('does not lead the player into a run they cannot finish', () => {
    // Every 5m is spoken for, so 3m-4m can only go up to 2m.
    const legal = legalNextTiles('chow', ['3m', '4m'], used('5m 5m 5m 5m'))
    expect([...legal]).toEqual(['2m'])
  })

  it('respects the edges of a suit', () => {
    expect([...legalNextTiles('chow', ['1m'], used(''))].sort()).toEqual(['2m', '3m'])
    expect([...legalNextTiles('chow', ['9s'], used(''))].sort()).toEqual(['7s', '8s'])
  })

  it('counts down the taps a meld still needs', () => {
    expect(tilesRemaining('chow', [])).toBe(3)
    expect(tilesRemaining('chow', ['3m', '4m'])).toBe(1)
    expect(tilesRemaining('pong', [])).toBe(1)
    expect(tilesRemaining('kong', [])).toBe(1)
  })

  it('builds the meld once it has enough tiles', () => {
    expect(buildMeld('chow', ['4m', '2m', '3m'])).toEqual({ t: 'chow', tiles: '2m 3m 4m', open: true })
    expect(buildMeld('pong', ['C'])).toEqual({ t: 'pong', tiles: 'C C C', open: true })
    expect(buildMeld('kong', ['5p'])).toEqual({ t: 'kong', tiles: '5p 5p 5p 5p', open: true })
    expect(buildMeld('chow', ['2m'])).toBeNull()
  })

  it('builds melds the engine accepts', () => {
    const chow = buildMeld('chow', ['3m', '4m', '2m'])!
    const pong = buildMeld('pong', ['C'])!
    const r = singapore.score(
      { concealed: '123m 456m 55s', melds: [chow, pong], bonus: [] },
      { seat: 'E', prevailing: 'E', win: 'discard', winningTile: '5s' },
    )
    expect(r.valid, r.valid ? '' : (r as { reason: string }).reason).toBe(true)
    if (r.valid) expect(r.fan.map((f) => f.key)).toContain('dragonTriplet')
  })
})

describe('scoring a keyed hand', () => {
  const ctx = { seat: 'S', prevailing: 'E', win: 'discard', winningTile: '9m' } as const

  it('reads four concealed tiles as a kong and scores the hand', () => {
    const { result, input } = scoreKeyedHand(singapore, {
      concealed: ('3m 4m 5m 1p 1p 1p 1p 2s 3s 4s 6s 7s 8s 9m 9m'.split(' ')) as never,
      melds: [], bonus: ['S2'],
    }, ctx, { limit: 5 })
    expect(result.valid, result.valid ? '' : (result as { reason: string }).reason).toBe(true)
    expect(input.melds).toHaveLength(1)
    expect(input.melds![0]!.t).toBe('kong')
  })

  it('keeps the un-konged reading when it is the only winning one', () => {
    // Nine Gates holds four of a terminal and takes no meld at all.
    const { result, input } = scoreKeyedHand(singapore, {
      concealed: '1m 1m 1m 1m 2m 3m 4m 5m 6m 7m 8m 9m 9m 9m'.split(' ') as never,
      melds: [], bonus: [],
    }, { seat: 'S', prevailing: 'E', win: 'discard', winningTile: '1m' }, { limit: 5 })
    expect(result.valid).toBe(true)
    if (result.valid) expect(result.patterns).toContain('nineGates')
    expect(input.melds).toHaveLength(0)
  })

  it('reports a rejection when no reading wins', () => {
    const { result } = scoreKeyedHand(singapore, {
      concealed: '1m 2m 3m'.split(' ') as never, melds: [], bonus: [],
    }, ctx, { limit: 5 })
    expect(result.valid).toBe(false)
    if (!result.valid) expect(result.reason).toBe('wrongTileCount')
  })
})

describe('keying order must not change the hand', () => {
  const T = (concealed: string) => ({
    concealed: concealed.split(' ') as TileId[], melds: [], bonus: [] as string[],
  })

  it('lets the fourth copy be the last tile keyed', () => {
    // Regression: the fourth copy is exactly the tile that turns a triplet into
    // a concealed kong and grows the hand by one, so a guard measured against
    // the hand BEFORE the tap made a concealed kong impossible to key last —
    // and the hand then scored as a pong.
    const before = T('2s 3s 4s 6s 7s 8s 9m 9m 1p 1p 1p')
    expect(concealedTarget(before)).toBe(14)
    const after = T('2s 3s 4s 6s 7s 8s 9m 9m 1p 1p 1p 1p')
    expect(concealedTarget(after)).toBe(15)
    // The tap is legal precisely because it is measured against the hand it
    // produces: 12 <= 15.
    expect(after.concealed.length).toBeLessThanOrEqual(concealedTarget(after))
  })

  it('scores the same hand the same way whichever order it was keyed', () => {
    const ctx = { seat: 'E', prevailing: 'E', win: 'selfDraw', winningTile: '9m' } as const
    const kongFirst = scoreKeyedHand(singapore, T('5s 5s 5s 5s 1m 1m 1m 2p 2p 2p 3s 3s 3s 9m 9m'), ctx)
    const kongLast = scoreKeyedHand(singapore, T('9m 9m 1m 1m 1m 2p 2p 2p 3s 3s 3s 5s 5s 5s 5s'), ctx)
    expect(kongFirst.result.valid).toBe(true)
    expect(kongLast.result.valid).toBe(true)
    if (kongFirst.result.valid && kongLast.result.valid) {
      expect(kongLast.result.totalTai).toBe(kongFirst.result.totalTai)
      expect([...kongLast.result.patterns].sort())
        .toEqual([...kongFirst.result.patterns].sort())
    }
  })
})

describe('submitting a hand', () => {
  const H = (concealed: string) => ({
    concealed: concealed.split(' ') as TileId[], melds: [], bonus: [] as string[],
  })
  const COMPLETE = '1m 1m 1m 2p 2p 2p 3s 3s 3s 5s 5s 5s 9m 9m'
  const sub = (winningTile: string) => ({
    winningTile, win: 'selfDraw' as const, discarderIndex: null, flags: [], pao: false,
  })

  it('knows when the tiles are the right size to win', () => {
    expect(handIsComplete(H(COMPLETE))).toBe(true)
    expect(handIsComplete(H('1m 1m 1m'))).toBe(false)
  })

  it('accepts a submission that still describes the hand', () => {
    expect(submissionMatchesHand(H(COMPLETE), sub('9m'))).toBe(true)
  })

  it('REGRESSION: undoing the pair invalidates the whole submission', () => {
    // The Run 2B bug: a winning tile was marked while the hand was complete,
    // then the pair was undone and the mark lingered as stale state. A
    // submission is now only valid while the hand it describes is intact.
    const complete = H(COMPLETE)
    const s = sub('9m')
    expect(submissionMatchesHand(complete, s)).toBe(true)

    const undoneOnce = H(COMPLETE.split(' ').slice(0, -1).join(' '))
    expect(handIsComplete(undoneOnce)).toBe(false)
    expect(submissionMatchesHand(undoneOnce, s)).toBe(false)

    const undoneTwice = H(COMPLETE.split(' ').slice(0, -2).join(' '))
    expect(submissionMatchesHand(undoneTwice, s)).toBe(false)
  })

  it('REGRESSION: a submission naming a tile no longer held is refused', () => {
    // Same hand size, different tiles — the winning tile is gone.
    const swapped = H('1m 1m 1m 2p 2p 2p 3s 3s 3s 5s 5s 5s 8m 8m')
    expect(handIsComplete(swapped)).toBe(true)
    expect(submissionMatchesHand(swapped, sub('9m'))).toBe(false)
  })

  it('refuses a null submission', () => {
    expect(submissionMatchesHand(H(COMPLETE), null)).toBe(false)
  })
})

describe('the table module serves both variants', () => {
  const T = (concealed: string) => ({
    concealed: concealed.split(' ') as TileId[], melds: [], bonus: [] as string[],
  })

  it('rolls the deal the same way in Hong Kong as in Singapore', () => {
    // RULING HK6 — the dealer repeats on a dealer win.
    // RULING HK7 — the dealer keeps the deal on a washout, chosen to match R16.
    const t0 = newTable(['A', 'B', 'C', 'D'], 0, 1)
    expect(advanceTable(t0, 1).dealerIndex).toBe(1)          // dealer won: holds
    expect(advanceTable(t0, null).dealerIndex).toBe(1)       // washout: holds
    expect(advanceTable(t0, null).prevailingIndex).toBe(t0.prevailingIndex)
    expect(advanceTable(t0, 2).dealerIndex).toBe(2)          // someone else: passes
  })

  it('advances the prevailing wind after four passes, whoever dealt first', () => {
    let s = newTable(['A', 'B', 'C', 'D'], 0, 2)
    expect(s.prevailingIndex).toBe(0)
    for (let i = 0; i < 4; i++) s = advanceTable(s, (s.dealerIndex + 1) % 4)
    expect(s.prevailingIndex).toBe(1)
    expect(s.dealerIndex).toBe(2)
  })

  it('scores a keyed Hong Kong hand, concealed kong and all', () => {
    // 對對糊 with a concealed kong, self-drawn. RULING HK21 makes the kong a
    // concealed triplet, so the hand is 坎坎糊: 8 + 自摸 1 + 無花 1 = 10.
    const ctx = { seat: 'S', prevailing: 'E', win: 'selfDraw', winningTile: '9s' } as const
    const { result, input } = scoreKeyedHand(hongkong, T('1m 1m 1m 1m 3m 3m 3m 5p 5p 5p 7s 7s 7s 9s 9s'), ctx)
    expect(result.valid, result.valid ? '' : (result as { reason: string }).reason).toBe(true)
    expect(input.melds).toHaveLength(1)
    if (result.valid) {
      expect(result.patterns).toContain('fourConcealedTriplets')
      expect(result.totalTai).toBe(10)
      expect(result.base).toBe(128)
    }
  })

  it('gives the same tiles different answers in the two variants', () => {
    // A fully concealed hand won on a discard: Hong Kong pays 門前清 (HK12),
    // Singapore's 门清 needs a self-draw (R1), so it does not.
    const ctx = { seat: 'S', prevailing: 'E', win: 'discard', winningTile: '2p' } as const
    const hand = T('1m 2m 3m 4m 5m 6m 7m 8m 9m 2p 3p 4p 5p 5p')
    const hk = scoreKeyedHand(hongkong, hand, ctx, { minTai: 0 }).result
    const sg = scoreKeyedHand(singapore, hand, ctx).result
    expect(hk.valid && sg.valid).toBe(true)
    if (hk.valid) expect(hk.patterns).toContain('fullyConcealed')
    if (sg.valid) expect(sg.patterns).not.toContain('fullyConcealed')
  })

  it('refuses a Singapore animal tile in a Hong Kong hand', () => {
    // RULING HK1 — the shared parser knows animals because Singapore has them.
    const ctx = { seat: 'S', prevailing: 'E', win: 'discard', winningTile: '9s' } as const
    const { result } = scoreKeyedHand(hongkong, {
      concealed: '1m 1m 1m 3m 3m 3m 5p 5p 5p 7s 7s 7s 9s 9s'.split(' ') as TileId[],
      melds: [], bonus: ['cat'],
    }, ctx)
    expect(result.valid).toBe(false)
    if (!result.valid) expect(result.reason).toBe('tileNotInSet')
  })
})

describe('four of a tile is not necessarily a kong', () => {
  const T = (concealed: string) => ({
    concealed: concealed.split(' ') as TileId[], melds: [], bonus: [] as string[],
  })

  // Four identical chows hold three different tiles four times over, and the
  // hand is complete at fourteen tiles with no kong in it anywhere.
  const FOUR_CHOWS = T('1p 2p 3p 1p 2p 3p 1p 2p 3p 1p 2p 3p 5p 5p')

  it('REGRESSION: a complete hand is not asked for phantom tiles', () => {
    const { min, max } = concealedTargets(FOUR_CHOWS)
    expect(min).toBe(14)
    expect(max).toBe(17)
    // The tray must measure against 14 here, not 17 — three dangling slots and
    // three concealed-kong claims were what the old single target produced.
    expect(FOUR_CHOWS.concealed.length).toBe(min)
    expect(handIsComplete(FOUR_CHOWS)).toBe(true)
  })

  it('REGRESSION: the fourth copy is still selectable as the winning tile', () => {
    // The wizard used to be handed the hand with every quad stripped out, so
    // on this hand it offered two tiles out of fourteen and on Nine Gates it
    // could not offer the tile that won.
    const nineGates = T('1p 1p 1p 2p 3p 4p 5p 6p 7p 8p 9p 9p 9p 1p')
    expect(handIsComplete(nineGates)).toBe(true)
    for (const tile of ['1p', '5p', '9p'] as TileId[]) {
      expect(submissionMatchesHand(nineGates, {
        winningTile: tile, win: 'discard', discarderIndex: 1, flags: [], pao: false,
      })).toBe(true)
    }
  })

  it('scores the four-chow hand on any of its own tiles', () => {
    const ctx = { seat: 'S', prevailing: 'E', win: 'discard', winningTile: '1p' } as const
    const { result } = scoreKeyedHand(singapore, FOUR_CHOWS, ctx, { limit: 10 })
    expect(result.valid, result.valid ? '' : (result as { reason: string }).reason).toBe(true)
  })

  it('a real concealed kong still reads as one at the larger size', () => {
    const kong = T('1p 1p 1p 1p 2s 3s 4s 6s 7s 8s 9m 9m 3m 4m 5m')
    const { min, max } = concealedTargets(kong)
    expect([min, max]).toEqual([14, 15])
    expect(kong.concealed.length).toBe(max)
    expect(handIsComplete(kong)).toBe(true)
  })
})

describe('the score button only lights for tiles the engine can read', () => {
  const T = (concealed: string) => ({
    concealed: concealed.split(' ') as TileId[], melds: [], bonus: [] as string[],
  })

  it('REGRESSION: fourteen unrelated tiles are not a hand', () => {
    const junk = T('1m 3m 5m 7m 9m 2p 4p 6p 8p 1s 3s 5s E C')
    expect(handIsComplete(junk)).toBe(true)      // the right number of tiles
    expect(handIsReadable(singapore, junk)).toBe(false)  // and not a hand
    expect(handIsReadable(hongkong, junk)).toBe(false)
  })

  it('a hand that is merely below the minimum is still a hand', () => {
    // Hong Kong needs three faan; this is worth one. The player should be told
    // that after scoring, not be blocked from scoring at all.
    const cheap = T('1m 2m 3m 4m 5m 6m 7m 8m 9m 2p 3p 4p 5p 5p')
    expect(handIsReadable(hongkong, cheap)).toBe(true)
  })

  it('REGRESSION: a fourteen-tile hand is never told it needs fourteen tiles', () => {
    // composeHands offers the konged reading first, and for a hand holding
    // four of something that reading is one tile short.
    const ctx = { seat: 'S', prevailing: 'E', win: 'discard', winningTile: '1m' } as const
    const junk = T('1m 1m 1m 1m 3m 5m 7m 9m 2p 4p 6p 8p 1s 3s')
    const { result } = scoreKeyedHand(singapore, junk, ctx)
    expect(result.valid).toBe(false)
    if (!result.valid) expect(result.reason).not.toBe('wrongTileCount')
  })
})

describe('the signed ledger', () => {
  const pay = (fromDiscarder: number | null, fromEachOther: number, winnerTotal: number) =>
    ({ fromDiscarder, fromEachOther, winnerTotal })

  it('shows four players and balances to zero on a self-draw', () => {
    const d = settleHand({
      playerCount: 4, winnerIndex: 3, pay: pay(null, 32, 96),
      win: 'selfDraw', discarderIndex: null,
    })
    expect(d).toEqual([-32, -32, -32, 96])
    expect(d.reduce((a, b) => a + b, 0)).toBe(0)
  })

  it('balances when the thrower pays double', () => {
    // The owner's own example: P1 -10, P2 -10, P3 -20, P4 +40.
    const d = settleHand({
      playerCount: 4, winnerIndex: 3, pay: pay(20, 10, 40),
      win: 'discard', discarderIndex: 2,
    })
    expect(d).toEqual([-10, -10, -20, 40])
    expect(d.reduce((a, b) => a + b, 0)).toBe(0)
  })

  it('balances when the thrower pays the lot and the others pay nothing', () => {
    const d = settleHand({
      playerCount: 4, winnerIndex: 0, pay: pay(96, 0, 96),
      win: 'discard', discarderIndex: 2,
    })
    expect(d).toEqual([96, 0, -96, 0])
    expect(d.reduce((a, b) => a + b, 0)).toBe(0)
  })

  it('folds instant payouts in and still balances', () => {
    const d = settleHand({
      playerCount: 4, winnerIndex: 1, pay: pay(null, 8, 24),
      win: 'selfDraw', discarderIndex: null,
      instants: [{ key: 'catAndRat', fromEachPlayer: 2, total: 6 }],
    })
    expect(d).toEqual([-10, 30, -10, -10])
    expect(d.reduce((a, b) => a + b, 0)).toBe(0)
  })

  it('cannot be made to invent money, whatever the engine hands it', () => {
    // Property check across the shapes a variant can actually produce.
    for (const winner of [0, 1, 2, 3]) {
      for (const disc of [0, 1, 2, 3]) {
        if (disc === winner) continue
        for (const [fd, fe] of [[20, 10], [96, 0], [48, 24], [0, 0]] as const) {
          const d = settleHand({
            playerCount: 4, winnerIndex: winner, pay: pay(fd, fe, 0),
            win: 'discard', discarderIndex: disc,
            instants: [{ key: 'x', fromEachPlayer: 3, total: 9 }],
          })
          expect(d.reduce((a, b) => a + b, 0), `winner ${winner} discarder ${disc}`).toBe(0)
          expect(d[winner]!).toBeGreaterThanOrEqual(0)
        }
      }
    }
  })

  it('sums a night into one signed figure per player', () => {
    const hands = [
      { handNumber: 1, round: 1, winnerIndex: 3, deltas: [-10, -10, -20, 40] },
      { handNumber: 2, round: 1, winnerIndex: 0, deltas: [96, -32, -32, -32] },
      { handNumber: 3, round: 1, winnerIndex: null, deltas: [0, 0, 0, 0] },
    ]
    const total = runningTotal(hands, 4)
    expect(total).toEqual([86, -42, -52, 8])
    expect(total.reduce((a, b) => a + b, 0)).toBe(0)
  })
})

describe('the round is a round', () => {
  it('is 1 to 4, never the deal counter', () => {
    let t = newTable(['A', 'B', 'C', 'D'])
    expect(roundNumber(t)).toBe(1)
    expect(dealInRound(t)).toBe(1)
    // Eight hands where the deal keeps passing: two full circuits, so the
    // prevailing wind moves twice and the round reads 3 — never 8.
    for (let i = 0; i < 8; i++) t = advanceTable(t, (t.dealerIndex + 1) % 4)
    expect(t.handNumber).toBe(9)
    expect(roundNumber(t)).toBe(3)
    expect(roundNumber(t)).toBeLessThanOrEqual(4)
  })

  it('wraps at four rather than counting on', () => {
    let t = newTable(['A', 'B', 'C', 'D'])
    for (let i = 0; i < 40; i++) t = advanceTable(t, (t.dealerIndex + 1) % 4)
    expect(roundNumber(t)).toBeGreaterThanOrEqual(1)
    expect(roundNumber(t)).toBeLessThanOrEqual(4)
  })

  it('keeps the deal number inside the round', () => {
    let t = newTable(['A', 'B', 'C', 'D'])
    const seen: number[] = []
    for (let i = 0; i < 5; i++) { seen.push(dealInRound(t)); t = advanceTable(t, (t.dealerIndex + 1) % 4) }
    expect(seen).toEqual([1, 2, 3, 4, 1])
  })
})

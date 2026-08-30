/**
 * The table session and the guided declare flow.
 *
 * These are the rules the UI leans on, so they are tested here rather than
 * inside a component: rotation and the greyed-out guidance both decide money.
 */

import { describe, expect, it } from 'vitest'
import { tally, type TileId } from '../../core/tiles'
import {
  advanceTable, buildMeld, composeHands, concealedKongs, concealedTarget,
  isDealer, legalNextTiles, newTable, playerOnWind, prevailingWind, seatWindOf,
  scoreKeyedHand, tilesRemaining, yourSeat,
} from './table'

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

  it('builds melds the engine accepts', async () => {
    const { singapore } = await import('./index')
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
    const { result, input } = scoreKeyedHand({
      concealed: ('3m 4m 5m 1p 1p 1p 1p 2s 3s 4s 6s 7s 8s 9m 9m'.split(' ')) as never,
      melds: [], bonus: ['S2'],
    }, ctx, { limit: 5 })
    expect(result.valid, result.valid ? '' : (result as { reason: string }).reason).toBe(true)
    expect(input.melds).toHaveLength(1)
    expect(input.melds![0]!.t).toBe('kong')
  })

  it('keeps the un-konged reading when it is the only winning one', () => {
    // Nine Gates holds four of a terminal and takes no meld at all.
    const { result, input } = scoreKeyedHand({
      concealed: '1m 1m 1m 1m 2m 3m 4m 5m 6m 7m 8m 9m 9m 9m'.split(' ') as never,
      melds: [], bonus: [],
    }, { seat: 'S', prevailing: 'E', win: 'discard', winningTile: '1m' }, { limit: 5 })
    expect(result.valid).toBe(true)
    if (result.valid) expect(result.patterns).toContain('nineGates')
    expect(input.melds).toHaveLength(0)
  })

  it('reports a rejection when no reading wins', () => {
    const { result } = scoreKeyedHand({
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
    const kongFirst = scoreKeyedHand(T('5s 5s 5s 5s 1m 1m 1m 2p 2p 2p 3s 3s 3s 9m 9m'), ctx)
    const kongLast = scoreKeyedHand(T('9m 9m 1m 1m 1m 2p 2p 2p 3s 3s 3s 5s 5s 5s 5s'), ctx)
    expect(kongFirst.result.valid).toBe(true)
    expect(kongLast.result.valid).toBe(true)
    if (kongFirst.result.valid && kongLast.result.valid) {
      expect(kongLast.result.totalTai).toBe(kongFirst.result.totalTai)
      expect([...kongLast.result.patterns].sort())
        .toEqual([...kongFirst.result.patterns].sort())
    }
  })
})

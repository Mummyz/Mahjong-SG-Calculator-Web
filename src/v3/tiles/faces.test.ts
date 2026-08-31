/**
 * The forty-six faces are the right forty-six faces.
 *
 * The Rules Critic's bar for Run 5 is that a tile LOOKS LIKE THE TILE IT IS:
 * one big coin for 一筒, a bird on 一索, the diagonal three, the slanted trio
 * over four on 七筒, the apex-up triangle of 三索, the lone topper on 七索,
 * nine dots in a three by three. That is checkable, so it is checked here and
 * not left to a reviewer's eye — an artwork regression is exactly the kind of
 * thing that survives a screenshot.
 *
 * Nothing here asserts a colour. Colour follows the scheme common to Chinese
 * sets and is a style decision; contrast.test.ts is what holds it to a bar.
 */

import { describe, expect, it } from 'vitest'
import { marks, renderText as render } from './render'
import { Face, BonusFace } from './Face'
import { BAMBOO, CHAR_NUMERAL, DOTS } from './layouts'
import { BAMBOO_INK, DOT_INK, bodyOf, bonusBodyOf } from './palette'
import { ANIMALS, FLOWERS, HONOURS, SEASONS, SUITS } from '../../engine/core/tiles'
import type { BonusId, TileId } from '../../engine/core/tiles'

/** Every tile a wall can hold, and every bonus tile either variant plays. */
const ALL_TILES: TileId[] = [
  ...SUITS.flatMap((s) => [1, 2, 3, 4, 5, 6, 7, 8, 9].map((r) => `${r}${s}`)),
  ...HONOURS,
]
const ALL_BONUS: BonusId[] = [...FLOWERS, ...SEASONS, ...ANIMALS]

const RANKS = [1, 2, 3, 4, 5, 6, 7, 8, 9] as const

describe('the count is the rank', () => {
  it.each(RANKS)('%i dots draws that many coins', (r) => {
    expect(DOTS[r]!.at).toHaveLength(r)
    expect(DOT_INK[r]).toHaveLength(r)
  })

  it.each(RANKS)('%i bamboo draws that many segments', (r) => {
    // 一索 is the bird, and a bird is not a segment.
    expect(BAMBOO[r]!).toHaveLength(r === 1 ? 0 : r)
    expect(BAMBOO_INK[r]).toHaveLength(r)
  })

  it('never runs a pip off the face', () => {
    for (const r of RANKS) {
      const { r: rad, at } = DOTS[r]!
      for (const p of at) {
        expect(p.cx - rad, `${r}p left edge`).toBeGreaterThanOrEqual(4)
        expect(p.cx + rad, `${r}p right edge`).toBeLessThanOrEqual(76)
        expect(p.cy - rad, `${r}p top edge`).toBeGreaterThanOrEqual(21)
        expect(p.cy + rad, `${r}p bottom edge`).toBeLessThanOrEqual(96)
      }
      for (const g of BAMBOO[r]!) {
        expect(g.cx - g.w, `${r}s left edge`).toBeGreaterThanOrEqual(4)
        expect(g.cx + g.w, `${r}s right edge`).toBeLessThanOrEqual(76)
        expect(g.cy - g.h / 2, `${r}s top edge`).toBeGreaterThanOrEqual(19)
        expect(g.cy + g.h / 2, `${r}s bottom edge`).toBeLessThanOrEqual(96)
      }
    }
  })

  it('never overlaps two bamboo segments enough to miscount them', () => {
    // The dots had this guard from the start and the bamboo did not, which is
    // how 八索 shipped four segments a single unit apart in a row.
    for (const r of RANKS) {
      const at = BAMBOO[r]!
      for (let i = 0; i < at.length; i++) {
        for (let j = i + 1; j < at.length; j++) {
          const a = at[i]!, b = at[j]!
          // A segment's widest part is its cap: w × 1.55, plus the rim.
          const dx = Math.abs(a.cx - b.cx) - (a.w * 1.55 + b.w * 1.55) / 2
          const dy = Math.abs(a.cy - b.cy) - (a.h + b.h) / 2
          expect(Math.max(dx, dy), `${r}s segments ${i} and ${j} are too close`)
            .toBeGreaterThan(2)
        }
      }
    }
  })

  it('never overlaps two coins enough to miscount them', () => {
    for (const r of RANKS) {
      const { r: rad, at } = DOTS[r]!
      for (let i = 0; i < at.length; i++) {
        for (let j = i + 1; j < at.length; j++) {
          const d = Math.hypot(at[i]!.cx - at[j]!.cx, at[i]!.cy - at[j]!.cy)
          // Touching is traditional on the slanted trio of 七筒; sinking more
          // than a fifth of a radius into each other is not.
          expect(d, `${r}p pips ${i} and ${j}`).toBeGreaterThan(rad * 1.8)
        }
      }
    }
  })
})

describe('the arrangements the sources fix', () => {
  const xs = (r: number) => [...new Set(DOTS[r]!.at.map((p) => p.cx))].sort((a, b) => a - b)
  const ys = (r: number) => [...new Set(DOTS[r]!.at.map((p) => p.cy))].sort((a, b) => a - b)

  it('一筒 is one large coin, centred', () => {
    expect(DOTS[1]!.at).toEqual([{ cx: 40, cy: 58 }])
    // Twice the radius of any other rank: 一筒 is a medallion, not a pip.
    expect(DOTS[1]!.r).toBeGreaterThan(DOTS[2]!.r * 1.4)
  })

  it('二筒 stacks two, one over the other', () => {
    expect(xs(2)).toEqual([40])
    expect(ys(2)).toHaveLength(2)
  })

  it('三筒 runs a diagonal, upper-left to lower-right', () => {
    const at = DOTS[3]!.at
    for (let i = 1; i < 3; i++) {
      expect(at[i]!.cx).toBeGreaterThan(at[i - 1]!.cx)
      expect(at[i]!.cy).toBeGreaterThan(at[i - 1]!.cy)
    }
  })

  it('四筒 is a square of four', () => {
    expect(xs(4)).toHaveLength(2)
    expect(ys(4)).toHaveLength(2)
  })

  it('五筒 is that square with a fifth in the middle', () => {
    const at = DOTS[5]!.at
    const mid = at.filter((p) => p.cx === 40)
    expect(mid).toHaveLength(1)
    expect(at.filter((p) => p.cx !== 40)).toHaveLength(4)
    // The centre is the red one, on every set that has a red one.
    expect(DOT_INK[5]![at.indexOf(mid[0]!)]).toBe('red')
  })

  it('六筒 is two columns of three', () => {
    expect(xs(6)).toHaveLength(2)
    expect(ys(6)).toHaveLength(3)
  })

  it('七筒 is a slanted trio over a square of four', () => {
    const at = DOTS[7]!.at
    const trio = at.slice(0, 3)
    for (let i = 1; i < 3; i++) {
      expect(trio[i]!.cx).toBeGreaterThan(trio[i - 1]!.cx)
      expect(trio[i]!.cy).toBeGreaterThan(trio[i - 1]!.cy)
    }
    const four = at.slice(3)
    expect([...new Set(four.map((p) => p.cx))]).toHaveLength(2)
    expect([...new Set(four.map((p) => p.cy))]).toHaveLength(2)
    // and the trio sits entirely above the square
    expect(Math.max(...trio.map((p) => p.cy))).toBeLessThan(Math.min(...four.map((p) => p.cy)))
  })

  it('八筒 is two columns of four', () => {
    expect(xs(8)).toHaveLength(2)
    expect(ys(8)).toHaveLength(4)
  })

  it('九筒 is three by three', () => {
    expect(xs(9)).toHaveLength(3)
    expect(ys(9)).toHaveLength(3)
  })

  it('一索 is the bird', () => {
    expect(BAMBOO[1]).toEqual([])
    const svg = render(Face({ id: '1s' }))
    // The beak, the eye and the tail: a drawing, not a segment.
    expect(svg).toMatch(/gy-gold/)
    expect(svg).toMatch(/gy-ink-dp/)
  })

  it('三索 is one over two, apex up', () => {
    const at = BAMBOO[3]!
    expect(at[0]!.cx).toBe(40)
    expect(at[1]!.cy).toBeGreaterThan(at[0]!.cy)
    expect(at[2]!.cy).toBe(at[1]!.cy)
    expect(at[1]!.cx).toBeLessThan(at[2]!.cx)
  })

  it('五索 is four around a red centre', () => {
    const at = BAMBOO[5]!
    const mid = at.findIndex((p) => p.cx === 40)
    expect(mid).toBeGreaterThanOrEqual(0)
    expect(BAMBOO_INK[5]![mid]).toBe('red')
  })

  it('七索 tops two rows of three with a single red', () => {
    const at = BAMBOO[7]!
    expect(at[0]!.cx).toBe(40)
    expect(BAMBOO_INK[7]![0]).toBe('red')
    expect(at.slice(1).every((p) => p.cy > at[0]!.cy)).toBe(true)
    expect([...new Set(at.slice(1).map((p) => p.cy))]).toHaveLength(2)
  })

  it('九索 runs red down the middle column', () => {
    const at = BAMBOO[9]!
    at.forEach((p, i) => {
      expect(BAMBOO_INK[9]![i], `segment at x=${p.cx}`).toBe(p.cx === 40 ? 'red' : 'green')
    })
  })

  it('carves the right CJK numeral over 萬 on every character tile', () => {
    for (const r of RANKS) {
      const svg = render(Face({ id: `${r}m` as TileId }))
      expect(svg).toContain(CHAR_NUMERAL[r]!)
      expect(svg).toContain('萬')
    }
  })
})

describe('a shadow is never the only colour on a mark', () => {
  /**
   * A --gy-*-dp token is the SHADED SIDE of an extrusion. contrast.test.ts
   * audits it as one half of a pair, so a mark painted in the deep shade
   * ALONE slips past: the centipede's legs measured 1.30:1 on the dark mint
   * body and the cat's whiskers 1.69:1, while that test stayed green.
   *
   * The only legitimate deep-only element is the underside layer of a puff,
   * which is the same shape translated down — so that is the exemption, and
   * it is the only one.
   */
  const DEEP = /^var\(--gy-([a-z]+)-dp\)$/

  const audit = (svg: unknown, label: string): string[] =>
    marks(svg)
      .filter((m) => {
        const paints = [m.fill, m.stroke].filter((c): c is string => !!c && c !== 'none')
        const deep = paints.map((c) => DEEP.exec(c)?.[1]).filter((h): h is string => !!h)
        if (deep.length === 0 || deep.length !== paints.length) return false
        // --gy-ink is the EYE, and an eye is drawn on an animal's face rather
        // than on the tile body. Its contrast is with the fur behind it, which
        // is a base shade, so the pair rule does not describe it.
        if (deep.every((h) => h === 'ink')) return false
        // The underside of a puff: the same shape, moved down, with the lit
        // copy drawn over it. Legitimate either way it is expressed — as a
        // translate, or as a sibling in the same group painting the base.
        if ((m.transform ?? '').includes('translate')) return false
        return !deep.some((h) => m.group.has(`var(--gy-${h})`))
      })
      .map((m) => `${label}: <${m.tag} fill=${m.fill} stroke=${m.stroke}>`)

  it.each(ALL_TILES)('%s', (id) => {
    expect(audit(Face({ id }), id)).toEqual([])
  })

  it.each(ALL_BONUS)('%s', (id) => {
    expect(audit(BonusFace({ id: id as BonusId }), id)).toEqual([])
  })
})

describe('every face in the set draws', () => {
  it.each(ALL_TILES)('%s', (id) => {
    const svg = render(Face({ id }))
    expect(svg.length).toBeGreaterThan(80)
    // Never an empty group, and never a raw hex where a token belongs: the
    // artwork is themed, and a literal colour would survive into dark mode.
    expect(svg).toMatch(/var\(--gy-/)
  })

  it.each(ALL_BONUS)('%s', (id) => {
    const svg = render(BonusFace({ id: id as BonusId }))
    expect(svg.length).toBeGreaterThan(80)
    expect(svg).toMatch(/var\(--gy-/)
  })

  it('carves the right glyph on every honour and every bonus tile', () => {
    const WANT: Record<string, string> = {
      E: '東', S: '南', W: '西', N: '北', C: '中', F: '發',
    }
    for (const [id, ch] of Object.entries(WANT)) {
      expect(render(Face({ id: id as TileId }))).toContain(ch)
    }
    // 白 is the exception the tile itself makes: a frame, and no glyph at all.
    const white = render(Face({ id: 'P' }))
    expect(white).not.toContain('白')
    expect(white).toMatch(/<rect/)

    const BONUS: Record<string, string> = {
      F1: '梅', F2: '蘭', F3: '菊', F4: '竹', S1: '春', S2: '夏', S3: '秋', S4: '冬',
    }
    for (const [id, ch] of Object.entries(BONUS)) {
      expect(render(BonusFace({ id: id as BonusId }))).toContain(ch)
    }
    // The animals are pictures. A cat that fell back to 貓 would be a bug.
    for (const id of ['cat', 'rat', 'rooster', 'centipede'] as BonusId[]) {
      const svg = render(BonusFace({ id }))
      expect(svg).not.toMatch(/[貓鼠雞蜈]/)
      expect(svg).toMatch(/<circle|<ellipse|<path/)
    }
  })

  it('gives every tile in both sets a body wash', () => {
    for (const id of ALL_TILES) expect(bodyOf(id)).toBeTruthy()
    for (const id of ALL_BONUS) expect(bonusBodyOf(id as BonusId)).toBeTruthy()
  })
})

/**
 * Where the pips go.
 *
 * TRADITIONAL ARRANGEMENT IS THE BLOCKING PART of these faces, so it lives
 * here as data — coordinates in the 80×100 face box — and faces.test.ts walks
 * it. A layout is wrong if the count is not the rank, if two pips overlap
 * enough to be miscounted, or if the shape is not the one the tile has had
 * for a century: one big coin for 一筒, the diagonal three, the slanted trio
 * over four on 七筒, the apex-up triangle of 三索, the lone red topper on
 * 七索, the red middle column of 九索.
 */

export interface Pip { cx: number; cy: number }

/** Dot pips, rank by rank, plus the radius that rank is drawn at. */
export const DOTS: Record<number, { r: number; at: Pip[] }> = {
  1: { r: 18, at: [{ cx: 40, cy: 58 }] },
  2: { r: 12, at: [{ cx: 40, cy: 40 }, { cx: 40, cy: 76 }] },
  // the diagonal, upper-left to lower-right
  3: { r: 10.5, at: [{ cx: 21, cy: 38 }, { cx: 40, cy: 58 }, { cx: 59, cy: 78 }] },
  4: { r: 12, at: [{ cx: 25, cy: 40 }, { cx: 55, cy: 40 },
                   { cx: 25, cy: 76 }, { cx: 55, cy: 76 }] },
  // four corners around a red centre
  5: { r: 10.5, at: [{ cx: 24, cy: 38 }, { cx: 56, cy: 38 }, { cx: 40, cy: 58 },
                     { cx: 24, cy: 78 }, { cx: 56, cy: 78 }] },
  6: { r: 9.5, at: [{ cx: 25, cy: 33 }, { cx: 55, cy: 33 }, { cx: 25, cy: 58 },
                    { cx: 55, cy: 58 }, { cx: 25, cy: 83 }, { cx: 55, cy: 83 }] },
  // the slanted trio over a square of four
  7: { r: 8, at: [{ cx: 20, cy: 33 }, { cx: 36, cy: 39 }, { cx: 52, cy: 45 },
                  { cx: 26, cy: 68 }, { cx: 54, cy: 68 },
                  { cx: 26, cy: 86 }, { cx: 54, cy: 86 }] },
  8: { r: 8, at: [{ cx: 26, cy: 29 }, { cx: 54, cy: 29 }, { cx: 26, cy: 48 },
                  { cx: 54, cy: 48 }, { cx: 26, cy: 67 }, { cx: 54, cy: 67 },
                  { cx: 26, cy: 86 }, { cx: 54, cy: 86 }] },
  9: { r: 8.5, at: [{ cx: 21, cy: 34 }, { cx: 40, cy: 34 }, { cx: 59, cy: 34 },
                    { cx: 21, cy: 58 }, { cx: 40, cy: 58 }, { cx: 59, cy: 58 },
                    { cx: 21, cy: 82 }, { cx: 40, cy: 82 }, { cx: 59, cy: 82 }] },
}

export interface Segment extends Pip { h: number; w: number }

/** Bamboo segments. Rank 1 is the bird and has no segments at all. */
export const BAMBOO: Record<number, Segment[]> = {
  1: [],
  2: [{ cx: 40, cy: 40, h: 26, w: 10 }, { cx: 40, cy: 76, h: 26, w: 10 }],
  // apex up: one over two
  3: [{ cx: 40, cy: 33, h: 24, w: 10 },
      { cx: 25, cy: 74, h: 24, w: 10 }, { cx: 55, cy: 74, h: 24, w: 10 }],
  4: [{ cx: 25, cy: 40, h: 26, w: 10 }, { cx: 55, cy: 40, h: 26, w: 10 },
      { cx: 25, cy: 78, h: 26, w: 10 }, { cx: 55, cy: 78, h: 26, w: 10 }],
  // four corners around the red centre
  5: [{ cx: 24, cy: 34, h: 20, w: 9.5 }, { cx: 56, cy: 34, h: 20, w: 9.5 },
      { cx: 40, cy: 58, h: 20, w: 9.5 },
      { cx: 24, cy: 82, h: 20, w: 9.5 }, { cx: 56, cy: 82, h: 20, w: 9.5 }],
  6: [{ cx: 20, cy: 40, h: 26, w: 9 }, { cx: 40, cy: 40, h: 26, w: 9 },
      { cx: 60, cy: 40, h: 26, w: 9 }, { cx: 20, cy: 78, h: 26, w: 9 },
      { cx: 40, cy: 78, h: 26, w: 9 }, { cx: 60, cy: 78, h: 26, w: 9 }],
  // the lone red topper over two rows of three
  7: [{ cx: 40, cy: 30, h: 20, w: 9 },
      { cx: 20, cy: 60, h: 20, w: 9 }, { cx: 40, cy: 60, h: 20, w: 9 },
      { cx: 60, cy: 60, h: 20, w: 9 }, { cx: 20, cy: 84, h: 20, w: 9 },
      { cx: 40, cy: 84, h: 20, w: 9 }, { cx: 60, cy: 84, h: 20, w: 9 }],
  // w 7.4, not 8: a cap is w×1.55 wide, and at w 8 the four in a row cleared
  // each other by a single unit — under a pixel on a 360px screen.
  8: [{ cx: 18, cy: 40, h: 26, w: 7.4 }, { cx: 32.7, cy: 40, h: 26, w: 7.4 },
      { cx: 47.3, cy: 40, h: 26, w: 7.4 }, { cx: 62, cy: 40, h: 26, w: 7.4 },
      { cx: 18, cy: 78, h: 26, w: 7.4 }, { cx: 32.7, cy: 78, h: 26, w: 7.4 },
      { cx: 47.3, cy: 78, h: 26, w: 7.4 }, { cx: 62, cy: 78, h: 26, w: 7.4 }],
  // three by three, red down the middle
  9: [{ cx: 20, cy: 32, h: 20, w: 8.5 }, { cx: 40, cy: 32, h: 20, w: 8.5 },
      { cx: 60, cy: 32, h: 20, w: 8.5 }, { cx: 20, cy: 58, h: 20, w: 8.5 },
      { cx: 40, cy: 58, h: 20, w: 8.5 }, { cx: 60, cy: 58, h: 20, w: 8.5 },
      { cx: 20, cy: 84, h: 20, w: 8.5 }, { cx: 40, cy: 84, h: 20, w: 8.5 },
      { cx: 60, cy: 84, h: 20, w: 8.5 }],
}

/** The CJK numeral carved above 萬 on a character tile. */
export const CHAR_NUMERAL: Record<number, string> = {
  1: '一', 2: '二', 3: '三', 4: '四', 5: '五',
  6: '六', 7: '七', 8: '八', 9: '九',
}

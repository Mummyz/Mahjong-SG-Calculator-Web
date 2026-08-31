/**
 * Which pastel body and which puff colour every tile face is drawn in.
 *
 * This file is DATA ONLY — no rendering — so the correctness tests can walk
 * it, and so the contrast audit can enumerate every (ink, body) pairing that
 * actually occurs rather than every pairing that could.
 *
 * The rule the reference sheet uses, and we keep: THE BODY IS A PALE WASH OF
 * THE GLYPH'S OWN HUE. A green 東 sits on mint, a red 南 on peach, a purple
 * 西 on lavender. It reads as a designed set rather than as random confetti,
 * and it gives the suit a fourth carrier at arm's length, where the pips are
 * too small to count.
 */

import type { BonusId, TileId } from '../../engine/core/tiles'

/** The pale washes a tile body can be. Paired hi/face stops live in tokens.css. */
export type Body = 'cream' | 'mint' | 'peach' | 'lav' | 'sky' | 'blush'

/** The puffed inks. Each has a base and a deep shade; see tokens.css. */
export type Hue =
  | 'red' | 'green' | 'blue' | 'purple' | 'gold' | 'pink' | 'orange' | 'teal'
  | 'cream' | 'ink'

/** Every hue the art can ask for, so the contrast audit can be exhaustive. */
export const HUES: Hue[] = [
  'red', 'green', 'blue', 'purple', 'gold', 'pink', 'orange', 'teal', 'cream', 'ink',
]
export const BODIES: Body[] = ['cream', 'mint', 'peach', 'lav', 'sky', 'blush']

/** The body wash for a wall tile. */
export function bodyOf(id: TileId): Body {
  if (id.length === 2) {
    const s = id[1]!
    return s === 'p' ? 'sky' : s === 's' ? 'mint' : 'cream'
  }
  const H: Record<string, Body> = {
    E: 'mint', S: 'peach', W: 'lav', N: 'sky', C: 'blush', F: 'mint', P: 'sky',
  }
  return H[id] ?? 'cream'
}

/** The body wash for a bonus tile. */
export function bonusBodyOf(id: BonusId): Body {
  const B: Record<BonusId, Body> = {
    F1: 'blush', F2: 'lav', F3: 'cream', F4: 'mint',
    S1: 'mint', S2: 'cream', S3: 'peach', S4: 'sky',
    cat: 'peach', rat: 'lav', rooster: 'sky', centipede: 'mint',
  }
  return B[id]
}

/**
 * The pip colours, rank by rank.
 *
 * ARRANGEMENT is certified against the sources and is what the Rules Critic
 * gates on; COLOUR follows the scheme common to Chinese sets — dots run
 * blue/green with red at the centre and on the heavy ranks, bamboo runs green
 * with the traditional red singles on 5, 7 and the middle column of 9.
 *
 * One entry per pip, in the same order the layout emits them.
 */
export const DOT_INK: Record<number, Hue[]> = {
  1: ['blue'],
  2: ['green', 'blue'],
  3: ['blue', 'green', 'red'],
  4: ['green', 'green', 'blue', 'blue'],
  5: ['green', 'blue', 'red', 'blue', 'green'],
  6: ['green', 'green', 'red', 'red', 'red', 'red'],
  7: ['green', 'green', 'green', 'red', 'red', 'red', 'red'],
  8: ['blue', 'blue', 'blue', 'blue', 'blue', 'blue', 'blue', 'blue'],
  9: ['green', 'green', 'green', 'red', 'red', 'red', 'blue', 'blue', 'blue'],
}

export const BAMBOO_INK: Record<number, Hue[]> = {
  1: ['green'],
  2: ['green', 'green'],
  3: ['green', 'green', 'green'],
  4: ['green', 'green', 'green', 'green'],
  5: ['green', 'green', 'red', 'green', 'green'],
  6: ['green', 'green', 'green', 'green', 'green', 'green'],
  7: ['red', 'green', 'green', 'green', 'green', 'green', 'green'],
  8: ['green', 'green', 'green', 'green', 'green', 'green', 'green', 'green'],
  9: ['green', 'red', 'green', 'green', 'red', 'green', 'green', 'red', 'green'],
}

/** The ink a suited tile's corner stamp is drawn in. */
export const SUIT_INK: Record<string, Hue> = { m: 'red', p: 'blue', s: 'green' }

/** The ink each honour glyph is carved in, following the reference sheet. */
export const HONOUR_INK: Record<string, Hue> = {
  E: 'green', S: 'red', W: 'purple', N: 'blue', C: 'red', F: 'green', P: 'blue',
}

export const BONUS_INK: Record<BonusId, Hue> = {
  F1: 'red', F2: 'purple', F3: 'gold', F4: 'green',
  S1: 'green', S2: 'gold', S3: 'orange', S4: 'blue',
  cat: 'orange', rat: 'purple', rooster: 'red', centipede: 'green',
}

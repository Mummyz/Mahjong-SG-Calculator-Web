/**
 * Every mark on every tile has a boundary, in both themes.
 *
 * A puffed mark is two layers: a BASE body and a DEEP rim. Which one gives
 * the shape its edge against the tile flips between themes — in light the rim
 * is the dark one, in dark the base is the bright one — so the bar is that AT
 * LEAST ONE of them clears 4.5:1 against BOTH stops of the body's gradient.
 *
 * The eight hues audited here are the IDENTIFYING inks: the ones that say
 * which tile this is. --gy-cream and --gy-ink are interior detail — the pale
 * band inside a coin, an animal's pupil — always enclosed by a rim that is
 * itself audited, so they are decoration under 1.4.11 and not listed.
 */

import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { BODIES } from './palette'

const tokens = readFileSync(
  fileURLToPath(new URL('../tokens.css', import.meta.url)), 'utf8',
).replace(/\/\*[\s\S]*?\*\//g, '')

const blocks = [...tokens.matchAll(/:root[^{]*\{([^}]*)\}/g)].map((m) => m[1]!)
const hexes = (b: string) =>
  Object.fromEntries([...b.matchAll(/(--[a-z0-9-]+)\s*:\s*(#[0-9A-Fa-f]{6})/g)]
    .map((m) => [m[1]!, m[2]!]))

const LIGHT = hexes(blocks[0]!)
/** The dark stamp inherits everything the media guard does not redefine. */
const DARK = { ...LIGHT, ...hexes(blocks[1]!) }

const lum = (hex: string): number => {
  const c = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
    .map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4))
  return 0.2126 * c[0]! + 0.7152 * c[1]! + 0.0722 * c[2]!
}
const ratio = (a: string, b: string): number => {
  const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p) as [number, number]
  return (x + 0.05) / (y + 0.05)
}

const INK = ['red', 'green', 'blue', 'purple', 'gold', 'pink', 'orange', 'teal']

describe.each([['light', LIGHT], ['dark', DARK]] as const)('%s', (_name, T) => {
  it('gives every identifying ink a 4.5:1 edge on every body it can land on', () => {
    const fails: string[] = []
    for (const hue of INK) {
      for (const body of BODIES) {
        for (const stop of [`--mj-p-${body}`, `--mj-p-${body}-hi`]) {
          const bg = T[stop]
          expect(bg, `${stop} is undefined`).toBeDefined()
          const best = Math.max(
            ratio(T[`--gy-${hue}`]!, bg!), ratio(T[`--gy-${hue}-dp`]!, bg!),
          )
          if (best < 4.5) fails.push(`${hue} on ${stop} → ${best.toFixed(2)}:1`)
        }
      }
    }
    expect(fails).toEqual([])
  })

  it('gives the corner stamp a 4.5:1 TEXT contrast on every body', () => {
    // The stamp is the rank numeral and the suit mark: real text, at the real
    // text bar. It is a separate token from the rim because the readable layer
    // flips between themes, and in dark the deep rim was invisible.
    const fails: string[] = []
    for (const hue of INK) {
      for (const body of BODIES) {
        for (const stop of [`--mj-p-${body}`, `--mj-p-${body}-hi`]) {
          const r = ratio(T[`--gy-${hue}-tx`]!, T[stop]!)
          if (r < 4.5) fails.push(`${hue} stamp on ${stop} → ${r.toFixed(2)}:1`)
        }
      }
    }
    expect(fails).toEqual([])
  })

  it('keeps the printed caption above AA on every body', () => {
    // The caption is the words under a wind, a season or an animal, and on a
    // dark or missing CJK font it is the ONLY thing naming the tile.
    for (const body of BODIES) {
      for (const stop of [`--mj-p-${body}`, `--mj-p-${body}-hi`]) {
        expect(ratio(T['--mj-tile-cap']!, T[stop]!), `caption on ${stop}`)
          .toBeGreaterThanOrEqual(4.5)
      }
    }
  })

  it('keeps the base and the deep shade far enough apart to read as depth', () => {
    // Under 1.6:1 the rim stops being a shaded side and becomes a smudge, and
    // the mark goes flat — which is the look the owner rejected.
    for (const hue of INK) {
      expect(ratio(T[`--gy-${hue}`]!, T[`--gy-${hue}-dp`]!),
        `--gy-${hue} vs its deep shade`).toBeGreaterThan(1.6)
    }
  })
})

it('defines every puff and body token in all three theme blocks', () => {
  const names = blocks.map((b) => new Set(Object.keys(hexes(b))))
  const want = [...INK.flatMap((h) => [`--gy-${h}`, `--gy-${h}-dp`, `--gy-${h}-tx`]),
    ...BODIES.flatMap((b) => [`--mj-p-${b}`, `--mj-p-${b}-hi`])]
  for (const n of want) expect(names[0]!.has(n), `${n} is never born on :root`).toBe(true)
  // The media guard and the attribute stamp must stay identical to each other.
  expect([...names[1]!].sort()).toEqual([...names[2]!].sort())
})

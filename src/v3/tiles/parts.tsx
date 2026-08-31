/**
 * The vocabulary every tile face is drawn from.
 *
 * THE PUFF. A carved mark on these tiles is a soft extrusion, never a flat
 * silhouette: an underside in the deep shade, a body in the base shade rimmed
 * by the deep one, and a gloss that fades out before the middle. Three layers,
 * always in that order, so the mark has a lit side and a shaded side and reads
 * as an object sitting ON the tile rather than a sticker printed on it.
 *
 * THE ACCESSIBILITY CONTRACT, and it is why the rim exists. The reference
 * artwork has no outlines at all; a pale gold chrysanthemum on a cream tile
 * would be a 2:1 smudge. The deep shade is a darker tone of the mark's OWN
 * hue, so it reads as the shaded side of the extrusion — the reference's own
 * language — while giving the shape a boundary that clears 4.5:1. Which of
 * the two layers carries that boundary flips between themes, and
 * contrast.test.ts checks both.
 */

import type { Hue } from './palette'

const ink = (h: Hue) => `var(--gy-${h})`
const deep = (h: Hue) => `var(--gy-${h}-dp)`

/** The gloss, as a mask: full strength at the top, gone by 45% down. */
const GLOSS = 'url(#gyTop)'

/**
 * A dot-suit coin: a coloured ring, a pale band and a gold pip, which is what
 * a 筒 has been for four hundred years.
 */
export function Coin({ cx, cy, r, hue }: { cx: number; cy: number; r: number; hue: Hue }) {
  return (
    <g>
      <circle cx={cx} cy={cy + r * 0.1} r={r} fill={deep(hue)} />
      <circle cx={cx} cy={cy} r={r} fill={ink(hue)} stroke={deep(hue)} stroke-width={r * 0.13} />
      <circle cx={cx} cy={cy} r={r * 0.54} fill="var(--gy-cream)"
        stroke={deep(hue)} stroke-width={r * 0.1} />
      <circle cx={cx} cy={cy} r={r * 0.22} fill="var(--gy-gold)"
        stroke="var(--gy-gold-dp)" stroke-width={r * 0.07} />
      <ellipse cx={cx - r * 0.34} cy={cy - r * 0.44} rx={r * 0.36} ry={r * 0.22}
        fill="#FFFFFF" opacity=".55" transform={`rotate(-32 ${cx - r * 0.34} ${cy - r * 0.44})`} />
    </g>
  )
}

/**
 * A bamboo segment: two caps and a shaft with a node, the dumbbell every
 * 索 tile is built from.
 */
export function Stick({ cx, cy, h, w, hue }: {
  cx: number; cy: number; h: number; w: number; hue: Hue
}) {
  const top = cy - h / 2
  const cap = w * 1.55
  const s = { fill: ink(hue), stroke: deep(hue), 'stroke-width': w * 0.16 }
  return (
    <g>
      <g transform={`translate(0 ${h * 0.06})`} fill={deep(hue)}>
        <rect x={cx - w / 2} y={top + 3} width={w} height={h - 6} rx={w / 2} />
        <rect x={cx - cap / 2} y={top} width={cap} height={4.4} rx={2.2} />
        <rect x={cx - cap / 2} y={top + h - 4.4} width={cap} height={4.4} rx={2.2} />
      </g>
      <rect x={cx - w / 2} y={top + 3} width={w} height={h - 6} rx={w / 2} {...s} />
      <rect x={cx - cap / 2} y={top} width={cap} height={4.4} rx={2.2} {...s} />
      <rect x={cx - cap / 2} y={top + h - 4.4} width={cap} height={4.4} rx={2.2} {...s} />
      <rect x={cx - w * 0.6} y={cy - 1.4} width={w * 1.2} height={2.8} rx={1.4}
        fill={deep(hue)} />
      <rect x={cx - w * 0.3} y={top + 6} width={w * 0.26} height={h - 12} rx={w * 0.13}
        fill="#FFFFFF" opacity=".5" />
    </g>
  )
}

/**
 * A CJK glyph, puffed.
 *
 * Run 5 subset-loads Noto Sans TC for exactly these characters, because the
 * glyph is now the FACE of twenty-five tiles rather than a 17px mark beside
 * a numeral — see v3/index.html and tiles/subset.test.ts. It is still placed
 * by anchor and baseline rather than by measured metrics, so the system
 * fallback lands in the same place.
 *
 * At FULL size a wind, dragon, flower or season also carries a written
 * caption. A mini in the tray does NOT — there is no room — so at that size
 * the honours lean on the glyph and on their body wash. That is the reason
 * the subset exists.
 */
export function Glyph({ ch, x, y, size, hue, weight = 700 }: {
  ch: string; x: number; y: number; size: number; hue: Hue; weight?: number
}) {
  const base = {
    x, 'font-size': size, 'font-weight': weight,
    'font-family': 'var(--f-cjk)', 'text-anchor': 'middle' as const,
  }
  return (
    <g>
      <text {...base} y={y + size * 0.05} fill={deep(hue)} stroke={deep(hue)}
        stroke-width={size * 0.1} stroke-linejoin="round" paint-order="stroke">{ch}</text>
      <text {...base} y={y} fill={ink(hue)} stroke={deep(hue)}
        stroke-width={size * 0.075} stroke-linejoin="round" paint-order="stroke">{ch}</text>
      <text {...base} y={y} fill="#FFFFFF" opacity=".4" mask={GLOSS}>{ch}</text>
    </g>
  )
}

/** A puffed path — the shape language for petals, leaves, flames and fur. */
export function Puff({ d, hue, w = 0 }: { d: string; hue: Hue; w?: number }) {
  const stroke = { stroke: deep(hue), 'stroke-linecap': 'round' as const,
    'stroke-linejoin': 'round' as const }
  return w > 0 ? (
    <g fill="none">
      <path d={d} {...stroke} stroke-width={w + 2.2} transform="translate(0 1.1)" />
      <path d={d} {...stroke} stroke-width={w + 2.2} />
      <path d={d} stroke={ink(hue)} stroke-width={w} stroke-linecap="round"
        stroke-linejoin="round" />
    </g>
  ) : (
    <g>
      <path d={d} fill={deep(hue)} transform="translate(0 1.2)" />
      <path d={d} fill={ink(hue)} {...stroke} stroke-width="1.5" />
      <path d={d} fill="#FFFFFF" opacity=".38" mask={GLOSS} />
    </g>
  )
}

/**
 * The corner stamp: the rank as an Arabic numeral, and — on the two suits
 * whose face carries no CJK of its own — the suit's own mark opposite it.
 *
 * This is the third encoding of the suit, and it is the one that survives at
 * 44px in the tray where nine pips are too small to count. 萬 tiles skip the
 * mark because their face IS a 40px 萬.
 */
export function Stamp({ rank, mark, hue, big }: {
  rank: number | string; mark?: string; hue: Hue; big?: boolean
}) {
  // The enlarged stamp is for tiles drawn small, and at baseline 24 its ink
  // ran into 九索's top row, whose segments start at y=22. It sits higher.
  const s = big ? 21 : 17
  return (
    <g>
      <text x="9" y={big ? 21 : 20} font-size={s} font-weight="600"
        font-family="var(--f-display)" fill={`var(--gy-${hue}-tx)`}
        style="font-variant-numeric:tabular-nums">{rank}</text>
      {mark && (
        <text x="71" y={big ? 20 : 18.5} font-size={big ? 14 : 12} font-weight="700"
          font-family="var(--f-cjk)" text-anchor="end"
          fill={`var(--gy-${hue}-tx)`}>{mark}</text>
      )}
    </g>
  )
}

/** The little swoosh-and-sparkle the reference sheet sets under every wind. */
export function Flourish({ y, hue }: { y: number; hue: Hue }) {
  return (
    <g opacity=".9">
      <Puff d={`M26 ${y} q6 -5 11 0 q5 5 10 -1`} hue={hue} w={2.6} />
      <path d={`M55 ${y - 5} l1.9 4.2 l4.2 1.9 l-4.2 1.9 l-1.9 4.2 l-1.9 -4.2 l-4.2 -1.9 l4.2 -1.9 Z`}
        fill={ink(hue)} stroke={deep(hue)} stroke-width="1.2" stroke-linejoin="round" />
    </g>
  )
}

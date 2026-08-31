/**
 * The forty-six faces.
 *
 * Every face is vector, token-coloured and drawn in the same 80×100 box as
 * every other, so a tile is legible at 44px in the tray and at 76px in the
 * wall without a second set of artwork. The style target is the owner's
 * reference sheet: a pastel body, and marks that sit on it as soft puffed
 * extrusions rather than as flat print.
 *
 * WHAT IS DRAWN HERE IS CONTENT, NOT STATE. Selection, focus, taking, being
 * needed and being spent are all painted by tile.css on the element AROUND
 * this artwork. Nothing in this file ever changes because of what the player
 * has done — which is the correctness law, and the reason a suit encoding
 * cannot be collapsed by a state.
 */

import { rankOf, suitOf, type BonusId, type TileId } from '../../engine/core/tiles'
import { Coin, Flourish, Glyph, Puff, Stamp, Stick } from './parts'
import { BAMBOO, CHAR_NUMERAL, DOTS } from './layouts'
import {
  BAMBOO_INK, BONUS_INK, DOT_INK, HONOUR_INK, SUIT_INK,
  bodyOf, bonusBodyOf, type Hue,
} from './palette'

const SUIT_MARK: Record<string, string> = { m: '萬', p: '筒', s: '索' }
const HONOUR_GLYPH: Record<string, string> = {
  E: '東', S: '南', W: '西', N: '北', C: '中', F: '發', P: '白',
}
const BONUS_GLYPH: Record<BonusId, string> = {
  F1: '梅', F2: '蘭', F3: '菊', F4: '竹',
  S1: '春', S2: '夏', S3: '秋', S4: '冬',
  cat: '貓', rat: '鼠', rooster: '雞', centipede: '蜈',
}

/** Petals fanned evenly around a centre. */
function petals(
  n: number, cx: number, cy: number, rx: number, ry: number, reach: number, hue: Hue,
) {
  return Array.from({ length: n }, (_, i) => {
    const a = (360 / n) * i - 90
    const r = (a * Math.PI) / 180
    const px = cx + Math.cos(r) * reach
    const py = cy + Math.sin(r) * reach
    return (
      <g key={i} transform={`rotate(${a + 90} ${px} ${py})`}>
        <ellipse cx={px} cy={py + 1.2} rx={rx} ry={ry} fill={`var(--gy-${hue}-dp)`} />
        <ellipse cx={px} cy={py} rx={rx} ry={ry} fill={`var(--gy-${hue})`}
          stroke={`var(--gy-${hue}-dp)`} stroke-width="1.3" />
      </g>
    )
  })
}

/** 一索 is a bird, and has been since long before anybody counted fan. */
function Bird() {
  return (
    <g>
      <Puff d="M30 74 L11 88" hue="green" w={4} />
      <Puff d="M30 70 L9 79" hue="green" w={4} />
      <Puff d="M31 78 L15 93" hue="red" w={4} />
      <Puff d="M38 30 q2 -9 9 -6" hue="red" w={3.2} />
      <g>
        <ellipse cx="43" cy="67" rx="16" ry="18" fill="var(--gy-green-dp)" />
        <ellipse cx="43" cy="65.6" rx="16" ry="18" fill="var(--gy-green)"
          stroke="var(--gy-green-dp)" stroke-width="1.6" />
        <ellipse cx="43" cy="72" rx="10" ry="10" fill="var(--gy-cream)"
          stroke="var(--gy-green-dp)" stroke-width="1.1" />
      </g>
      <Puff d="M44 58 q14 5 9 19 q-9 -3 -9 -19 Z" hue="red" />
      <g>
        <circle cx="43" cy="41" r="12.5" fill="var(--gy-green-dp)" />
        <circle cx="43" cy="39.8" r="12.5" fill="var(--gy-green)"
          stroke="var(--gy-green-dp)" stroke-width="1.6" />
      </g>
      <path d="M54 37 L66 41.5 L54 46 Z" fill="var(--gy-gold)"
        stroke="var(--gy-gold-dp)" stroke-width="1.3" stroke-linejoin="round" />
      <circle cx="47.5" cy="36.5" r="3" fill="var(--gy-ink-dp)" />
      <circle cx="46.4" cy="35.4" r="1" fill="#FFFFFF" />
      <ellipse cx="37" cy="34" rx="4" ry="2.6" fill="#FFFFFF" opacity=".45"
        transform="rotate(-28 37 34)" />
    </g>
  )
}

/** 白 has no glyph. The face is the frame, which is the whole point of it. */
function WhiteFrame() {
  return (
    <g>
      <rect x="19" y="25" width="42" height="50" rx="9" fill="none"
        stroke="var(--gy-blue-dp)" stroke-width="8" transform="translate(0 1.4)" />
      <rect x="19" y="24" width="42" height="50" rx="9" fill="none"
        stroke="var(--gy-blue-dp)" stroke-width="8" />
      <rect x="19" y="24" width="42" height="50" rx="9" fill="none"
        stroke="var(--gy-blue)" stroke-width="5" />
      <g fill="none" stroke="var(--gy-blue)" stroke-width="3" stroke-linecap="round">
        <path d="M26 32 q0 -5 5 -5" />
        <path d="M54 32 q0 -5 -5 -5" />
        <path d="M26 66 q0 5 5 5" />
        <path d="M54 66 q0 5 -5 5" />
      </g>
      {/* on the frame's top bar, which is what is catching the light */}
      <rect x="26" y="21.5" width="17" height="5" rx="2.5" fill="#FFFFFF" opacity=".45" />
    </g>
  )
}

const MOTIF: Record<string, () => preact.JSX.Element> = {
  // 春 — a shoot
  S1: () => (
    <g>
      <Puff d="M76 58 L76 44" hue="green" w={3} />
      <Puff d="M76 47 q-11 -3 -11 -11 q11 -1 11 11 Z" hue="green" />
      <Puff d="M76 51 q11 -3 11 -11 q-11 -1 -11 11 Z" hue="green" />
    </g>
  ),
  // 夏 — the sun
  S2: () => (
    <g>
      {Array.from({ length: 8 }, (_, i) => {
        const a = (i * 45 * Math.PI) / 180
        return <Puff key={i} hue="gold" w={2.6}
          d={`M${76 + Math.cos(a) * 12} ${44 + Math.sin(a) * 12} L${76 + Math.cos(a) * 17} ${44 + Math.sin(a) * 17}`} />
      })}
      <circle cx="76" cy="45.2" r="9" fill="var(--gy-gold-dp)" />
      <circle cx="76" cy="44" r="9" fill="var(--gy-gold)"
        stroke="var(--gy-gold-dp)" stroke-width="1.4" />
    </g>
  ),
  // 秋 — a maple leaf. It was an eight-point star, which at 44px was the
  // summer sun in a different colour: the two seasons have to be told apart.
  S3: () => (
    <g>
      <Puff d="M76 62 L76 47" hue="orange" w={2.6} />
      <Puff hue="orange"
        d="M76 24 l4 8 l6 -3 l-2 7 l8 -1 l-6 6 l7 4 l-8 1 l1 5 l-8 -3 l-2 8 l-3 -6 l-3 6 l-2 -8 l-8 3 l1 -5 l-8 -1 l7 -4 l-6 -6 l8 1 l-2 -7 l6 3 Z" />
    </g>
  ),
  // 冬 — a snowflake
  S4: () => (
    <g>
      {Array.from({ length: 6 }, (_, i) => {
        const a = (i * 60 * Math.PI) / 180
        const ex = 76 + Math.cos(a) * 16
        const ey = 44 + Math.sin(a) * 16
        return <Puff key={i} hue="blue" w={2.8} d={`M76 44 L${ex} ${ey}`} />
      })}
      <circle cx="76" cy="44" r="4.4" fill="var(--gy-blue)"
        stroke="var(--gy-blue-dp)" stroke-width="1.4" />
    </g>
  ),
}

/**
 * The flowers sit BELOW their own character, not through it.
 *
 * The blossoms were centred at y 40 with a 24-unit reach, which put their top
 * petals at y 16 — through the 梅 on baseline 17. The art box on a landscape
 * bonus tile is y 22 to 60, between the character and the caption, and these
 * now stay inside it.
 */
const FLOWER: Record<string, () => preact.JSX.Element> = {
  F1: () => (
    <g>
      {/* Clear of the petals. Shrinking the blossom to fit the art box left
          the leaf entirely underneath it: rasterised, it contributed exactly
          zero visible pixels, and 梅 on the reference sheet has foliage. */}
      <Puff d="M77 56 q-15 5 -20 -5 q15 -5 20 5 Z" hue="green" />
      {petals(5, 53, 41, 9.5, 10, 10, 'pink')}
      <circle cx="53" cy="41" r="5.2" fill="var(--gy-gold)"
        stroke="var(--gy-gold-dp)" stroke-width="1.3" />
    </g>
  ),
  F2: () => (
    <g>
      {petals(5, 53, 41, 4.8, 12.5, 11, 'purple')}
      <circle cx="53" cy="41" r="4.8" fill="var(--gy-gold)"
        stroke="var(--gy-gold-dp)" stroke-width="1.3" />
    </g>
  ),
  F3: () => (
    <g>
      {petals(12, 53, 41, 2.9, 11, 10, 'gold')}
      <circle cx="53" cy="41" r="5.6" fill="var(--gy-orange)"
        stroke="var(--gy-orange-dp)" stroke-width="1.3" />
    </g>
  ),
  F4: () => (
    <g>
      <Stick cx={46} cy={32} h={18} w={8} hue="green" />
      <Stick cx={46} cy={51} h={18} w={8} hue="green" />
      <Puff d="M54 35 q12 -2 15 -10 q-13 0 -15 10 Z" hue="green" />
      <Puff d="M54 46 q13 2 16 11 q-14 1 -16 -11 Z" hue="green" />
    </g>
  ),
}

const ANIMAL: Record<string, () => preact.JSX.Element> = {
  cat: () => (
    <g>
      <Puff d="M66 50 q14 -2 12 -14" hue="orange" w={4} />
      <Puff d="M38 22 L33 34 L45 31 Z" hue="orange" />
      <Puff d="M62 22 L67 34 L55 31 Z" hue="orange" />
      <ellipse cx="50" cy="48" rx="24" ry="14" fill="var(--gy-orange-dp)" />
      <ellipse cx="50" cy="46.6" rx="24" ry="14" fill="var(--gy-orange)"
        stroke="var(--gy-orange-dp)" stroke-width="1.6" />
      <ellipse cx="50" cy="52" rx="13" ry="7" fill="var(--gy-cream)"
        stroke="var(--gy-orange-dp)" stroke-width="1.1" />
      <circle cx="41" cy="43" r="3.4" fill="var(--gy-ink-dp)" />
      <circle cx="59" cy="43" r="3.4" fill="var(--gy-ink-dp)" />
      <circle cx="39.9" cy="41.8" r="1.2" fill="#FFFFFF" />
      <circle cx="57.9" cy="41.8" r="1.2" fill="#FFFFFF" />
      <path d="M50 50 l3 2.6 l-3 2.4 l-3 -2.4 Z" fill="var(--gy-red)" />
      {/* Same rule as the centipede's legs: drawn in the deep shade alone the
          whiskers were 1.69:1 in dark. Puff is the shape that cannot make
          that mistake — deep and base, always together, in one group. */}
      {['M32 50 L24 48', 'M32 54 L24 56', 'M68 50 L76 48', 'M68 54 L76 56'].map((d) => (
        <Puff key={d} d={d} hue="orange" w={1.8} />
      ))}
    </g>
  ),
  rat: () => (
    <g>
      <Puff d="M72 52 q14 0 12 -12 q-1 -6 -7 -5" hue="purple" w={3.4} />
      <circle cx="34" cy="30" r="10" fill="var(--gy-purple-dp)" />
      <circle cx="34" cy="29" r="10" fill="var(--gy-purple)"
        stroke="var(--gy-purple-dp)" stroke-width="1.5" />
      <circle cx="66" cy="30" r="10" fill="var(--gy-purple-dp)" />
      <circle cx="66" cy="29" r="10" fill="var(--gy-purple)"
        stroke="var(--gy-purple-dp)" stroke-width="1.5" />
      <ellipse cx="50" cy="49" rx="22" ry="15" fill="var(--gy-purple-dp)" />
      <ellipse cx="50" cy="47.6" rx="22" ry="15" fill="var(--gy-purple)"
        stroke="var(--gy-purple-dp)" stroke-width="1.6" />
      <ellipse cx="50" cy="53" rx="11" ry="7" fill="var(--gy-cream)"
        stroke="var(--gy-purple-dp)" stroke-width="1.1" />
      <circle cx="42" cy="44" r="3.2" fill="var(--gy-ink-dp)" />
      <circle cx="58" cy="44" r="3.2" fill="var(--gy-ink-dp)" />
      <circle cx="41" cy="42.9" r="1.1" fill="#FFFFFF" />
      <circle cx="57" cy="42.9" r="1.1" fill="#FFFFFF" />
      <circle cx="50" cy="52" r="3" fill="var(--gy-pink)"
        stroke="var(--gy-purple-dp)" stroke-width="1" />
    </g>
  ),
  rooster: () => (
    <g>
      <Puff d="M74 52 q16 -6 16 -22 q-9 4 -12 12" hue="green" w={4} />
      <Puff d="M76 54 q18 -2 20 -18 q-11 2 -15 10" hue="blue" w={4} />
      <Puff d="M36 25 q3 -8 8 -3 q4 -7 8 -1 q4 -6 7 1" hue="red" w={4.2} />
      {/* Rimmed in gold, not in cream's own deep shade: cream-dp measures
          2.90:1 against this tile's pale body, so the bird had no outline. */}
      <ellipse cx="50" cy="48" rx="22" ry="15" fill="var(--gy-gold-dp)" />
      <ellipse cx="50" cy="46.6" rx="22" ry="15" fill="var(--gy-cream)"
        stroke="var(--gy-gold-dp)" stroke-width="1.6" />
      <path d="M30 42 L18 46.5 L30 51 Z" fill="var(--gy-gold)"
        stroke="var(--gy-gold-dp)" stroke-width="1.3" stroke-linejoin="round" />
      <Puff d="M32 52 q-3 8 2 9 q4 -3 3 -9 Z" hue="red" />
      <circle cx="37" cy="42" r="3.2" fill="var(--gy-ink-dp)" />
      <circle cx="36" cy="40.9" r="1.1" fill="#FFFFFF" />
      <Puff d="M52 44 q13 3 10 13 q-10 -1 -10 -13 Z" hue="gold" />
    </g>
  ),
  centipede: () => (
    <g>
      {/* Legs in the BASE shade over the deep one. Drawn in --gy-green-dp
          alone they measured 1.30:1 on the dark mint body — a deep token is a
          shadow, and a shadow is never the only thing carrying a shape. */}
      {[30, 42, 54, 66].map((x) => (
        <g key={x}>
          <Puff d={`M${x} 52 L${x - 4} 62`} hue="green" w={2.4} />
          <Puff d={`M${x} 36 L${x - 4} 26`} hue="green" w={2.4} />
        </g>
      ))}
      <Puff d="M74 30 q6 -8 2 -14" hue="orange" w={3} />
      <Puff d="M80 36 q9 -5 8 -13" hue="orange" w={3} />
      {/* Each segment's underside is its OWN deep shade. A teal segment on a
          green shadow is a mark whose two layers are different colours, which
          is the one thing the puff is not allowed to be. */}
      {[28, 40, 52, 64].map((x, i) => {
        const hue = i % 2 ? 'teal' : 'green'
        return (
          <g key={x}>
            <circle cx={x} cy="45.4" r="10" fill={`var(--gy-${hue}-dp)`} />
            <circle cx={x} cy="44" r="10" fill={`var(--gy-${hue})`}
              stroke={`var(--gy-${hue}-dp)`} stroke-width="1.5" />
          </g>
        )
      })}
      <circle cx="78" cy="45.4" r="12" fill="var(--gy-orange-dp)" />
      <circle cx="78" cy="44" r="12" fill="var(--gy-orange)"
        stroke="var(--gy-orange-dp)" stroke-width="1.6" />
      <circle cx="75" cy="41" r="3" fill="var(--gy-ink-dp)" />
      <circle cx="83" cy="41" r="3" fill="var(--gy-ink-dp)" />
      <circle cx="74" cy="39.9" r="1" fill="#FFFFFF" />
      <circle cx="82" cy="39.9" r="1" fill="#FFFFFF" />
      <path d="M74 49 q4 4 8 0" stroke="var(--gy-ink-dp)" stroke-width="1.8"
        fill="none" stroke-linecap="round" />
    </g>
  ),
}

/** The artwork of one wall tile. */
export function Face({ id, mini, small }: {
  id: TileId
  /** Drawn in the tray, at 44px. */
  mini?: boolean
  /** Drawn smaller still — the 40px wind tile in the payment ledger. */
  small?: boolean
}) {
  // Below about 48px the flourish under a wind glyph stops being a flourish
  // and starts being three pixels of noise between the glyph and the caption.
  const tight = mini === true || small === true
  const suit = suitOf(id)
  const rank = rankOf(id)
  if (suit && rank) {
    const hue = SUIT_INK[suit]!
    if (suit === 'p') {
      const { r, at } = DOTS[rank]!
      return (
        <g>
          <Stamp rank={rank} mark={SUIT_MARK.p} hue={hue} big={tight} />
          {at.map((p, i) => (
            <Coin key={i} cx={p.cx} cy={p.cy} r={r} hue={DOT_INK[rank]![i]!} />
          ))}
        </g>
      )
    }
    if (suit === 's') {
      return (
        <g>
          <Stamp rank={rank} mark={SUIT_MARK.s} hue={hue} big={tight} />
          {rank === 1
            ? <Bird />
            : BAMBOO[rank]!.map((g, i) => (
              <Stick key={i} {...g} hue={BAMBOO_INK[rank]![i]!} />
            ))}
        </g>
      )
    }
    // 萬: the CJK numeral in blue over 萬 in red, which is how the tile reads.
    return (
      <g>
        <Stamp rank={rank} hue={hue} big={tight} />
        <Glyph ch={CHAR_NUMERAL[rank]!} x={40} y={55} size={34} hue="blue" />
        <Glyph ch="萬" x={40} y={90} size={32} hue="red" />
      </g>
    )
  }
  const hue = HONOUR_INK[id] ?? 'ink'
  if (id === 'P') return <WhiteFrame />
  return (
    <g>
      <Glyph ch={HONOUR_GLYPH[id]!} x={40} y={tight ? 66 : 62} size={tight ? 50 : 43}
        hue={hue} />
      {!tight && <Flourish y={77} hue={hue} />}
    </g>
  )
}

/** The artwork of one bonus tile, in its own 100×80 landscape box. */
export function BonusFace({ id }: { id: BonusId }) {
  const hue = BONUS_INK[id]
  const glyph = BONUS_GLYPH[id]
  if (ANIMAL[id]) return <g>{ANIMAL[id]!()}</g>
  const flower = FLOWER[id]
  /**
   * No number is drawn here, and there used to be one.
   *
   * Flower N belongs to seat N — 梅 is the first flower AND East's flower —
   * so the tile's number and its owner's number are the same digit, always.
   * The face drew it top-left and the seat pill drew it top-left too, one
   * opaque circle over the other. One number, and the pill is the one that
   * also says whose it is.
   */
  return (
    <g>
      {flower ? (
        <>
          <text x="52" y="17" font-size="15" font-weight="700" font-family="var(--f-cjk)"
            text-anchor="middle" fill={`var(--gy-${hue}-tx)`}>{glyph}</text>
          {flower()}
        </>
      ) : (
        <>
          {/* The glyph takes the left of the tile and the motif the right,
              with a real gap between them. 秋's maple leaf reached x=53 and
              the 秋 it belongs to ends at 54 — the two were drawn on top of
              each other on a tile whose whole job is to be told apart from
              the other three seasons. */}
          <Glyph ch={glyph} x={35} y={56} size={34} hue={hue} />
          <g transform="translate(78 44) scale(0.8) translate(-76 -44)">{MOTIF[id]!()}</g>
        </>
      )}
    </g>
  )
}

export { BONUS_GLYPH, HONOUR_GLYPH, SUIT_MARK, bodyOf, bonusBodyOf }

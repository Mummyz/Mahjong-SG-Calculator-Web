import { t } from '../../i18n'

/**
 * The wordmark and the host.
 *
 * "Mahjongyuk" is "Mahjong, yuk!" — an invitation, so the mark is the word
 * with the invitation landing on it as a tile. The exclamation mark is drawn
 * rather than typed: a bar over a ring, which reads as "!" and also as 一筒,
 * the one-dot coin.
 *
 * Everything is vector and token-coloured. If the webfont never arrives the
 * letters fall back and the tile, the lip, the gloss, the exclamation and the
 * bird are all still there — the identity never depends on the network.
 */

const FACE = 'Fredoka, "Trebuchet MS", ui-rounded, system-ui, sans-serif'

export function Wordmark() {
  return (
    <h1 class="wm" aria-label={t('app.name')}>
      <svg class="wm__svg" viewBox="0 0 300 96" width="300" height="96"
        xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">
        <defs>
          <linearGradient id="wmFace" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stop-color="var(--mj-mandarin-hi)" />
            <stop offset="1" stop-color="var(--mj-mandarin)" />
          </linearGradient>
          <linearGradient id="wmGloss" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stop-color="#FFFFFF" stop-opacity=".55" />
            <stop offset="1" stop-color="#FFFFFF" stop-opacity="0" />
          </linearGradient>
        </defs>

        <text x="0" y="70" font-family={FACE} font-size="42" font-weight="600"
          letter-spacing="-0.6" fill="var(--mj-ink)">mahjong</text>

        <g transform="rotate(-7 220 52)">
          <rect x="187" y="26" width="66" height="64" rx="17" fill="var(--mj-mandarin-lip)" />
          <rect x="187" y="20" width="66" height="64" rx="17" fill="url(#wmFace)" />
          <rect x="190" y="23" width="60" height="26" rx="13" fill="url(#wmGloss)" />
          <text x="193" y="61" font-family={FACE} font-size="24" font-weight="600"
            fill="var(--mj-on-mandarin)">yuk</text>
          <rect x="236" y="35" width="6.5" height="16" rx="3.2" fill="var(--mj-on-mandarin)" />
          <circle cx="239.2" cy="59" r="4.6" fill="none"
            stroke="var(--mj-on-mandarin)" stroke-width="2.8" />
        </g>

        <g transform="translate(163,-14) scale(.72) rotate(6 32 32)">
          <CuitBody mood="idle" />
        </g>
      </svg>
    </h1>
  )
}

export type Mood = 'idle' | 'think' | 'cheer'

/**
 * Cuit — 麻雀 is literally "sparrow", and *cuit* is Indonesian for both a
 * chirp and a nudge. He is decoration: always aria-hidden, never the only
 * thing carrying a state, and never on a surface where money is a number.
 */
export function Cuit({ mood = 'idle', size = 56 }: { mood?: Mood; size?: number }) {
  return (
    <svg class="cuit" data-mood={mood} width={size} height={size} viewBox="0 0 68 62"
      xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">
      <CuitBody mood={mood} />
    </svg>
  )
}

function CuitBody({ mood }: { mood: Mood }) {
  return (
    <g class="cuit" data-mood={mood}>
      {/* the tail is three fanned strokes — the same three dashes as the 索 rule */}
      <g stroke="#3FBF97" stroke-width="4" stroke-linecap="round" fill="none">
        <path d="M15 34 L4 39" />
        <path d="M15 38 L3 45" />
        <path d="M16 42 L5 51" />
      </g>
      <ellipse cx="34" cy="38" rx="20" ry="18" fill="#8FE3C2" />
      <ellipse cx="34" cy="46" rx="12.5" ry="9.5" fill="#E8FBF2" />
      <ellipse cx="51" cy="39" rx="5.5" ry="8" fill="#3FBF97" transform="rotate(16 51 39)" />
      <circle cx="23" cy="37" r="3.2" fill="#FFB08A" opacity=".5" />
      <circle cx="45" cy="37" r="3.2" fill="#FFB08A" opacity=".5" />
      <path d="M31 20 q3 -8 8 -4" stroke="#3FBF97" stroke-width="3"
        stroke-linecap="round" fill="none" />
      {/* the beak is a diamond between the eyes, with clearance on both */}
      <path d="M34 35 L38 38.5 L34 42 L30 38.5 Z" fill="#FB9A26" />
      <g class="cuit__eyes cuit__eyes--open">
        <circle cx="27" cy="30" r="3.3" fill="#12211C" />
        <circle cx="41" cy="30" r="3.3" fill="#12211C" />
        <circle cx="25.9" cy="28.9" r="1.1" fill="#FFFFFF" />
        <circle cx="39.9" cy="28.9" r="1.1" fill="#FFFFFF" />
      </g>
      <g class="cuit__eyes cuit__eyes--happy">
        <path d="M23.7 31 q3.3 -4.4 6.6 0" stroke="#12211C" stroke-width="3"
          stroke-linecap="round" fill="none" />
        <path d="M37.7 31 q3.3 -4.4 6.6 0" stroke="#12211C" stroke-width="3"
          stroke-linecap="round" fill="none" />
      </g>
      <g class="cuit__think">
        <circle cx="56" cy="16" r="2.2" fill="#3FBF97" />
        <circle cx="62" cy="10" r="1.5" fill="#3FBF97" />
      </g>
    </g>
  )
}

/** The wall the front door opens on: real tile backs, clipped by the hero. */
export function HeroWall() {
  return (
    <div class="hero__wall" aria-hidden="true">
      {Array.from({ length: 8 }, (_, i) => <i key={i} />)}
    </div>
  )
}

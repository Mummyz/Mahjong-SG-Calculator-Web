import { t } from '../../i18n'

/**
 * The masthead.
 *
 * Run 5 replaced the drawn wordmark with the owner's own logo artwork. It is
 * one image and it carries the whole identity — the name, the invitation, the
 * tiles and the host — so everything around it went quiet: the green wall of
 * tile backs that used to run behind it is gone, and what is left is a soft
 * bloom of the page's own two hues.
 *
 * The alt text is the brand name and nothing else. The tagline underneath is
 * real text, so a reader who never sees the image still gets the promise.
 */
export function Logo() {
  return (
    <h1 class="logo">
      <img class="logo__img" src="/brand/logo-mahjongyuk.png" alt={t('app.name')}
        width="560" height="511" fetchpriority="high" decoding="async" />
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

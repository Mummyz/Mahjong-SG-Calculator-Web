/**
 * The one gradient every puffed mark shares, mounted once at the app root.
 *
 * SVG references are document-scoped, so a single hidden <svg> serves all
 * forty-six faces however many of them are on screen. Duplicating it into
 * every tile would put ninety definitions in the tray alone.
 *
 * The mask is in objectBoundingBox units, so each mark gets the gloss fading
 * across ITS OWN height rather than the tile's — a 12px pip and a 46px 東 are
 * lit the same way.
 */
export function FaceDefs() {
  return (
    <svg width="0" height="0" aria-hidden="true" focusable="false"
      style="position:absolute" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="gyTopG" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="#FFFFFF" stop-opacity="1" />
          <stop offset="0.45" stop-color="#FFFFFF" stop-opacity="0" />
        </linearGradient>
        <mask id="gyTop" maskUnits="objectBoundingBox" maskContentUnits="objectBoundingBox"
          x="0" y="0" width="1" height="1">
          <rect width="1" height="1" fill="url(#gyTopG)" />
        </mask>
      </defs>
    </svg>
  )
}

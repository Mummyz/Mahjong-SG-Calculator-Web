/**
 * The v3 direction's two laws, as a lint.
 *
 * A Design Critic round is expensive and slow. These are the parts of the
 * direction that can be checked from the stylesheet alone, so that the next
 * change that breaks one of them fails in a second rather than in an hour.
 *
 * The spec is docs/design/; the laws are stated in docs/design/thesis.md.
 */

import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const read = (p: string) => readFileSync(fileURLToPath(new URL(p, import.meta.url)), 'utf8')
const app = read('./app.css')
const tile = read('./tile.css')
const tokens = read('./tokens.css')
const css = `${tokens}\n${tile}\n${app}`

/** Rule blocks as [selector, body] pairs, comments stripped. */
const rules = (src: string): [string, string][] =>
  [...src.replace(/\/\*[\s\S]*?\*\//g, '').matchAll(/([^{}]+)\{([^{}]*)\}/g)]
    .map((m) => [m[1]!.trim().replace(/\s+/g, ' '), m[2]!] as [string, string])

describe('the stylesheet is a stylesheet', () => {
  /**
   * A rule was deleted from the middle of a selector list this run and left a
   * dangling comma, which PostCSS rejects. `npm run build` caught it; the test
   * suite did not, and the suite is what gates everything. Now it does.
   */
  it.each([['app.css', app], ['tile.css', tile], ['tokens.css', tokens]])(
    '%s parses', (_name, src) => {
      const clean = src.replace(/\/\*[\s\S]*?\*\//g, '')
      const open = (clean.match(/\{/g) ?? []).length
      const close = (clean.match(/\}/g) ?? []).length
      expect(open, 'unbalanced braces').toBe(close)
      // A selector list that ends in a comma is a rule that lost its body.
      expect(clean, 'a selector list ending in a comma').not.toMatch(/,\s*[{}]/)
      // A declaration must have a value.
      for (const [sel, body] of rules(clean)) {
        for (const d of body.split(';')) {
          if (!d.trim() || !d.includes(':')) continue
          expect(d.split(':').slice(1).join(':').trim().length,
            `${sel} has an empty declaration`).toBeGreaterThan(0)
        }
      }
    })
})

describe('the depth law', () => {
  /**
   * RAISED — a hard, zero-blur, coloured offset shadow — belongs to exactly
   * three things: the tile, the primary button and the fan medal. Run 5 took
   * the list from four to three: the drawn wordmark and its wall of tile
   * backs are both gone, replaced by the owner's logo artwork, which is an
   * image and casts a soft drop-shadow rather than a lip.
   */
  const ALLOWED = ['.tile', '.btn--primary', '.fanmedal']
  it('raises only the three things it is allowed to raise', () => {
    const offenders: string[] = []
    for (const [sel, body] of rules(css)) {
      // A LIP is a hard offset of 3px or more with no blur. The 2px hairline
      // edge on a ghost button is specified by the direction as an edge, not
      // as thickness, and is not the thing the law is about.
      const lip = body.replace(/inset[^,;]*/g, '')
      if (!/box-shadow:[^;]*\b0 [3-9]\d*px 0(?: 0)? (?:var\(--|#|rgb)/.test(lip)) continue
      if (ALLOWED.some((a) => sel.includes(a))) continue
      offenders.push(`${sel} { ${body.trim().slice(0, 70)} }`)
    }
    expect(offenders, 'raised elements outside the closed list').toEqual([])
  })

  it('gives every carved-in surface a boundary, not just an inset blur', () => {
    // In dark, an inset shadow alone composited to 1.01–1.07:1 and every well
    // in the app was invisible. The hairline is what makes carved a boundary.
    const offenders: string[] = []
    for (const [sel, body] of rules(app)) {
      if (!/inset 0 2px 6px var\(--mj-shadow-soft\)/.test(body)) continue
      if (/inset 0 0 0 1px var\(--mj-line\)/.test(body)) continue
      offenders.push(sel)
    }
    expect(offenders, 'a carved surface with no boundary').toEqual([])
  })
})

describe('the correctness law', () => {
  it('never repaints the tile face for a state', () => {
    // Selection, taking and focus live in the lip, the ring and the lift. The
    // one exception is a tile physically turned over. Repainting the face —
    // or the coloured suit mark — collapses two of the three suit encodings on
    // exactly the tiles a player is staring hardest at.
    const STATE = /\[(aria-pressed="true"|data-held|data-taken|data-needed)/
    const offenders: string[] = []
    for (const [sel, body] of rules(tile)) {
      if (!STATE.test(sel)) continue
      if (/\.tile__mark|\.tile__rank|\.tile__rule/.test(sel)) {
        offenders.push(`${sel} restyles a suit encoding`)
      }
      // ::before and ::after are badges and frames drawn OVER the tile, not
      // the face itself. The face is the .tile element's own background.
      if (/::(before|after)/.test(sel)) continue
      if (/(^|[^-])background:/.test(body) && !/background: *none/.test(body)) {
        offenders.push(`${sel} repaints the face`)
      }
    }
    expect(offenders, 'state leaking into the tile face').toEqual([])
  })

  it('keeps the ghost badge clear of the artwork it hangs off', () => {
    // The badge and the 白 frame both wanted ::after once, and a needed White
    // Dragon rendered as a completely blank box with none of its encodings.
    // Run 5 settled it structurally: 白's frame is part of the drawing, so the
    // pseudo-elements are the badge and the gloss and nothing competes.
    expect(tile).toMatch(/\.tile\[data-needed="true"\]::before\s*\{[^}]*content: "\+"/)
    expect(tile).not.toMatch(/\.tile\[data-needed="true"\]::after/)
    expect(tile).not.toMatch(/\.tile\[data-h="P"\]::after/)
  })

  it('never lets a state reach inside the artwork', () => {
    // The face is an <svg> of content. If a state selector could restyle
    // anything in it, the correctness law would be back to being a rule
    // somebody remembers rather than a thing the structure forbids.
    const STATE = /\[(aria-pressed="true"|data-held|data-taken|data-needed|data-exhausted)/
    for (const [sel] of rules(tile)) {
      if (!STATE.test(sel)) continue
      expect(/\.face|\bsvg\b|\bpath\b|\bcircle\b/.test(sel),
        `${sel} reaches into the drawing`).toBe(false)
    }
  })
})

describe('the bars that do not move', () => {
  it('never uses a lip colour as text', () => {
    // The lip tokens are audited to the 3:1 non-text bar. As text they
    // measured 3.13–4.33:1 — below AA in one theme or both.
    const offenders: string[] = []
    for (const [sel, body] of rules(css)) {
      for (const m of body.matchAll(/(?:^|[;\s])color: *var\((--mj-[a-z0-9-]*lip[a-z0-9-]*)\)/g)) {
        offenders.push(`${sel} → ${m[1]}`)
      }
    }
    expect(offenders, 'a boundary colour used as text').toEqual([])
  })

  it('gives every control a 44px floor', () => {
    const offenders: string[] = []
    const CONTROLS = ['.btn', '.chip', '.tab', '.linkbtn', '.langtoggle__opt',
      '.declareopt', '.menuitem', '.wingrid__opt', '.unusual__pick', '.unusual__why',
      '.signboard__seg', '.signboard__info', '.gamecard__go', '.predict__head']
    for (const [sel, body] of rules(app)) {
      if (!CONTROLS.some((c) => sel.split(',').some((s) => s.trim().startsWith(c)))) continue
      const m = /min-height: *(\d+)px/.exec(body)
      if (m && Number(m[1]) < 44) offenders.push(`${sel} → ${m[1]}px`)
    }
    expect(offenders, 'a control below the 44px floor').toEqual([])
  })

  it('sets a colour wherever it sets a card background', () => {
    // A background without a colour inherits the UA default, which rendered
    // the front door's variant names in black at 1.42:1 on the dark card.
    for (const [sel, body] of rules(app)) {
      if (!/background: *var\(--mj-card\)/.test(body)) continue
      // A pseudo-element cannot hold text — the declare popup's caret is a
      // rotated square — so there is no colour for it to get wrong.
      if (/::(before|after)/.test(sel)) continue
      if (/^\s*\./.test(sel) && !/color:/.test(body)) {
        expect(`${sel} sets --mj-card with no colour`).toBe('')
      }
    }
  })

  it('keeps the three-state theme complete', () => {
    const blocks = [...tokens.replace(/\/\*[\s\S]*?\*\//g, '')
      .matchAll(/(:root[^{]*)\{([^}]*)\}/g)].map((m) => m[2]!)
    expect(blocks.length, 'bare :root, the media guard, and the stamp').toBe(3)
    const names = (b: string) => new Set([...b.matchAll(/(--mj-[a-z0-9-]+) *:/g)].map((m) => m[1]!))
    const [root, media, stamp] = blocks.map(names)
    for (const n of media!) expect(root!.has(n), `${n} is never born on :root`).toBe(true)
    expect([...media!].sort()).toEqual([...stamp!].sort())
  })

  it('declares color-scheme so the UA palette is themed too', () => {
    expect(tokens).toMatch(/color-scheme: light dark/)
    // Once in the media guard, once in the attribute stamp. The third match
    // is the media query's own `prefers-color-scheme: dark`, which is not it.
    expect((tokens.match(/(?<!prefers-)color-scheme: dark/g) ?? []).length).toBe(2)
  })
})

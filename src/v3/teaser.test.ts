/**
 * THE AMERICAN CARD IS A PICTURE OF A GAME, NOT A GAME.
 *
 * The owner's decision, Run 6B: it is shown because players ask for it, and
 * it is never being built, because the NMJL card of hands is copyrighted.
 * That makes it a permanent teaser rather than a roadmap item, and this file
 * is what stops a later run from quietly turning it into one.
 *
 * The guarantee is structural. `VariantId` is the union the registry defines,
 * so there is no `'american'` for `onPick` to receive; the card renders as a
 * plain element with no handler, so there is nothing to click, focus or
 * activate; and the engine has never heard of it.
 */

import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { VARIANTS, isVariantId } from '../engine/variants'

const read = (f: string) =>
  readFileSync(fileURLToPath(new URL(f, import.meta.url)), 'utf8')

const screen = read('./screens/VariantSelect.tsx')
const en = JSON.parse(read('../i18n/en.json')) as Record<string, string>
const id = JSON.parse(read('../i18n/id.json')) as Record<string, string>

describe('the American teaser is never a choice', () => {
  it('picking a variant can only ever yield singapore or hongkong', () => {
    expect(Object.keys(VARIANTS).sort()).toEqual(['hongkong', 'singapore'])
    // The type guard is what every entry point runs input through — the URL,
    // the restored session, and the landing's own handler.
    expect(isVariantId('american')).toBe(false)
    for (const near of ['American', 'AMERICAN', 'american ', 'nmjl', 'us']) {
      expect(isVariantId(near), `${near} must not resolve to a variant`).toBe(false)
    }
    expect(isVariantId('singapore')).toBe(true)
    expect(isVariantId('hongkong')).toBe(true)
  })

  it('the screen offers onPick exactly two ids, from the registry', () => {
    const order = /const ORDER: VariantId\[\] = \[([^\]]*)\]/.exec(screen)
    expect(order, 'the ORDER list moved or changed shape').toBeTruthy()
    const ids = [...order![1]!.matchAll(/'([^']+)'/g)].map((m) => m[1]!)
    expect(ids).toEqual(['singapore', 'hongkong'])
    for (const i of ids) expect(VARIANTS[i as keyof typeof VARIANTS]).toBeTruthy()
  })

  it('the teaser card carries no handler and no way in', () => {
    // FROM THE OPENING TAG TO THE END OF THE FILE, not to the first </div>.
    // A non-greedy capture stopped at the first closing div, which today is
    // the card's own — but only because the card happens to contain no
    // nested one. Wrap a row in a <div> during an ordinary refactor and the
    // scanned region silently shrinks to that wrapper, so activation added
    // after it would sit outside everything asserted below and the guard
    // would pass on markup it never read. The teaser is the last element in
    // the JSX, so slicing to EOF can only over-scan, never under-scan.
    const start = screen.indexOf('<div class="card gamecard gamecard--teaser">')
    expect(start, 'the teaser card moved or changed shape').toBeGreaterThan(-1)
    const markup = screen.slice(start)
    // The slice must actually reach the badge, or it is scanning nothing.
    expect(markup, 'the scan stopped short of the card').toContain('gamecard__wip')

    // No activation of any kind, and no route into the picker.
    for (const forbidden of ['onClick', 'onKeyDown', 'onKeyUp', 'onPointerDown',
                             'tabIndex', 'tabindex', 'href', 'onPick']) {
      expect(markup, `the teaser must not carry ${forbidden}`).not.toContain(forbidden)
    }
    // Not a button, and not a button wearing a disabled attribute either:
    // `disabled` would mean "a control that is off", and this is not a control.
    expect(markup).not.toContain('<button')
    expect(markup).not.toContain('role=')
    // Never the BARE id. `'variant.american.name'` is a translation key and
    // is fine; a quoted `'american'` on its own would be an id on its way
    // somewhere that expects a variant.
    expect(markup).not.toMatch(/['"`]american['"`]/)
  })

  it('the engine has never heard of it', () => {
    const engine = [
      '../engine/variants/index.ts',
      '../engine/session/table.ts',
      '../engine/core/tiles.ts',
    ].map(read).join('\n')
    expect(engine.toLowerCase()).not.toContain('american')
    expect(engine.toLowerCase()).not.toContain('nmjl')
    // 152 is the American tile count and belongs to no variant here.
    for (const v of Object.values(VARIANTS)) {
      expect(v.tileSet.total, 'a 152-tile set appeared').not.toBe(152)
    }
  })

  it('its three strings exist and take the scope the owner set', () => {
    expect(en['variant.american.name']).toBe('American')
    expect(en['variant.american.badge']).toBe('Under Development')
    expect(en['variant.american.blurb']).toBeTruthy()

    // Name and badge stay English in both modes; the blurb translates, the
    // same as the other two cards'.
    expect(id['variant.american.name'], 'the name must stay English').toBeUndefined()
    expect(id['variant.american.badge'], 'the badge must stay English').toBeUndefined()
    expect(id['variant.american.blurb'], 'the blurb must translate').toBeTruthy()
    expect(id['variant.american.blurb']).not.toBe(en['variant.american.blurb'])

    // It is a teaser, so it must not promise anything or name a date.
    const blurbs = [en['variant.american.blurb']!, id['variant.american.blurb']!]
    for (const b of blurbs) {
      expect(b).not.toMatch(/\b(soon|coming|segera|nanti|202\d|203\d)\b/i)
    }
  })

  it('the constitution records that it is permanent', () => {
    const claude = read('../../CLAUDE.md')
    expect(claude).toMatch(/American/)
    // Whatever the wording, the two facts a future run needs must be there.
    expect(claude).toMatch(/never/i)
    expect(claude).toMatch(/copyright/i)
  })
})

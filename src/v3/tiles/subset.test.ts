/**
 * Every CJK glyph the app can draw is in the webfont subset it loads.
 *
 * v3/index.html asks Google Fonts for Noto Sans TC with an explicit `text=`
 * list. That is what makes a 東 look the same on an iPhone and on a cheap
 * Android — but a subset is a promise, and a glyph added later without
 * updating the URL silently falls back to whatever the device has, or to
 * nothing at all.
 *
 * So the list is checked against the source rather than remembered.
 */

import { readFileSync, readdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { expect, it } from 'vitest'
import en from '../../i18n/en.json'

const CJK = /[㐀-鿿]/u

const walk = (dir: string): string[] =>
  readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
    e.isDirectory() ? walk(`${dir}${e.name}/`) : [`${dir}${e.name}`])

const src = walk(fileURLToPath(new URL('../', import.meta.url)))
  .filter((f) => /\.tsx?$/.test(f) && !f.endsWith('.test.ts'))
  .map((f) => readFileSync(f, 'utf8'))
  .join('\n')

/** Every glyph the v3 components or the English bundle can put on screen. */
const used = new Set<string>()
for (const ch of src + Object.values(en as Record<string, string>).join('')) {
  if (CJK.test(ch)) used.add(ch)
}

const html = readFileSync(fileURLToPath(new URL('../../../v3/index.html', import.meta.url)), 'utf8')

it('loads a CJK subset at all', () => {
  expect(html, 'the tile faces are CJK and the page must ask for it')
    .toMatch(/family=Noto\+Sans\+TC[^"]*text=/)
})

it('covers every glyph the app can draw', () => {
  const m = /family=Noto\+Sans\+TC[^"]*?[?&]text=([^"&]+)/.exec(html)
  expect(m, 'no text= subset on the CJK stylesheet link').not.toBeNull()
  const have = new Set(decodeURIComponent(m![1]!))
  const missing = [...used].filter((c) => !have.has(c)).sort()
  expect(missing, `${missing.length} glyphs would fall back: ${missing.join('')}`).toEqual([])
})

it('asks for nothing it never draws', () => {
  const m = /family=Noto\+Sans\+TC[^"]*?[?&]text=([^"&]+)/.exec(html)!
  const extra = [...new Set(decodeURIComponent(m[1]!))].filter((c) => !used.has(c)).sort()
  expect(extra, `${extra.length} glyphs paid for and never shown: ${extra.join('')}`).toEqual([])
})

it('found a non-trivial set to check', () => {
  expect(used.size).toBeGreaterThan(60)
})

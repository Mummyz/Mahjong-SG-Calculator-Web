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

/**
 * Source with COMMENTS STRIPPED. Brand.tsx explains that 麻雀 means sparrow;
 * that is a note to the next reader, not something the app draws, and it was
 * buying two glyphs of webfont on every page load.
 */
const strip = (code: string) =>
  code.replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/(^|[^:])\/\/[^\n]*/g, '$1 ')

const src = walk(fileURLToPath(new URL('../', import.meta.url)))
  .filter((f) => /\.tsx?$/.test(f) && !f.endsWith('.test.ts'))
  .map((f) => strip(readFileSync(f, 'utf8')))
  .join('\n')

/**
 * Every glyph v3 can put on screen — the components, plus only the strings v3
 * actually renders. Scanning ALL of en.json made /v3/ pay for the /app/
 * engine harness's 麻雀 and 銃, which it never draws.
 */
const bundle = en as Record<string, string>
const lit = new Set([...src.matchAll(/\b(?:t|tv)\(\s*(?:[A-Za-z]+\s*,\s*)?'([^']+)'/g)]
  .map((m) => m[1]!))
const tmpl = [...src.matchAll(/`([a-zA-Z][a-zA-Z.]*)\.\$\{/g)].map((m) => m[1]!)
const rendered = Object.keys(bundle)
  .filter((k) => lit.has(k) || tmpl.some((p) => k.startsWith(`${p}.`)))

const used = new Set<string>()
for (const ch of src + rendered.map((k) => bundle[k]).join('')) {
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
  // Run 7 took the Chinese hand names off every screen, which cut the subset
  // roughly in half. What is left is what is physically carved on a tile.
  expect(used.size).toBeGreaterThan(35)
})

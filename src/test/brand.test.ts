/**
 * The masthead artwork is intact.
 *
 * public/brand/logo-mahjongyuk.png is the owner's logo with its white
 * background keyed out. The first attempt at that flood-filled every
 * near-white pixel reachable from the border — and the tile faces INSIDE the
 * mark are near-white too, so it ate 841 pixels out of the middle of them.
 * Over the light ground the gap showed peach and nobody noticed; over the
 * dark ground it would have been a hole punched through the logo on the front
 * door.
 *
 * The rule that makes that impossible is simple, so it is asserted here:
 * TRANSPARENCY IS ONLY EVER BORDER-CONNECTED. Anything else is a hole.
 */

import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { inflateSync } from 'node:zlib'
import { describe, expect, it } from 'vitest'

const file = fileURLToPath(new URL('../../public/brand/logo-mahjongyuk.png', import.meta.url))
const bytes = readFileSync(file)

/** Minimal PNG reader: 8-bit RGBA, no interlace — which is what we write. */
function decode(src: Buffer): { w: number; h: number; alpha: Uint8Array } {
  expect(src.subarray(0, 8).toString('latin1'), 'not a PNG')
    .toBe('\x89PNG\r\n\x1a\n')
  let pos = 8
  let ihdr: Buffer | null = null
  const idat: Buffer[] = []
  while (pos < src.length) {
    const len = src.readUInt32BE(pos)
    const type = src.subarray(pos + 4, pos + 8).toString('latin1')
    const data = src.subarray(pos + 8, pos + 8 + len)
    if (type === 'IHDR') ihdr = Buffer.from(data)
    else if (type === 'IDAT') idat.push(Buffer.from(data))
    pos += 12 + len
  }
  expect(ihdr, 'no IHDR').not.toBeNull()
  const w = ihdr!.readUInt32BE(0)
  const h = ihdr!.readUInt32BE(4)
  expect([ihdr![8], ihdr![9], ihdr![12]], 'expected 8-bit RGBA, non-interlaced')
    .toEqual([8, 6, 0])
  const raw = inflateSync(Buffer.concat(idat))
  const nch = 4
  const stride = w * nch
  const out = new Uint8Array(w * h * nch)
  let prev = new Uint8Array(stride)
  let p = 0
  const paeth = (a: number, b: number, c: number): number => {
    const pa = Math.abs(b - c); const pb = Math.abs(a - c); const pc = Math.abs(a + b - 2 * c)
    return pa <= pb && pa <= pc ? a : pb <= pc ? b : c
  }
  for (let y = 0; y < h; y++) {
    const f = raw[p]!; p++
    const line = new Uint8Array(raw.subarray(p, p + stride)); p += stride
    for (let i = 0; i < stride; i++) {
      const a = i >= nch ? line[i - nch]! : 0
      const b = prev[i]!
      const c = i >= nch ? prev[i - nch]! : 0
      if (f === 1) line[i] = (line[i]! + a) & 255
      else if (f === 2) line[i] = (line[i]! + b) & 255
      else if (f === 3) line[i] = (line[i]! + ((a + b) >> 1)) & 255
      else if (f === 4) line[i] = (line[i]! + paeth(a, b, c)) & 255
    }
    out.set(line, y * stride)
    prev = line
  }
  const alpha = new Uint8Array(w * h)
  for (let i = 0; i < w * h; i++) alpha[i] = out[i * 4 + 3]!
  return { w, h, alpha }
}

const { w, h, alpha } = decode(bytes)
const CLEAR = 24

describe('the masthead', () => {
  it('has a transparent background at all', () => {
    // Opaque means the owner's white JPEG background is still in there, and it
    // would sit as a white slab on the dark theme's ground.
    const clear = [...alpha].filter((a) => a < CLEAR).length
    expect(clear / (w * h), 'the background was never keyed out')
      .toBeGreaterThan(0.15)
  })

  it('has no hole punched through it', () => {
    const seen = new Uint8Array(w * h)
    const q: number[] = []
    const push = (i: number) => { if (alpha[i]! < CLEAR && !seen[i]) { seen[i] = 1; q.push(i) } }
    for (let x = 0; x < w; x++) { push(x); push((h - 1) * w + x) }
    for (let y = 0; y < h; y++) { push(y * w); push(y * w + w - 1) }
    for (let k = 0; k < q.length; k++) {
      const i = q[k]!; const x = i % w; const y = (i / w) | 0
      if (x > 0) push(i - 1)
      if (x < w - 1) push(i + 1)
      if (y > 0) push(i - w)
      if (y < h - 1) push(i + w)
    }
    let holes = 0
    for (let i = 0; i < w * h; i++) if (alpha[i]! < CLEAR && !seen[i]) holes++
    expect(holes, 'transparent pixels the border cannot reach are holes').toBe(0)
  })

  it('is cropped to the artwork, with real density and a sane weight', () => {
    // Rendered at 244px CSS, so 560 is 2.3x — enough for a DPR-3 phone.
    expect(w).toBeGreaterThanOrEqual(500)
    expect(bytes.length, 'the front door pays for this in full').toBeLessThan(280 * 1024)
    // No blank gutter: the crop is the artwork's own bounding box.
    const col = (x: number) => { for (let y = 0; y < h; y++) if (alpha[y * w + x]! > CLEAR) return true; return false }
    const row = (y: number) => { for (let x = 0; x < w; x++) if (alpha[y * w + x]! > CLEAR) return true; return false }
    expect([col(0) || col(1), col(w - 1) || col(w - 2), row(0) || row(1), row(h - 1) || row(h - 2)],
      'the asset has blank margin baked into it').toEqual([true, true, true, true])
  })

  it('is the size the markup promises', () => {
    const brand = readFileSync(
      fileURLToPath(new URL('../v3/components/Brand.tsx', import.meta.url)), 'utf8')
    expect(brand, 'width/height must match the asset or the page reflows')
      .toContain(`width="${w}" height="${h}"`)
  })

  it('is preloaded, since Preact creates the <img> and not the HTML', () => {
    const html = readFileSync(fileURLToPath(new URL('../../index.html', import.meta.url)), 'utf8')
    expect(html).toMatch(/rel="preload" as="image" href="\/brand\/logo-mahjongyuk\.png"/)
  })
})

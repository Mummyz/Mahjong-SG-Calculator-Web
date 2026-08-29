import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const read = (p: string) => readFileSync(fileURLToPath(new URL(`../../${p}`, import.meta.url)))
const sha256 = (b: Buffer) => createHash('sha256').update(b).digest('hex')

/**
 * The legacy calculator as tagged at `v1-final`. `/v1/` serves this forever.
 * If this hash ever has to change, that is a deliberate decision by the owner,
 * not a side effect of a refactor.
 */
const V1_SHA256 = '88240d1e0a7ab8fa9e0a78fa4b29142efdc90e6e2c04c5388f7b02b10108344a'

describe('scaffold', () => {
  it('runs the test suite', () => {
    expect(true).toBe(true)
  })

  // "The CNAME file is sacred" — CLAUDE.md. This is the tripwire.
  it('ships a CNAME pointing at mahjongyuk.com', () => {
    expect(read('public/CNAME').toString().trim()).toBe('mahjongyuk.com')
  })

  it('preserves the v1 calculator byte-for-byte', () => {
    expect(sha256(read('public/v1/index.html'))).toBe(V1_SHA256)
  })
})

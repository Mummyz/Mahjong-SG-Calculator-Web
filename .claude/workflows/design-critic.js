export const meta = {
  name: 'design-critic',
  description: 'Blocking mobile design audit of the mahjongyuk v2 UI against the CLAUDE.md bar',
  phases: [
    { title: 'Audit', detail: 'five independent lenses over the built UI' },
    { title: 'Verify', detail: 'refute each finding before it counts' },
  ],
}

const ROOT = '/Users/mummyz/Claude/mahjongyuk'

const CONTEXT = `
You are auditing the v2 mobile UI of mahjongyuk.com, a MOBILE-ONLY mahjong scoring
calculator. Read the source before judging:

  ${ROOT}/src/ui/tokens.css        design tokens, both themes
  ${ROOT}/src/ui/app.css           layout
  ${ROOT}/src/ui/tile.css          the tile
  ${ROOT}/src/ui/App.tsx           screen state machine
  ${ROOT}/src/ui/components/Tile.tsx
  ${ROOT}/src/ui/components/Signboard.tsx
  ${ROOT}/src/ui/screens/VariantSelect.tsx
  ${ROOT}/src/ui/screens/TileInfo.tsx
  ${ROOT}/src/ui/screens/Setup.tsx
  ${ROOT}/src/ui/screens/HandEntry.tsx
  ${ROOT}/src/ui/screens/Results.tsx
  ${ROOT}/src/i18n/en.json         every user-visible string
  ${ROOT}/CLAUDE.md                the project constitution

THE BAR (from CLAUDE.md, non-negotiable):
- Mobile ONLY. Not mobile-first: desktop is not a target and just gets the same
  column centred at 420px.
- Thumb-reach layout: primary actions in the bottom third.
- Tile tap targets >= 44px.
- Every tile clearly readable at 360px width.
- Responsive up to tablet, 768px.
- CONSTITUTION: every user-visible string goes through t(). No hardcoded UI text,
  ever - including aria-labels. CJK on a TILE FACE is content (it is carved on the
  physical tile), not copy, and is allowed.
- The UI performs ZERO scoring maths. Everything comes from the engine. The only
  arithmetic allowed in the UI is multiplying engine units by the agreed stake to
  show currency (src/ui/format.ts).

ROUNDS 2 AND 3 OF THIS AUDIT ALREADY RAN. All 36 confirmed findings are fixed.
This is a CONFIRMATION round: raise only something NEW, or a regression the
fixes introduced. Do not re-report any of the following, all of which are done:
melds store engine notation; the winning tile is never auto-assigned; win method
and discarder are per-hand and chosen in a dock row, never defaulted; every
string incl. aria-labels goes through t() from a template; mini tiles keep all
three suit encodings; the tile-set screen is non-interactive; CLEAR and NEXT
HAND both need a second tap that times out; the ledger precedes the breakdown
and leads with "You collect"; the sheet states win method, stake and limit, and
explains pao and the Thirteen Wonders payment; the signboard carries round /
seat / stake / limit; limit is clamped 1-13 and typable; a custom stake is
typable and quantised to 2dp; meld overflow and fifth-copy guards with reasons;
ineligible circumstance chips are disabled AND cleared when they become
ineligible; a seat change clears a discarder that became yourself; TileInfo and
Setup both return to a hand in progress; the exhausted tile is not aria-pressed
and carries a face-down hatch; the stamp cell is ink not jade; the White Dragon
frame and count badge no longer collide; tile captions have their own ink token;
CJK glosses are aria-hidden; the ledger's double rule renders; session state is
mirrored to sessionStorage and every screen pushes a history entry so Back and
reload both work; after a hand the app returns to Setup so the seat is
re-confirmed.

ALREADY MEASURED IN A REAL BROWSER (do not re-report these as findings):
- 360x780 and 768x900, both light and dark: zero tap targets under 44px, zero
  text below its WCAG contrast minimum, no horizontal overflow, the document
  itself never scrolls, the dock sits at y=719 of 780 (bottom third).
- Smallest tile: 64.4px in the 5-column suit grid, 81.3px in the 4-column honours
  grid, 45.1px in the 7-column hand tray. All above 44.
- The worst case (four declared kongs, an 18-tile hand) fits without scrolling.

WHAT COUNTS AS A FINDING: something that would actually hurt a player using this
on a phone at a mahjong table, or a breach of the bar above. Be specific and point
at a file. Do NOT report taste preferences, and do not propose a redesign.
`

const FINDINGS_SCHEMA = {
  type: 'object', additionalProperties: false, required: ['findings'],
  properties: {
    findings: {
      type: 'array',
      items: {
        type: 'object', additionalProperties: false,
        required: ['title', 'file', 'severity', 'why', 'fix'],
        properties: {
          title: { type: 'string' },
          file: { type: 'string' },
          severity: { type: 'string', enum: ['blocking', 'major', 'minor'] },
          why: { type: 'string', description: 'the concrete failure a player would hit' },
          fix: { type: 'string', description: 'the specific change' },
        },
      },
    },
  },
}

const VERDICT_SCHEMA = {
  type: 'object', additionalProperties: false,
  required: ['real', 'reasoning'],
  properties: {
    real: { type: 'boolean' },
    reasoning: { type: 'string' },
  },
}

phase('Audit')
const LENSES = [
  { key: 'thumb', p: 'Lens: ONE-HANDED USE. You are holding the phone in one hand at a mahjong table, thumb only. Walk every screen. Where does the thumb have to stretch? Is anything destructive easy to hit by accident? Is anything important out of reach or below the fold when it matters?' },
  { key: 'dimroom', p: 'Lens: LEGIBILITY IN A DIM ROOM at arm\'s length. Contrast numbers already pass - look instead at what is hard to TELL APART: two states that look alike, a selected tile versus a focused tile versus an exhausted tile, one suit versus another, a wind versus a dragon. Check BOTH themes.' },
  { key: 'money', p: 'Lens: THE MONEY. This app settles real money between four people. Is it unambiguous who pays whom and how much? Could two players read the results screen and disagree? Is anything rounded, truncated, missing a sign, or missing a unit? Check src/ui/format.ts and Results.tsx closely.' },
  { key: 'errors', p: 'Lens: MISTAKES AND RECOVERY. A player mis-keys a tile mid-game. Can they always get back? Are dead ends possible? Is every engine rejection explained in words a player understands? Are there states where the user is stuck or confused about what the app wants next?' },
  { key: 'i18n', p: 'Lens: THE CONSTITUTION. Hunt for ANY user-visible string that does not go through t(), including aria-labels, and for any t() key used in code that is missing from en.json (or present in en.json but never used). Also check that layout would survive a much longer translation, since Bahasa Indonesia lands in Run 5.' },
]

const audits = await parallel(LENSES.map((l) => () =>
  agent(CONTEXT + '\n\n' + l.p, { label: 'audit:' + l.key, phase: 'Audit', schema: FINDINGS_SCHEMA })
    .then((r) => (r ? r.findings.map((f) => ({ ...f, lens: l.key })) : []))))

const all = audits.flat()
log(all.length + ' raw findings')

phase('Verify')
const verified = await parallel(all.map((f) => () =>
  agent(
    CONTEXT + '\n\nA reviewer raised this finding:\n' + JSON.stringify(f, null, 2) +
    '\n\nTry to REFUTE it. Read the actual source and check whether it is true as stated. ' +
    'It is not real if: the measurements above already disprove it, the code does not ' +
    'actually do what the finding claims, it is a taste preference, or it is out of scope ' +
    'for a mobile-only calculator. Default to real=false when uncertain.',
    { label: 'verify:' + f.title.slice(0, 28), phase: 'Verify', schema: VERDICT_SCHEMA },
  ).then((v) => (v && v.real ? { ...f, reasoning: v.reasoning } : null))))

const confirmed = verified.filter(Boolean)
log('confirmed: ' + confirmed.length + ' of ' + all.length)
const order = { blocking: 0, major: 1, minor: 2 }
confirmed.sort((a, b) => order[a.severity] - order[b.severity])
return { confirmed, rejected: all.length - confirmed.length }

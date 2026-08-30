export const meta = {
  name: 'design-critic-2b',
  description: 'Blocking audit of the Run 2B guided hand entry against the owner punch list',
  phases: [
    { title: 'Audit', detail: 'four owner scenarios plus two standing lenses' },
    { title: 'Verify', detail: 'refute each finding against the real source' },
  ],
}

const ROOT = '/Users/mummyz/Claude/mahjongyuk'

const CONTEXT = `
You are auditing the REDESIGNED hand entry of mahjongyuk.com, a MOBILE-ONLY
mahjong scoring calculator. The owner play-tested the previous version and said
the visual design was good but the hand-entry MECHANIC was not user friendly.
This run rebuilt the interaction. Read the source before judging:

  ${ROOT}/docs/UX-PLAN-run2b.md              the flow this was built to
  ${ROOT}/src/engine/variants/singapore/table.ts       session + guided-meld rules
  ${ROOT}/src/engine/variants/singapore/table.test.ts  their tests
  ${ROOT}/src/ui/App.tsx                     screens, table session, menu, persistence
  ${ROOT}/src/ui/screens/TableSetup.tsx      names, you, first dealer, stake, limit
  ${ROOT}/src/ui/screens/HandEntry.tsx       the hero
  ${ROOT}/src/ui/screens/Results.tsx         the settlement
  ${ROOT}/src/ui/components/Tile.tsx         tile states incl. dead/taken/wonOn
  ${ROOT}/src/ui/components/Signboard.tsx    ${ROOT}/src/ui/components/Sheet.tsx
  ${ROOT}/src/ui/app.css  ${ROOT}/src/ui/tile.css  ${ROOT}/src/ui/tokens.css
  ${ROOT}/src/i18n/en.json                   every user-visible string
  ${ROOT}/CLAUDE.md                          the project constitution

THE OWNER'S BINDING DIRECTIVES for this run:
1. Persistent table. Set up once; "Next hand" advances winds per the variant
   rules (dealer win -> winds stay; otherwise the deal passes; the prevailing
   wind advances after a full circuit). Hand number, seat winds and prevailing
   wind always visible. Survives reload. "New table" is the only reset.
2. Declare flow replaces the concealed/exposed choice. One Declare button ->
   Chow / Pong / Kong. After choosing Chow and tapping a tile, ONLY the tiles
   that can legally continue that meld stay live; everything else greys out and
   becomes untappable. Pong/Kong: tap one tile, done. Not declaring = concealed.
   A concealed kong is AUTO-DETECTED from four copies in hand and shown as a
   confirmation chip; it is never declared.
3. Exposed melds live in the SAME tray as concealed tiles, visually distinct
   and grouped, so the tray always shows the whole hand at a glance.
4. No separate winning-tile picker: once the hand is complete the player taps
   the tile IN THE TRAY that won it, and it gets a clear marking.
5. Remove choices, don't explain them. Where the player can only do N legal
   things, show only those N.
6. Player NAMES per seat, used everywhere a seat appears — discarder pick,
   payment ledger, wind tracker. The owner's seat marked "you".
7. Special circumstances get progressive disclosure: a one-line plain-English
   subtitle each, a tap-for-detail sheet, collapsed by default, all through t().

THE STANDING BAR (CLAUDE.md): mobile only; primary actions in the bottom third;
tap targets >= 44px; readable at 360px; responsive to 768px; every user-visible
string through t() including aria-labels; the UI performs ZERO scoring maths.

ALREADY MEASURED IN A REAL BROWSER — do not re-report:
- All five screens at 360x780, light and dark: zero tap targets under 44px,
  zero text below its contrast minimum, no horizontal overflow, the document
  never scrolls, the dock sits in the bottom third.
- Verified live: the chow guidance narrows 3m -> {1m,2m,4m,5m} and everything
  else goes dead; four 1p auto-detect as a concealed kong and the target grows
  11 -> 12 with an explaining chip; the tray shows CHOW and CONCEALED KONG as
  distinct groups; "won on this" marks exactly one tile; the ledger reads
  "Ming pays -0.50 / Siti pays -1.00 / Wei pays -0.50 / You +2.00"; the deal
  passed on a non-dealer win and held on a dealer win, names carried through.

WHAT COUNTS AS A FINDING: something that would actually hurt a player using
this at a table, a breach of an owner directive, or a breach of the standing
bar. Be specific and point at a file. No taste preferences, no redesigns.
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
          why: { type: 'string' },
          fix: { type: 'string' },
        },
      },
    },
  },
}
const VERDICT_SCHEMA = {
  type: 'object', additionalProperties: false, required: ['real', 'reasoning'],
  properties: { real: { type: 'boolean' }, reasoning: { type: 'string' } },
}

phase('Audit')
const LENSES = [
  { key: 'beginner', p: 'SCENARIO A — a beginner scores a simple discard win using only what is on screen, with no prior mahjong-app knowledge. Walk it literally, screen by screen, from a cold start. Where would they hesitate, guess, or give up? Is any step unexplained, any label jargon, any control whose effect is not obvious before pressing it?' },
  { key: 'complexhand', p: 'SCENARIO B — a hand with a declared chow, a concealed kong, and bonus tiles. Walk it. Does the tile count stay honest at every step? Is it always clear what is exposed and what is concealed? Can the player fix a mistake at any point? Does the auto-detected kong ever surprise or mislead?' },
  { key: 'rotation', p: 'SCENARIO C — three consecutive hands. Verify the rotation, the dealer-win hold, and that names carry through to the ledger. Read table.ts and its tests closely. Are there sequences where the table desyncs from a real game: washouts, someone else winning, changing the seating mid-session, editing names later?' },
  { key: 'guidance', p: 'SCENARIO D — the greyed-out guidance must block EVERY illegal tap. Read legalNextTiles in table.ts and how HandEntry applies it. Find any path where an illegal tile is tappable, a legal tile is wrongly dead, the player is led into a meld they cannot finish, or the guidance disagrees with what the engine will accept.' },
  { key: 'thumb', p: 'STANDING LENS — one-handed use at a table. Where does the thumb stretch? Is anything destructive easy to hit? Is anything essential below the fold when it matters? Consider the dock growing as the win row, the note and the score button stack up.' },
  { key: 'i18n', p: 'STANDING LENS — the constitution. Hunt for any user-visible string not passing through t(), including aria-labels; any t() key used but missing; any dead key; any layout that would break under a much longer Bahasa Indonesia translation.' },
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
    '\n\nTry to REFUTE it. Read the actual source and check whether it is true as ' +
    'stated. It is not real if the measurements above disprove it, the code does ' +
    'not do what it claims, it is a taste preference, or it is out of scope. ' +
    'Default to real=false when uncertain.',
    { label: 'verify:' + f.title.slice(0, 28), phase: 'Verify', schema: VERDICT_SCHEMA },
  ).then((v) => (v && v.real ? { ...f, reasoning: v.reasoning } : null))))

const confirmed = verified.filter(Boolean)
log('confirmed: ' + confirmed.length + ' of ' + all.length)
const order = { blocking: 0, major: 1, minor: 2 }
confirmed.sort((a, b) => order[a.severity] - order[b.severity])
return { confirmed, rejected: all.length - confirmed.length }

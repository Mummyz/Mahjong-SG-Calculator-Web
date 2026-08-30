export const meta = {
  name: 'design-critic-3',
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

THE OWNER'S BINDING DIRECTIVES for THIS run (Run 3, step 0B):
1. SUBMIT WIZARD replaces both the old win-condition row and the old
   tap-the-winning-tile-in-the-tray mechanic.
   - "Score this hand" is DISABLED until the tray holds a complete, valid hand;
     its label meanwhile hints what is missing, through t().
   - Tapping it opens a wizard sheet. Step 1: "Which tile won it?" — the
     completed hand is shown and the player taps the winning tile. Step 2:
     "How was it won?" — self-draw or a named player threw it; any circumstance
     that depends on the win method is resolved there too. Then the scoreboard.
   - RATIONALE: the old won-on mark was stored state that survived undo — undo
     the pair and the mark lingered. The wizard collects win context fresh at
     submit time, AFTER completeness is proven, so no stale state can exist.
     src/engine/variants/singapore/table.ts has handIsComplete and
     submissionMatchesHand with regression tests for exactly this.
2. DECLARE = FOCUS MODE: while guided declare is active, every other control
   (bonus row, circumstances, score button, menu, undo, clear, melds) is
   disabled and dimmed until the meld completes or is cancelled.
3. SMART DECLARE STATE: when fewer than three tray slots remain, Declare
   disables and its label becomes a dynamic hint reflecting what is actually
   left — "Just your pair to go" at two, "One tile to finish" at one, "Hand is
   complete" at zero, "No room for another meld" at four melds. All via t().

Everything from Runs 2 and 2B still stands: rolling table, guided declare,
auto-detected concealed kong, one tray, player names everywhere, progressive
disclosure on circumstances.

THE STANDING BAR (CLAUDE.md): mobile only; primary actions in the bottom third;
tap targets >= 44px; readable at 360px; responsive to 768px; every user-visible
string through t() including aria-labels; the UI performs ZERO scoring maths.

ALREADY VERIFIED LIVE at 360x780 — do not re-report:
- Smart declare: 12 of 14 shows "Just your pair to go" disabled; 13 of 14 shows
  "One tile to finish" disabled.
- The wizard opens only when complete; step 1 shows all 14 tiles and Next is
  disabled until one is tapped; step 2 lists the win method by player name and
  then only the circumstances that method allows (self-draw as dealer offered
  last tile / kong replacement / flower replacement / heavenly; a discard
  offered last tile / robbed a kong / pao).
- Undoing a tile after scoring returns "1 more to go", disabled, with no
  lingering winning-tile state anywhere.

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
  { key: 'wizard', p: 'SCENARIO A — the submit wizard. Walk it from a complete hand. Can the player get stuck, go back, or lose work? Does cancelling lose anything? Is every state of the Score button honest about what is missing? Is the wizard reachable, dismissible and readable one-handed?' },
  { key: 'stale', p: 'SCENARIO B — stale state. Hunt for ANY path where win context, a winning tile, a circumstance or a submission can outlive the hand it describes: undo, clear, removing a meld, removing a tile from a concealed kong, editing from the results screen, the back gesture, a reload, "next hand", "someone else won", "new table". Read App.tsx and table.ts closely.' },
  { key: 'focus', p: 'SCENARIO C — focus mode. While a chow/pong/kong is being declared, EVERY other control must be inert. Enumerate every interactive element on the hand screen and check each one. Find anything still tappable, anything dimmed but still live, or anything live but not dimmed.' },
  { key: 'declare', p: 'SCENARIO D — the smart declare states and the guided selection. Verify every state of the Declare button label and disabled-ness against the real slot arithmetic, and verify the greyed guidance still blocks every illegal tap.' },
  { key: 'thumb', p: 'STANDING LENS — one-handed use at a table. Where does the thumb stretch? Is anything destructive easy to hit? Is anything essential below the fold when it matters, including inside the wizard sheet?' },
  { key: 'i18n', p: 'STANDING LENS — the constitution. Any user-visible string not through t(), including aria-labels; any t() key used but missing; any dead key; any layout that breaks under a much longer Bahasa Indonesia translation.' },
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

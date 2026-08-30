export const meta = {
  name: 'mahjong-ui-direction',
  description: 'Judge panel on visual direction for the mahjongyuk mobile mahjong scoring app',
  phases: [
    { title: 'Propose', detail: 'three independent visual directions from different angles' },
    { title: 'Judge', detail: 'score each direction on distinctiveness, legibility and fit' },
    { title: 'Synthesise', detail: 'pick a winner and graft the best ideas from runners-up' },
  ],
}

const BRIEF = `
PROJECT: mahjongyuk.com - a MOBILE-ONLY web calculator for Singapore Mahjong scoring.
Users are players settling money at a real mahjong table, on their phone, mid-game,
often in a dim room.

WHAT IT DOES: pick variant -> see the tile set -> set winds/stakes -> key in a winning
hand tile by tile -> get the Fan breakdown and exactly who pays whom.

HARD CONSTRAINTS (non-negotiable):
- Mobile ONLY. Design for 360px width. Responsive up to 768px tablet. Desktop just gets
  the same column centered - no desktop layout.
- Tile tap targets >= 44px. Every tile must be clearly readable at 360px width.
- Primary actions must sit in thumb reach (bottom third of the screen).
- The tile picker is the HERO: 27 suited tiles (1-9 in three suits) + 7 honours
  (E S W N, red/green/white dragons) + 12 bonus tiles (4 flowers, 4 seasons, 4 animals).
- Must work in BOTH light and dark themes.
- Numbers matter: Fan counts and money amounts must be scannable.

BANNED (these read as AI-generated default design, do not propose them):
warm cream #F4F1EA with a serif display and terracotta accent; near-black with a lone
acid-green or vermilion pop; purple-to-blue gradient hero; Inter or Space Grotesk as the
body face; emoji as section markers; everything centered; rounded-lg on everything;
an accent bar/rail on rounded cards.

Fonts must be available on Google Fonts, plus a system CJK stack for tile characters.
`

phase('Propose')
const ANGLES = [
  { key: 'material', prompt: 'Angle: THE PHYSICAL OBJECT. Start from what a mahjong tile actually is as an object - bone/ivory face, bevelled edge, real thickness, engraved and paint-filled characters, the click of it on felt. What does a UI look like that treats tiles as physical objects the player recognises instantly?' },
  { key: 'vernacular', prompt: 'Angle: SINGAPORE VERNACULAR. Start from where this game is actually played in Singapore - kopitiams, void decks, CNY living rooms, the specific visual culture around it. What does a UI look like that a Singaporean player would recognise as THEIRS rather than as a generic international mahjong app?' },
  { key: 'instrument', prompt: 'Angle: THE INSTRUMENT. Ignore decoration entirely. This is a money-settling instrument used under time pressure at a table. Start from information design: what must be readable in half a second, what encodes state, what the eye hits first. What does a UI look like that is beautiful purely because it is ruthlessly clear?' },
]

const DIRECTION_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['name', 'thesis', 'palette', 'type', 'tileTreatment', 'layout', 'risk', 'whyNotGeneric'],
  properties: {
    name: { type: 'string' },
    thesis: { type: 'string' },
    palette: {
      type: 'array', minItems: 4, maxItems: 7,
      items: {
        type: 'object', additionalProperties: false,
        required: ['token', 'lightHex', 'darkHex', 'role'],
        properties: {
          token: { type: 'string' }, lightHex: { type: 'string' },
          darkHex: { type: 'string' }, role: { type: 'string' },
        },
      },
    },
    type: {
      type: 'object', additionalProperties: false,
      required: ['displayFace', 'bodyFace', 'rationale'],
      properties: {
        displayFace: { type: 'string' }, bodyFace: { type: 'string' }, rationale: { type: 'string' },
      },
    },
    tileTreatment: { type: 'string' },
    layout: { type: 'string' },
    risk: { type: 'string' },
    whyNotGeneric: { type: 'string' },
  },
}

const VERDICT_SCHEMA = {
  type: 'object', additionalProperties: false,
  required: ['scores', 'strongestIdea', 'fatalFlaw', 'overall'],
  properties: {
    scores: {
      type: 'object', additionalProperties: false,
      required: ['distinctiveness', 'legibilityAt360', 'fitToSubject', 'buildability'],
      properties: {
        distinctiveness: { type: 'number' }, legibilityAt360: { type: 'number' },
        fitToSubject: { type: 'number' }, buildability: { type: 'number' },
      },
    },
    strongestIdea: { type: 'string' },
    fatalFlaw: { type: 'string' },
    overall: { type: 'number' },
  },
}

const directions = await parallel(ANGLES.map((a) => () =>
  agent(
    BRIEF + '\n\n' + a.prompt + '\n\nPropose ONE complete visual direction. Be concrete and specific - real hex values, real Google Fonts family names, a real description of how a tile is drawn in HTML/CSS. Take a genuine point of view; do not hedge or offer alternatives.',
    { label: 'direction:' + a.key, phase: 'Propose', schema: DIRECTION_SCHEMA },
  ).then((d) => (d ? { angle: a.key, ...d } : null)),
))

const live = directions.filter(Boolean)
log(live.length + ' directions proposed: ' + live.map((d) => d.name).join(', '))

phase('Judge')
const LENSES = [
  { key: 'legibility', prompt: 'Judge purely as a legibility and accessibility reviewer. Would every tile actually be readable at 360px width with >=44px targets? Check contrast in BOTH themes. Be harsh about anything that only works on a big screen.' },
  { key: 'distinctiveness', prompt: 'Judge purely on whether this looks designed rather than generated. Cross-check it against the banned list. Would a designer recognise a point of view here, or is this a default dressed up?' },
  { key: 'player', prompt: 'Judge as an actual Singaporean mahjong player settling money at a table on your phone. Is this fast? Do you recognise your own tiles? Would anything annoy you mid-game?' },
]

const judged = await parallel(live.map((d) => () =>
  parallel(LENSES.map((l) => () =>
    agent(
      BRIEF + '\n\nHere is a proposed visual direction:\n\n' + JSON.stringify(d, null, 2) + '\n\n' + l.prompt + '\n\nScore each dimension 0-10 and give an overall 0-10.',
      { label: 'judge:' + l.key + ':' + d.angle, phase: 'Judge', schema: VERDICT_SCHEMA },
    ),
  )).then((vs) => {
    const ok = vs.filter(Boolean)
    const mean = ok.length ? ok.reduce((n, v) => n + v.overall, 0) / ok.length : 0
    return { direction: d, verdicts: ok, mean }
  }),
))

const ranked = judged.filter(Boolean).sort((a, b) => b.mean - a.mean)
for (const r of ranked) log(r.direction.name + ' (' + r.direction.angle + '): ' + r.mean.toFixed(1))

phase('Synthesise')
const synthesis = await agent(
  BRIEF + '\n\nThree visual directions were proposed and each judged by three independent reviewers.\n\nRANKED RESULTS:\n' + JSON.stringify(ranked, null, 2) + '\n\nProduce the FINAL design plan for the build. Start from the winning direction, but graft in any strongest-idea from the runners-up that genuinely improves it, and fix every fatalFlaw the judges raised. Output a concrete, buildable design plan: exact CSS custom property names with light and dark hex values, exact Google Fonts families with weights, the exact HTML/CSS recipe for drawing one tile at 44px+ including how each of the three suits and the seven honours are distinguished, and the layout for each of the five screens (variant select, tile info, game setup, hand entry, results). Be specific enough that an engineer could build it without further decisions.',
  { label: 'synthesis', phase: 'Synthesise', effort: 'high' },
)

return { ranked: ranked.map((r) => ({ name: r.direction.name, angle: r.direction.angle, mean: r.mean })), plan: synthesis }

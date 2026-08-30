export const meta = {
  name: 'hk-sources',
  description: 'Gather and digest published Hong Kong Old Style scoring sources',
  phases: [
    { title: 'Gather', detail: 'one agent per source family, verbatim quotes only' },
    { title: 'Reconcile', detail: 'cross-check the numbers and name every conflict' },
  ],
}

const RULE = `
You are gathering source material on HONG KONG OLD STYLE mahjong scoring
(香港舊章 / Hong Kong Old Style, also called Cantonese or Hong Kong Mahjong).

ABSOLUTE RULES:
- Quote VERBATIM. Every number you report must be attached to a direct quote
  and the URL it came from. If you cannot quote it, do not report it.
- Never infer, never average, never "commonly". If a source is silent on
  something, say it is silent.
- Do not confuse this with: Singapore mahjong (148 tiles, animals), Riichi /
  Japanese, Taiwanese 16-tile, Chinese Official / MCR (81 patterns), or
  American mahjong. If a page is about one of those, say so and move on.
- Prefer sources that state a complete fan table.

WHAT TO EXTRACT, with a quote for each:
1. The tile set: exactly how many tiles, and whether flowers and seasons are
   included. (Expect 144: 108 suited + 16 winds + 12 dragons + 4 flowers +
   4 seasons, and NO animals.)
2. The MINIMUM FAN to win, and whether it is stated as configurable.
3. The LIMIT (laak / 辣 / 爆) — the fan cap, and what payout it corresponds to.
4. The full FAN TABLE: every named hand and its fan value. Specifically look
   for: Common Hand / All Sequences (平和), All Triplets (對對糊), Mixed One
   Suit (混一色), Pure One Suit (清一色), All Honours (字一色), Great Dragons
   (大三元), Small Dragons (小三元), Great Winds (大四喜), Small Winds (小四喜),
   Thirteen Orphans (十三么), All Kongs (十八羅漢), Heavenly Hand (天糊),
   Earthly Hand (地糊), Self-draw (自摸), Fully Concealed (門前清), Robbing the
   Kong (搶槓), Win on Last Tile (海底撈月), Win on Replacement (槓上開花),
   dragon triplets, seat wind, prevailing wind, flowers and seasons.
5. The PAYMENT MODEL: how much each loser pays on a discard win versus a
   self-draw win. Hong Kong is widely described with two conventions — a
   "full payment" style where the discarder pays everything, and a "half
   payment" style where the discarder pays double and the others pay single.
   Report EXACTLY what your source says, with the quote, and say which of
   these it is. Also report the fan-to-points table if one is given.
6. Anything about the DEALER: whether the dealer pays or receives double, and
   what happens to the deal when the dealer wins or a hand is a washout.
`

const SCHEMA = {
  type: 'object', additionalProperties: false,
  required: ['sources', 'tileSet', 'minimumFan', 'limit', 'fanTable', 'payment', 'dealer', 'silences'],
  properties: {
    sources: { type: 'array', items: { type: 'object', additionalProperties: false,
      required: ['url', 'title', 'isHongKongOldStyle'],
      properties: { url: { type: 'string' }, title: { type: 'string' },
        isHongKongOldStyle: { type: 'boolean' } } } },
    tileSet: { type: 'string', description: 'verbatim quote plus the URL' },
    minimumFan: { type: 'string' },
    limit: { type: 'string' },
    fanTable: { type: 'array', items: { type: 'object', additionalProperties: false,
      required: ['hand', 'chinese', 'fan', 'quote', 'url'],
      properties: { hand: { type: 'string' }, chinese: { type: 'string' },
        fan: { type: 'string' }, quote: { type: 'string' }, url: { type: 'string' } } } },
    payment: { type: 'string', description: 'verbatim, and say full-payment or half-payment' },
    dealer: { type: 'string' },
    silences: { type: 'array', items: { type: 'string' },
      description: 'things the source does NOT state' },
  },
}

phase('Gather')
const HUNTS = [
  { key: 'wikipedia', p: 'Start from the Wikipedia article "Hong Kong Mahjong scoring rules" and any article it links on Hong Kong mahjong. Fetch the actual pages.' },
  { key: 'guides', p: 'Search for dedicated Hong Kong mahjong rule guides and fan charts from mahjong sites and clubs. Fetch at least three separate ones.' },
  { key: 'payment', p: 'Focus specifically on the PAYMENT model and the fan-to-points table for Hong Kong Old Style: how much a discarder pays versus each other loser, on a discard win and on a self-draw. Find and quote at least three independent sources, and note whether they agree.' },
  { key: 'limithands', p: 'Focus specifically on the LIMIT hands and the fan cap for Hong Kong Old Style: Thirteen Orphans, Great Dragons, Great Winds, All Kongs, All Honours, Heavenly and Earthly hands, Nine Gates. Quote their fan values and the limit itself.' },
]

const gathered = await parallel(HUNTS.map((h) => () =>
  agent(RULE + '\n\n' + h.p, { label: 'gather:' + h.key, phase: 'Gather', schema: SCHEMA })))

const live = gathered.filter(Boolean)
log(live.length + ' source digests gathered')

phase('Reconcile')
const reconciled = await agent(
  RULE + '\n\nFour independent gatherers produced these digests:\n\n' +
  JSON.stringify(live, null, 2) +
  '\n\nProduce a RECONCILIATION. For every value: state the number, list which ' +
  'sources support it with their quotes, and flag every genuine conflict ' +
  'explicitly rather than averaging. Where sources conflict, say which is ' +
  'better supported and why, and say plainly when a choice is a convention ' +
  'rather than a fact. Pay particular attention to the minimum fan, the limit, ' +
  'and the payment model, where Hong Kong tables are known to differ. Do not ' +
  'invent any number that is not in a quote above.',
  { label: 'reconcile', phase: 'Reconcile', effort: 'high' },
)

return { digests: live, reconciliation: reconciled }

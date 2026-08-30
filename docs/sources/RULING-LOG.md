# Ruling log — Singapore

Every point where sources disagreed, or where v1 disagreed with the sources.
Each ruling is the authority the corpus is written against. Changing a ruling
requires a new citation, not a failing test.

`v1` = the legacy calculator's rules modal. Per CLAUDE.md it is a **hint only** —
it had known scoring bugs. Where it conflicts with published sources, it loses.

---

## R1 — Self-draw is NOT a separate tai *(v1 was wrong)*

**Ruling:** Self-draw (自摸) changes the *payment structure* (all three pay the
doubled rate) and scores **no tai of its own**. Fully Concealed (门清 — no
chow/pong AND self-drawn) scores **+1**.

- `TT` §Fully Concealed Hand: 门清 "adds one point"; self-draw appears only in
  the payout tables, never in a tai list.
- `SGM`: "Self-draw: doubles payout" — listed as payout, not tai.
- `MK`: the 1-double list contains kong-replacement, robbing-the-kong and
  last-tile — **no** self-draw.
- `GB`: "Fully concealed (门清自摸): 1 tai" — one combined condition.
- Against: `SMC` lists "Self-draw wins: 1 Fan"; v1 gives Self Draw +1 **and**
  Fully Concealed +1.

**4 sources to 1.** Self-draw alone adds nothing. v1 double-counted it.

## R2 — Lesser Sequence stacks with bonus tiles *(v1 was wrong)*

**Ruling:** Lesser Sequence Hand (小平胡) scores 1 tai **on top of** flower and
animal points.

- `TT` §Sequence Hand: "he can only claim a 'Lesser Sequence Hand' (小平胡),
  which awards only 1 point, **on top of any points awarded to him by the
  flower and/or animal tiles**."
- v1: "Counts only 1pt regardless of other bonuses" — contradicted verbatim.

## R3 — There is no "All Simples" tai in Singapore *(v1 invented it)*

**Ruling:** No tai for a hand free of terminals and honours. Not present in
`TT`, `SMC`, `SGM`, `GB`, `MK` or `MP`. v1's "+1 All Simples" is imported from
another ruleset and is dropped.

## R4 — Pure Green Suit scores 4, not the limit

**Ruling:** 绿一色 = **4 tai**. Tiles restricted to 2,3,4,6,8 of bamboo plus the
Green Dragon.

- `TT` §Pure Green Suit: "scores four points instead of just two points for
  Mixed One Suit".
- Against: `MP` lists "All Green" among 5-tai hands. `TT` is explicit and
  specific; `MP` is a summary list. v1 also says 4.

**Extension (R4a):** Pure Green *replaces* the flush component rather than
stacking with it. `TT`'s wording is "four points **instead of** just two points
for Mixed One Suit" — the 4 is priced against the flush it supersedes. So a
Pure Green hand containing the Green Dragon scores 4, not 4 + 2 (Half Flush),
and an all-bamboo Pure Green scores 4, not 4 + 4 (Full Flush). Ordinary dragon
*triplet* points are unaffected and still add.

## R5 — Sequence Hand wait restriction

**Ruling:** 平胡 (4 tai) requires **no flowers and no animals drawn**, a pair
that is not a dragon / seat wind / prevailing wind, and:

- On a **discard** win (including 抢杠): the wait must be **two-sided or wider**.
  An in-between (嵌张), edge (边张) or pair (单钓) wait forfeits the 4 tai.
- On a **self-draw**: a single wait is allowed, **except** when all four
  sequences are melded and the player waits on one tile — then 平胡 is
  forfeited even on self-draw.
- Forfeiting 平胡 forfeits the 4 tai **entirely** — it does *not* fall back to
  Lesser Sequence. `TT`: "the four point awarded to the Sequence Hand does not
  count. He can, however, still win the game by virtue of other points he has
  already scored". Confirmed by `TT` §Robbing the Kong: robbing on a single
  wait "will only give the winning player 1 point upon mahjong as the 平胡 rule
  is not in effect" — 1 for 抢杠 alone, not 1 + 1.
- Lesser Sequence (1) is reached **only** via the flowers/animals route, and
  carries **no** wait restriction of its own.
- Consequence: an all-chow hand with no bonus tiles, won on a single wait by
  discard, scores 0 and is **not a valid win**.

`TT` §Sequence Hand, verbatim on all clauses.

## R6 — Named Full Flush combinations are fixed totals, not free stacking

**Ruling** (`TT` §Full Flush):

| Hand | Tai | `TT` wording |
|---|---|---|
| 清一色平胡 Full Flush Sequence | `min(10, limit)` | "generally awarded 10 points, or the limit" |
| 清一色碰碰胡 Full Flush Triplets | `min(8, limit)` | "will score 8 points (2 for the hand itself, 2 for a Triplets Hand, and 4 for a Full Flush Hand), or the limit" |
| 清一色小平胡 Full Flush Lesser Sequence | `5` | "wins a total of 5 points, 1 for the Lesser Sequence Hand and 4 for Full Flush" |

Full Flush Triplets is **8, not 6** — `TT` adds an explicit +2 "for the hand
itself" beyond 碰碰胡 2 + 清一色 4. This is why these are named hands with
fixed totals rather than emergent sums.

## R7 — Limit-hand tai values

**Ruling:** each scores `min(raw, limit)`; those marked *limit* score the limit
exactly.

| Hand | Value | Source |
|---|---|---|
| 大三元 Three Great Scholars | `min(10, limit)` | `TT`: "10 points, or the limit, whichever is the smaller" |
| 大四喜 Four Great Blessings | limit | `TT` |
| 十三幺 Thirteen Wonders | `min(13, limit)` | `TT`: "thirteen points, or the limit, whichever is the smaller" |
| 杠杠胡 Kong on Kong | `min(10, limit)` | `TT` |
| 清么九 Pure Terminals | limit | `TT` |
| 字一色 All Honours | limit | `TT` |
| 九连宝灯 Nine Gates | limit | `TT` |
| 四暗刻 Hidden Treasure | limit | `TT` |
| 十八罗汉 Eighteen Arhats | limit | `TT` |
| 天胡/地胡/人胡 Heavenly/Earthly/Humanly | limit | `TT` |
| 花胡 Eight Flowers | limit | `TT` |

`SMC`/`SGM` give raw 9 for 清么九 and 8 for 十三幺. `TT` is specific and states
13 for 十三幺; under the default limit of 5 every one of these scores 5, so the
divergence is only observable at a raised limit. `TT` followed.

## R8 — Small hands are fixed totals

- 小三元 Three Lesser Scholars = **3** — `TT`: "three points (one for the eye
  pair, and two for the pong/kong of the other two Dragon tiles)". The two
  dragon triplets are *inside* the 3; they are not added again.
- 小四喜 Four Lesser Blessings = **2 for the hand**, plus the ordinary seat /
  prevailing wind triplet bonuses — `TT`: "score three or four points (two for
  the hand itself, plus the bonus points for a pong/kong of the prevailing
  wind and/or player wind)".
- 混么九 Mixed Terminals = **4** — `TT`: "scores 4 points (2 for triplets and 2
  for mixed terminals)". Includes 碰碰胡; not added again.

**Extension (R8a): the named honour hands are fixed totals.** `TT` prices
大三元 at "10 points, or the limit" and 大四喜 at "the limit" as whole-hand
values, exactly as it prices 小三元 at 3 "one for the eye pair, and two for the
pong/kong of the other two Dragon tiles". The constituent dragon and wind
triplets are already inside those numbers and are **not** added a second time.
The same reasoning gives R6 its fixed Full Flush totals. Small Four Winds is
the one exception `TT` states outright — its 2 is "for the hand itself, **plus**
the bonus points" for seat/prevailing triplets.

**Extension (R8b): a limit-hand award prices the whole hand.** The hands `TT`
awards "the limit" or a fixed 10 for — 字一色, 清么九, 九连宝灯, 四暗刻,
十八罗汉, 大三元, 大四喜, 杠杠胡 — absorb **every** shape, dragon and wind
component. Nothing is added on top of them except the bonus tiles and the
win-circumstance points, which are properties of the draw rather than of the
tiles. Rationale: these are whole-hand prices, and `TT` never adds a shape
bonus to one. Without this, 大四喜 would stack with 混么九 and 十八罗汉 with a
seat-wind kong, pricing the same tiles twice.

The *partial* hands are different and do **not** absorb: 小三元 and 小四喜 sit
inside an ordinary hand, so 混一色 stacks with them normally — a Small Four
Winds hand is always one suit plus honours, and is always also a Half Flush.
绿一色 likewise absorbs only the flush it is priced against (R4a), leaving the
Green Dragon triplet point intact.

**Extension (R8c): absorption follows the tiles.** A limit-hand award absorbs
the components drawn from the *same tiles* and nothing else.

| Component family | Comes from | Absorbed by |
|---|---|---|
| shape, dragons, winds | the 14+ hand tiles | every tile-priced limit hand |
| bonus (flowers, seasons, animals) | the bonus tiles | 花胡 Eight Flowers only — it is priced for those very tiles |
| circumstance (門清, 抢杠, 海底, 花上/杠上) | how the winning tile arrived | never |

So a self-drawn concealed 十三幺 scores its 13 (or the limit) **plus** 门清,
and a 八仙过海 does not also collect the flower points it was already paid for.

**Extension (R8d): the referee refuses unprovable claims.** Ping Hu's 4 tai
require a wait of at least two tiles, so they are not awarded when the winning
tile is unknown — an unverifiable claim fails rather than passing. Likewise
天胡 is refused from any seat but the dealer's, 地胡 and 人胡 are refused from
the dealer's seat, 杠杠胡 is refused with fewer than two kongs, and 包 is
refused on a self-draw, which by definition has no discarder.

## R9 — Winds

`TT` §Winds: a triplet of the seat **or** prevailing wind = 1. If seat ==
prevailing, that single triplet = **2**. Holding triplets of both a (different)
seat wind and prevailing wind = 2, one for each.

## R10 — Bonus tiles

`TT` §Flower Tiles / §Animal Tiles:

- Flower/season matching the seat (正花) = **1 each**. Non-matching (偏花) = 0.
- Complete group of 4 same-colour flowers (一台花) = **2 total** (1 own + 1 for
  all four) — not 4.
- Each animal = 1; **all four = 5 total** (4 + 1 extra).

## R11 — Payments

`TT` payout tables, corroborated verbatim by `MP`, `GB`, `MK`, `SS`, and v1:

Let `base = 2^(tai − 1)` in units of the agreed 1-tai stake.

| Win | Discarder pays | Each other loser pays | Winner gains |
|---|---|---|---|
| Discard | `2 × base` | `1 × base` | `4 × base` |
| Self-draw | — | `2 × base` (all three) | `6 × base` |
| Pao (包) | `4 × base` | 0 | `4 × base` |

Pao: `TT` §Paying for all players — the discarder pays "for the other two
losing players, in addition to their own (the other two losing players are
vindicated — they do not pay anyone anything)".

**No dealer multiplier.** Every published Singapore payout table is
seat-independent. The dealer's only significance is wind rotation. (Hong Kong
Old Style *does* double for the dealer — that is Run 3, not this variant.)

## R12 — Thirteen Wonders payment

`TT` §Thirteen Wonders: "all players pay double that of the limit, regardless
if the hand was won on a self-picked (自摸) tile or not."

**Ruling:** 十三幺 is always paid as though self-drawn — all three players pay
`2 × base` each, winner gains `6 × base` — **even on a discard win**. "Double"
is read as the doubled (self-draw) per-player rate, which is what makes the
sentence's "all players pay" true on a discard.

**RATIFIED BY THE OWNER, 2026-08-30**, on the advice of their mahjong-expert
advisor: keep this reading. 十三幺 is paid at the doubled rate by all three
players however it was won. This is no longer interpretive — the owner's ruling
is the citation, and changing it requires the owner, not a document.

## R13 — "Special hands paid double" is NOT a general rule

v1: "Special hands (limit hands) are always paid double, regardless of
self-draw or discard."

**Ruling:** not applied generally. In `TT` the sentence "The payout for special
hands will be double" sits inside the section describing the *alternative*
3/6 and 1/2 payout conventions, and no individual limit-hand entry repeats it.
Only 十三幺 states a doubling rule in its own section (see R12). Exposed as the
option `doubleSpecialHandPayout`, **default off**.

## R14 — Minimum and limit

`TT`: minimum 1 tai (起胡) — a 0-tai hand is **not a valid win**. Limit
"typically five points, though this has to be agreed among players" — default
5, configurable. Both corroborated by `SMC`, `SGM`, `SS`.

## R16 — The dealer keeps the deal on a washout *(needs owner confirmation)*

**Ruling:** when a hand ends with nobody winning (荒牌), the deal does **not**
pass — the same player deals again, and the round does not advance.

`TT` describes stalemates (§Winning on the Last Available Tile Note 2) but never
says what happens to the deal. This is the common Singapore convention and the
one most tables play, so it is what `advanceTable` implements.

**Flagged for the owner.** Some tables pass the deal on a washout instead. If
that is how the owner's table plays, this is a one-line change in
`src/engine/variants/singapore/table.ts` plus its test, and the owner's word
becomes the citation the way it did for R12.

## R15 — Out of scope for Run 1

Deliberately not modelled, and not in the corpus: 七抢一 Robbing the Eighth,
诈胡 fake-hand penalties, 小相公/大相公 short/long hand penalties, sacred and
missed discard prohibitions, and the mid-game instant payouts' *doubling*
before 补花. Instant payouts themselves (咬到 / 暗杠 events) **are** modelled.

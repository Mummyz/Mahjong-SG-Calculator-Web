# Ruling log — Hong Kong Old Style (香港舊章 / 清章)

Every point where the sources disagreed, or where a number had to be chosen
rather than looked up. Each ruling is the authority the Hong Kong corpus is
written against. Changing one requires a new citation, not a failing test.

Source families, as named in
[`hongkong-old-style-reconciliation.md`](./hongkong-old-style-reconciliation.md),
which is the evidence this file decides on:

| Family | Source |
|---|---|
| **A** | Cantonese & Chinese Wikipedia — 香港蔴雀食糊牌型, 香港蔴雀, 香港麻雀常用番種. The most complete self-identified 清章/舊章 source: a full fan table, a full-payment money table, and the liability rules. |
| **B** | mahjong.wikidot.com — *Hong Kong Old Style* scoring / overview / gameplay. Splits HKOS into "Clear Chapter" and "New Chapter". |
| **C** | 香港麻雀協會 (Hong Kong Mahjong Association) tournament rules — the official body. |
| **D** | Alan Kwan Shiu Ho, 中庸麻雀史觀 第七章 — a named author deriving how 舊章 came out of Chinese Classical. Decisive on payment and the dealer. |
| **E** | English Wikipedia, the sections explicitly headed *Old Hong Kong*. |

**Rulings marked 🚩 need the owner's ratification**, like Singapore's R12 and
R16. They are places where the sources genuinely split and somebody has to
choose.

---

## HK1 — The tile set is 144, and there are no animals

**Ruling:** 108 suited + 16 winds + 12 dragons + 4 flowers + 4 seasons = 144.

`A`: 「標準嘅香港蔴雀會使用上述144隻牌。」 · `E`: "Old Hong Kong mahjong is
played with a standard set of 144 mahjong tiles."

Animals are a Singapore addition and appear in no Hong Kong source. `E` places
them elsewhere explicitly: "In Singapore and Malaysia an extra set of bonus
tiles of four animals are used."

## HK2 — Minimum three faan, configurable

**Ruling:** default **3**, settable.

`A`: 「食糊最少要有三番，叫做「三番起糊」。」 · `B` dates it: "1970s: The 3-3
System is adopted. Hands must be 3 Fan to go out." · `E`: "the player needs to
have at least the minimum *faan* value agreed in advance (often 3)."

`D` is the dissent, and it is a dissent about status rather than value:
「「三番起和」及所謂「全銃」流行了起來…不知道其實是近年的演變。」 — mainstream, but recent.
Mainstream is what a calculator should default to.

## HK3 — 🚩 The cap is ten faan by default, configurable

**Ruling:** default **10**, settable.

`C`, the only official body, sets 10 (「以10番為上限」). `B`: "Most players set a
maximum Fan limit. 10 is common." `A` names three: 「一般會採用八番例牌、十番例牌或者十三番例牌」.

**Flagged.** 8 and 13 are equally attested. Ten is the official body's answer
and the modal one, so it is the default; a table that plays 8 or 13 sets it.
The cap matters more here than in Singapore, because HK7's limit hands are
priced at 13 and are therefore clipped by it.

## HK4 — 🚩 Full payment (全銃制) by default, half payment configurable

**Ruling:** on a **discard**, the discarder pays the winner's whole score and
the other two pay nothing. On a **self-draw**, each of the three pays half that
score, so the winner collects one and a half times a discard win. **The
self-draw side is the same under both conventions and is not a setting.**

Both conventions are real, both are named in Cantonese, and they differ *only*
in how the discard loss is split — the totals are identical. Writing `S` for
the winner's score at that faan count:

| | Discard | Self-draw |
|---|---|---|
| **Full payment 全銃制** | discarder `S`, others 0 | each of three pays `S/2` → winner `1.5S` |
| **Half payment 陪銃制 / 出銃么二制** | discarder `S/2`, others `S/4` each | each of three pays `S/2` → winner `1.5S` |

`D` shows half payment is the historically original one, and the very thing
that created 舊章: 「其實從古典麻雀演變到舊章麻雀，只需要從兩點出發：廢除副點（光算番數），及把授受法轉為「出銃么二制」。」
`A` corroborates: 「傳統廣東麻雀是陪銃制…」. `D` calls full payment a modern
import: 「舊章本來是採用「出銃么二制」的，但近年受了日本麻雀及台灣麻雀等影響，也流行起所謂「全銃」」.

**But every source that prints an actual money table prints it for 全銃**:
`A`'s only table is headed 「分數計算（全銃制）」, and `C`, the official body,
offers only full payment: 「得分授受法 1.全銃：食出銃時由出銃者包付所有分數。」

**Flagged.** Full payment is the default because it is what the published
tables and the official rulebook use; half payment ships as a setting because
`D` and `A` say it is the older one. The sources genuinely split, which is
exactly the condition for making something configurable rather than choosing.

## HK5 — There is no dealer multiplier

**Ruling:** the dealer neither pays nor receives double. This is an
affirmative finding, not a silence.

`D` explains that the doubling was moved *off* the dealer and onto the
discarder, and that this is what made 舊章: 「要付雙倍的不是莊家，而改為由放銃者取代。」
`B` states it flatly: "Dealer Bonus | None", "Dealer Curse | None". `A` and
`C`'s payment tables carry no dealer row, column or note.

`E` alone describes dealer doubling, inside a base-point system no other Old
Style source uses — and `D` identifies exactly that system (「莊家么二制」) as the
Chinese Classical *predecessor* Old Style replaced. `E` is describing the
ancestor. **Do not implement a dealer multiplier.**

This is a real difference from Singapore, and the biggest single structural one.

## HK6 — The dealer repeats on a dealer win

**Ruling:** unanimous across `A`, `B`, `C`, `E`. `B`: "If East wins the Hand,
the Seat Winds do not rotate. East gets to be Dealer again."

## HK7 — 🚩 The dealer keeps the deal on a washout

**Ruling:** the dealer keeps the deal, matching Singapore's R16.

Genuinely split, and split *within* single sources. Keeps: `A` 「如果冇任何玩家贏出（即係流局）…就要「冧莊」」, `E`. Passes: `B` "If Non-East wins the Hand
**or if it's a Draw**, the Seat Winds rotate", `C` 「流局時莊家不會連莊」 — while
`C`'s own 輪莊 clause says the opposite. `A` gives both, calling the pass a
time-saving shortcut.

**Flagged.** Chosen to match the Singapore behaviour the owner already
ratified in R16, so one table module serves both variants.

---

## HK8 — The fan table is compositional, not a lookup

This is the ruling the whole corpus rests on, so it is stated as a method
before it is stated as numbers.

**Ruling:** where a source writes a hand's value as a *sum* and says so, this
engine awards the parts, not the printed total. Where a source prints a flat
number with no decomposition, the engine awards that number.

`A` decomposes four hands explicitly and each time gives both the parts and the
convenience total:

- 小三元: 「小三元本身計三番，再加兩番三元牌刻子的番數，為方便計算直接寫成五番」
- 大三元: 「大三元本身計五番，再加三番三元牌刻子的番數，為方便計算直接寫成八番」
- 小四喜: 「小四喜本身單計三番，必然至少伴隨混一色或對對糊任何一種，兩者均為加三番；為方便計算直接寫成六番」
- 花幺: 「花幺本身計一番，再加對對糊三番，為方便計算直接寫成四番」

`C` reaches the same totals by the same route: 「小三元…另外加計三元牌，實為五番。」,
「大三元…另外加計三元牌，實為八番。」, 「花么…加計對對糊。」

Awarding the parts reproduces every published total exactly **and** explains
the numbers a lookup table cannot: `A` says 小四喜 「最少有九番」 in practice,
which is 3 + 混一色 3 + 對對糊 3 — unreachable if 小四喜 is a flat 6.

The same method dissolves three apparent 1-vs-2 conflicts, where one source
prints the total and another counts the self-draw separately:

- 槓上開花: `A` 「外加自摸另計共兩番」 = 1 + 1. `B` "Dead Wall Win | 1" + "Self-Drawn Win | 1".
- 海底撈月: `A` 「若為自摸則另計再加一番」 = 1 + 1. `C` 「海底撈月」 1 + 自摸 1.
- 花糊: `A` 「計兩番加自摸一番」 = 2 + 1 = 3.

### HK8a — Component values

**Shape** — one per hand, and they are mutually exclusive by definition:

| Key | Hand | 中文 | Faan |
|---|---|---|---|
| `commonHand` | All sequences | 平糊 | 1 |
| `allTriplets` | All triplets | 對對糊 | 3 |
| `fourConcealedTriplets` | Four concealed triplets | 坎坎糊 | 8 |

**Flush** — one per hand, stacks with shape:

| `halfFlush` | One suit plus honours | 混一色 | 3 |
|---|---|---|---|
| `fullFlush` | One suit, no honours | 清一色 | 7 |

**Terminals** — stacks with shape and flush:

| `mixedTerminals` | Terminals and honours only | 花幺 / 混么九 | 1 |
|---|---|---|---|

**Dragons** — the triplets and the named hand both score:

| `dragonTriplet` | each pung or kong of 中/發/白 | 番子 | 1 |
|---|---|---|---|
| `smallThreeDragons` | two dragon triplets + dragon pair | 小三元 | 3 |
| `bigThreeDragons` | three dragon triplets | 大三元 | 5 |

**Winds** — likewise:

| `seatWind` | triplet of your own wind | 門風 | 1 |
|---|---|---|---|
| `prevailingWind` | triplet of the round wind | 圈風 | 1 |
| `smallFourWinds` | three wind triplets + wind pair | 小四喜 | 3 |

A triplet that is both seat and prevailing scores both lines, which is `C`'s
「門風及圈風重疊時計兩番。」 and `A`'s 「俗稱的「雙番東」」.

**Circumstances:**

| `selfDraw` | won off the wall | 自摸 | 1 |
|---|---|---|---|
| `fullyConcealed` | no claimed sets and no kongs | 門前清 | 1 |
| `robbingKong` | won on a tile being added to a pung | 搶槓 | 1 |
| `lastTile` | self-drew the last wall tile | 海底撈月 | 1 |
| `lastDiscard` | won on the last discard | 河底撈魚 | 1 |
| `kongReplacement` | self-drew the replacement after a kong | 槓上開花 | 1 |
| `kongOnKong` | two kongs in a row, then the replacement | 連槓開花 | 8 |

**Bonus tiles:**

| `seatFlower` | the flower matching your seat | 正花 | 1 |
|---|---|---|---|
| `seatSeason` | the season matching your seat | 正花 | 1 |
| `completeFlowerGroup` | all four flowers | 一台花 | 2 |
| `completeSeasonGroup` | all four seasons | 一台花 | 2 |
| `noFlowers` | no bonus tiles at all | 無花 | 1 |

`A`: 「一檯花：集齊同一系列的花牌…不再計同系列的正花」 — a complete set scores 2
and **replaces** the 正花 1 from that same series; it does not add to it.

### HK8b — Whole-hand awards (例牌)

These price the entire hand. Per HK10 they suppress every shape, flush,
terminal, dragon and wind component; circumstance and bonus faan still add,
and the cap then clips the total.

| `allHonours` | 字一色 | **10** | `A` files it under 「十番（例牌）」 · `B` "All Honors \| 10" · `C` 例牌 |
|---|---|---|---|
| `pureTerminals` | 清幺九 | **10** | `A` 「清幺九…例牌不另計其他牌型」(十番) · `C` 例牌十番. `B` omits the hand. |
| `nineGates` | 九子連環 | **10** | `A` 10 and `C` 10; `B`'s 15 is one family — see HK11 |
| `thirteenOrphans` | 十三么 | **13** | `A` 例牌 13 |
| `bigFourWinds` | 大四喜 | **13** | `A` 例牌 13 — see HK11 |
| `eighteenArhats` | 十八羅漢 | **13** | `A` 例牌 13 — see HK11 |
| `heavenly` | 天糊 | **13** | `A` 例牌 13 — see HK11 |
| `earthly` | 地糊 | **13** | `A` 例牌 13 — see HK11 |
| `humanly` | 人糊 | **13** | `A` 例牌 13, 「部份規例僅計三番」 — see HK11 |
| `sevenFlowers` | 花糊 | **3** | `A` 「集齊七隻花牌可即時食糊，計兩番加自摸一番」 |
| `eightFlowers` | 大花糊 | **8** | `A` 「摸齊八隻花可即時糊牌，計八番自摸」 · `B` "8 Flowers & Seasons \| 8" · `E` |

**花糊 and 大花糊 override everything.** Both are declared the instant the
seventh or eighth flower is drawn — `A`: 「集齊七隻花牌可即時食糊」, 「摸齊八隻花可即時糊牌」 — so the tile hand cannot have been completed afterwards. When the
flower count reaches seven, that award is the whole score and the ordinary
patterns are not read at all; both are settled as a self-draw however the tile
that triggered them arrived (「計八番自摸」, 「當三番自摸」), and neither is subject
to the minimum. This mirrors how Singapore prices Eight Flowers.

At the default cap of 10 the five 13-faan hands all show 10, which is what a
table playing the HKMA cap sees. Pricing them at 13 rather than "the cap"
means raising the cap to 13 produces the right answer instead of the same one.

## HK9 — 🚩 The six conflicted hands, decided

Every one of these is `A` against `B`. `C` flattens limit hands to its own cap
(「例牌一律算10番」), so `C`'s 10 is a cap artifact and **not** a third vote.

| Hand | `A` | `B` | Chosen | Why |
|---|---|---|---|---|
| 小四喜 | 6 composed (3 + a 3-faan shape) | 10 flat | **3 component** | `A` decomposes it and `E`'s old-HK section gives 6; reproduces both `A` numbers (6 and 「最少有九番」). `B`'s flat 10 is cap-level. |
| 大四喜 | 13 例牌 | 15 | **13** | `A` + `E` new-style; `B` + its dependent are one family. Invisible at any cap ≤ 13. |
| 十八羅漢 | 13 例牌, 「不同規例中作十至十八番計不等」 | 18 | **13** | `A` declares the 10–18 spread itself. `B` contradicts itself across its own tabs (18 vs 12). |
| 九子連環 | 10 | 15 | **10** | `A` + `C` agree, and `C` is not merely capping — 10 is also `A`'s raw number. |
| 天糊 / 地糊 | 13 例牌 | 10 | **13** | Split 2–2. `A` warns 「「天糊」同「地糊」等奇牌，一定要事先說明例牌番數」 — agree before play; the cap setting is where a table does that. |
| 坎坎糊 | 8 | 8 (in a block `B` itself flags as contested) | **8** | Both families agree on 8. It replaces 對對糊 rather than adding to it — 8 is quoted as the hand's value, and every 坎坎糊 is trivially a 對對糊. |

**Flagged as a group.** None of these has a fact behind it. `A` footnotes an
explicit spread on nearly every large hand — 清一色 「六至十番」, 大三元 「五至八番甚至例牌」, 坎坎糊 「五至八番甚至例牌」, 花么九 「三至六番」 — and `B` says the
quiet part out loud: "Perhaps the NEW18 standard is in fact not standardized at
all." Any single Hong Kong fan table is an editorial choice, and this is ours.

## HK10 — 例牌 do not stack with ordinary patterns

**Ruling:** a whole-hand award suppresses shape, flush, terminal, dragon and
wind components. Circumstance and bonus faan still add, then the cap clips.

`A` states non-stacking per hand — 清幺九 「例牌不另計其他牌型」 — but reverses it
for unlimited play, and the sentence it reverses it in is the one that settles
this ruling: 「賭得比較大嘅人會選擇打無限番，呢個時候例牌亦都按普通番種計算番數（例如大四喜複計混一色對對糊或者字一色，加起嚟就超過十三番例牌）」. `A` raises the exact case where
the composed sum **exceeds** the 例牌 — naming 字一色 in its own example — and
confines that treatment to 無限番. Since this engine always has a cap (HK3),
non-stacking governs. It also matches Singapore R8b/R8c, so one mental model
covers both variants.

**This is a suppression, not a preference.** When a 例牌 applies, the components
it suppresses are not scored *even when they would add up to more*. A 字一色
that is also 大三元 with a doubled wind composes to 18 faan and scores 10, and
the player is told they have 字一色. Reading it as "take whichever is larger"
would pay three times the right amount at a 13-faan cap and would never print
the name of the hand that was actually won.

The named dragon and wind hands (小三元, 大三元, 小四喜) are **not** 例牌 and do
not suppress anything — HK8 shows the sources composing them.

## HK11 — Seven Pairs is not a winning hand

**Ruling:** 七對子 does not win.

`A` files it under 自訂牌型 with the header 「以下牌型並唔係標準「清章」蔴雀所有」 and
states 「若只接受標準「清章」牌型，則不算有效的食糊牌型」. `C`, the official rulebook,
is silent — it appears nowhere in the fan list. `B` scores it 5, inside a block
`B` itself flags as contested. `E`'s old-HK section says 4. Four different
answers (invalid / 3 / 4 / 5) and an omission from the rulebook is not a hand
to implement.

Jade / Ruby / Pearl Dragon are excluded on the same basis: `B` only, absent
from every Chinese source and from the official rulebook.

## HK12 — 門前清 scores on a discard, and any kong breaks it

**Ruling:** 1 faan when the hand contains no melds at all — no chow, no pung,
**and no kong, concealed or otherwise**. It does **not** require a self-draw.

Both sources that have the hand agree on the kong point, from opposite
directions: `A` 「沒有上、碰、槓（包括暗槓）任何牌而食糊」 and `C` 「所有手牌皆為暗手，沒有明章。（暗槓屬於明章）」 — a concealed kong counts as exposed. Neither
mentions self-draw as a condition.

Two differences from Singapore worth stating plainly, because they will look
like bugs otherwise: Singapore's 门清 **requires** a self-draw and **tolerates**
a concealed kong; Hong Kong's 門前清 requires neither and tolerates neither.

## HK13 — 🚩 門前清 scores even when flowers are in play

**Ruling:** it scores. `A` adds a caveat that it is not counted in flower play
(「如果有打花牌就不計門前清這個番種」); `C` scores it with no such caveat; `B` omits
the hand from its Old Style list entirely.

**Flagged, and it is the weakest ruling in this file.** `A`'s caveat and `B`'s
omission point the same direction. Chosen to follow `C`, the official body, and
to avoid a rule with a hidden exception — but a table that plays `A`'s way is
not wrong.

## HK14 — 平糊 has no pair restriction and no wait restriction

**Ruling:** four chows and any pair. The pair may be a dragon, the seat wind or
the prevailing wind, and the wait does not matter.

`A`: 「只有順子、沒有刻子的牌型」 · `C`: 「手牌有四個順子﹐沒有坎/槓。」 Neither restricts
the pair or the wait. `E` alone says "a pair of suited tiles"; two Chinese
families against one English summary.

This is a real difference from Singapore, where R5 restricts both the pair and
the wait. A hand that is Ping Hu in Hong Kong may not be in Singapore.

## HK15 — A flower replacement scores nothing

**Ruling:** winning on the replacement tile drawn after a flower scores no
faan of its own — only the ordinary 自摸 1.

`A` states the exclusion inside the kong-replacement rule itself:
「明/暗/加槓後自摸，補花後不算，外加自摸另計共兩番」 — after a kong it counts, after a
flower it does not. No Hong Kong source awards a flower-replacement faan.

Another live difference from Singapore, which pays 补花 1 tai.

## HK16 — Bonus-tile faan does not count toward the minimum

**Ruling:** 正花, 一台花 and 無花 score, but a hand that only reaches the minimum
because of them is not a legal win.

`E`: "Bonus tiles and a few other elements are not included in the minimum
*faan* value a player needs to form a legal winning hand… in a three *faan*
minimum game, if a player has two *faan* points and one bonus point, the player
has not met the proper requirements to win."

Another difference from Singapore, where R14's 1-tai minimum can be met by a
bonus tile alone. Note that 花糊 and 大花糊 (HK8b) are instant wins and are not
subject to the minimum at all.

**The narrowing to those three lines is editorial.** `E` writes "Bonus tiles
**and a few other elements**" and never enumerates the other elements; no other
source addresses the question at all. This engine reads the open set as exactly
the flower-derived lines — 正花, 一台花, 無花 — because those are the ones `E`
names, and counts everything else, 自摸 included, towards the minimum. A table
that excludes more than that is not contradicted by anything archived here.

## HK17 — The money curve is half-spicy, and `base` is the winner's discard total

**Ruling:** the winner's score doubles every **two** faan above four, and the
number the engine reports as `base` is `A`'s 出銃 column — the amount a
discarder hands over under full payment, which is also the winner's total on a
discard win under either convention.

`A`: 「傳統蔴雀以四番為滿糊，隨後以半辣上，每兩番先至跳一倍。」 `C` uses the same term in
its own table header: 「分數按100底半辣上計算」.

`A`'s table, internally consistent across fourteen rows, is the base:

| faan | 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 |
|---|--|--|--|--|--|--|--|--|--|--|--|--|--|--|
| `base` | 1 | 2 | 4 | 8 | 16 | 24 | 32 | 48 | 64 | 96 | 128 | 192 | 256 | 384 |

Closed form: `n ≤ 4 → 2ⁿ`; even `n > 4 → 16 × 2^((n−4)/2)`; odd `n > 4 →
24 × 2^((n−5)/2)`.

`C`'s table is this one multiplied by 4 at every rung from 3 to 10 — a
different chip size, the same curve. `B` prints the identical column through 10
faan and diverges at 11 and 12 (196, 264) with no formula and against two other
sources; `A`'s 192 and 256 are followed.

`A`'s prose base statement (「全銃制係出銃者16個籌碼」 at 3 faan) contradicts its own
table (8), and a 16 discard against a 12 self-draw total would invert the 1.5×
ratio the whole table is built on. **Unresolved, and not guessed at**: the
table wins, being consistent across every row.

## HK18 — 包 (pao) is a discard-only rule here

**Ruling:** with `pao` set on a discard win, the discarder pays the winner's
whole total and the other two pay nothing — under **either** payment
convention. Pao on a self-draw (包自摸) is **not modelled**.

The liability devices themselves are well attested — `A` under 全銃制:
「清一色落地：十二章落地…要包自摸。…大三元落地：中發白落地包自摸…大四喜落地：東南西北落地包自摸…十八羅漢落地：四槓落地包自摸」, and `C` names 「十二章包（張張包）」 and
「大三元包」. But every one of them is a 包自摸, and the app's submit wizard asks
who *discarded*; there is nowhere to name a liable player on a self-draw. Wiring
that is a UI change, not a scoring change, and it is not in this run's scope.

Under full payment, pao on a discard is arithmetically identical to an ordinary
discard win. It only changes the numbers under half payment — which is exactly
what `A` describes: 「如果打陪銃制：任何食糊嘅九章落地包出銃（包一半）、十二章落地包自摸。」

## HK19 — 搶槓 is paid as an ordinary discard win

**Ruling:** robbing the kong scores 1 faan and is settled like any other
discard win.

`C` alone gives a different settlement: 「搶槓當自摸：搶槓視為開槓者出銃，加計一番，但支付分數時按「自摸」計算」 — the kong declarer is the discarder, +1 faan, but the
money is computed as a self-draw. That is a 包自摸 in disguise, and HK18 says
why it is not modelled. A table that plays `C`'s way ticks the pao box, which
makes the kong declarer pay everything — the same practical outcome under full
payment.

## HK21 — 坎坎糊 means no set was claimed; a concealed kong still counts

**Ruling:** four concealed triplets requires every set to be a pung or a kong
and none of them claimed from another player. A concealed kong (暗槓) qualifies.
How the last tile arrived is not modelled.

No Hong Kong source defines the hand beyond its name. `A` files 坎坎糊 under
其他非常用番種 with a value and nothing else; `B` lists it in a block it flags as
contested. The name itself is the only definition available: 坎 is a concealed
triplet, and 暗槓 is one of those — which is why `A` and `C` both have to say
*separately* that a concealed kong breaks 門前清 (HK12). If a concealed kong
were not a concealed triplet, that clause would be unnecessary.

The stricter reading many rulesets use elsewhere — that winning on a discard
demotes the completed triplet and costs the hand — has no Hong Kong citation,
so it is not implemented. A table that plays it is playing a rule this file
cannot source.

## HK22 — Circumstance faan combine unless a source excludes them

**Ruling:** two circumstances that both apply both score. The only exclusion in
the Hong Kong sources is the flower replacement in HK15.

`A` writes exactly one exclusion — 「補花後不算」, inside the kong rule — and
writes no others. Singapore's `TT` excludes 海底撈月 when the last tile came
through a kong or flower replacement; no Hong Kong source says anything of the
kind, so winning on the last wall tile off a kong replacement scores both here
and only one of them there.

## HK23 — Circumstance faan require the circumstance

**Ruling:** a flag that contradicts how the hand was won scores nothing, and
the three seat hands require a hand nobody has claimed into.

The sources define these hands by their circumstances, not merely by a name:

| Faan | Requires | Source |
|---|---|---|
| 槓上開花 | a self-draw | `A` 「明/暗/加槓後自摸」 — 自摸 is inside the definition |
| 連槓開花 | a self-draw | `C` 「槓上槓 自摸連續開兩個槓之後食糊。」 |
| 搶槓 | a discard | `A` 「即可搶其槓食糊」 — the tile is another player's |
| 天糊 | the dealer, a self-draw, and no claimed set | `A` 天糊 is the dealer's dealt hand |
| 地糊 | a non-dealer, a discard, and no claimed set | `A` 地糊 is a win on the dealer's first discard |
| 人糊 | a non-dealer and a discard | `A` 「開局第一輪即食別家出銃」 |

The kong count was already a precondition; the win method was not, so a
discard win carrying a `kongOnKong` flag scored 連槓開花's eight faan — a hand
that cannot exist, priced at eight times the truth.

**天糊 and 地糊 additionally require `melds.length === 0`.** 天糊 is the dealer
winning on the fourteen tiles they were dealt and 地糊 is a non-dealer winning
on the dealer's very first discard: in both, no player has had a turn, so no
set can have been claimed and no kong declared. 人糊 is not restricted this
way — it is a win somewhere in the first go-round (「第一輪」), by which point a
player may legitimately have claimed a discard.

The submit wizard already filters these combinations out of what it offers.
That is a convenience, not a guarantee: the engine is the authority and must
refuse them itself.

## HK20 — Out of scope for Run 3

Deliberately not modelled, and not in the corpus: 詐糊 false-win penalties
(`A`: 「食詐糊是要賠自摸最大番數」), 小相公/大相公 short and long hands, 七搶一, the
七對子 house hand (HK11), Jade/Ruby/Pearl Dragon, and the 雙辣 / 三辣 money
ladders `A` mentions for higher-stakes tables. Each would need its own rulings.



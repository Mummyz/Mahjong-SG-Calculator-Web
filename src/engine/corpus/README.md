# Golden corpus

Test hands with **expected fan / points / payments**, written from the canonical
rule sources, **independently of any engine code**, **before** the engine unit
that would satisfy them is accepted.

This is the Mahjong Rules Critic's enforcement weapon. It is the only thing
standing between "the calculator agrees with itself" and "the calculator is
correct".

## The rules of the corpus

1. **Sources first, code never.** A corpus entry is derived from the variant's
   canonical source — never from running the engine and recording what it said.
   - Singapore: official Singaporean scoring rules, incl. singaporemahjong.com
   - Hong Kong Old Style: documented HK Old Style scoring
2. **Every entry cites its source.** Rule name plus where it was read. An entry
   without a citation is not a corpus entry.
3. **The corpus is never edited to make an engine pass** unless the edit itself
   cites a source that shows the previous expectation was wrong. "The engine
   says otherwise" is not a source.
4. **Engine units are only accepted when the corpus is green.** Blocking, no
   exceptions, no "fix it next run".
5. **Written before the engine unit.** If the corpus is authored after the code
   it tests, it has already been contaminated by the code.

## Layout

One file per variant, e.g. `singapore.corpus.json` (Run 1),
`hongkong.corpus.json` (Run 3). Empty until Run 1 — deliberately.

Each entry carries, at minimum: the hand, the win condition (self-draw vs
discard, seat/prevailing wind, dealer or not), the expected fan, the expected
per-player payment breakdown, and the source citation.

---

## Layout (Singapore, Run 1)

`singapore/` holds ten files, 224 entries. Every entry carries a `cite`
pointing at `docs/sources/` — usually the archived Tabletopia ruleset (`TT`)
and the ruling in `docs/sources/RULING-LOG.md` that settled it.

| File | Covers |
|---|---|
| `01-basic-patterns.json` | Chicken Hand + minimum-point rule, Lesser Sequence, Sequence Hand and its wait restrictions, Triplets Hand |
| `02-flushes.json` | Half Flush, Full Flush, the named Full Flush specials, Pure Green Suit |
| `03-terminals-honours.json` | Mixed Terminals, Pure Terminals, All Honours + near-miss demotions |
| `04-dragons-winds.json` | Dragon triplets, the full seat/prevailing wind matrix, Small/Big Three Scholars, Small/Big Four Blessings |
| `05-limit-hands.json` | Nine Gates, Hidden Treasure, Thirteen Wonders, Eighteen Arhats, Heavenly/Earthly/Humanly, Eight Flowers, Kong on Kong |
| `06-bonus-tiles.json` | Own flower/season, non-seat flowers scoring zero, complete groups, animals and the all-four bonus |
| `07-win-circumstances.json` | Robbing the Kong, last available tile, kong/flower replacement, fully concealed, and their exclusions |
| `08-kongs.json` | Kong-aware hand sizes 14–18, exposed vs concealed |
| `09-payments.json` | TT's payout tables transcribed literally, limit configurability, pao, Thirteen Wonders payment |
| `10-invalid.json` | Hands that must be REJECTED |

## Tile notation

Space-separated groups. A group is either digits followed by a suit letter, or
a run of honour letters.

- Suits — `m` characters (萬), `p` dots (筒), `s` bamboo (索). `123m` → 1m 2m 3m; `99p` → 9p 9p
- Honours — `E S W N` winds, `C` red dragon (中), `F` green (發), `P` white (白). `EEE` → three East
- Bonus tiles live only in `hand.bonus`, never in `concealed`: `F1`–`F4` flowers, `S1`–`S4` seasons, `cat` `rat` `rooster` `centipede`
- Seat map for own flowers/seasons: East = 1, South = 2, West = 3, North = 4

`hand.melds` entries are `{"t": "chow"|"pong"|"kong", "tiles": "...", "open": bool}`.
`concealed` always includes the winning tile; `ctx.winningTile` names which one
it was, which is what the wait analysis needs.

## How payments were authored

`09-payments.json` transcribes TT's two payout tables **literally** — those
numbers were typed from the source, not computed. Every other file's payment
triple was expanded from those same published rules by the authoring helper, so
that 200-odd triples did not have to be typed by hand. If that expansion were
wrong, `09-payments.json` fails. The engine implements the arithmetic
independently.

---

## Layout (Hong Kong Old Style, Run 3)

`hongkong/` holds fourteen files, 226 entries. Every entry carries a `cite`
naming the ruling in `docs/sources/RULING-LOG-HK.md` that settled it and the
source family that ruling rests on, quoted from
`docs/sources/hongkong-old-style-reconciliation.md`.

| File | Covers |
|---|---|
| `01-shapes.json` | 平糊 / 對對糊 / 坎坎糊, which are mutually exclusive, and the 3-faan minimum |
| `02-flushes.json` | 混一色 and 清一色, and what does and does not break them |
| `03-terminals-honours.json` | 花幺, 清幺九, 字一色 — the two 例牌 and the one that is not |
| `04-dragons.json` | 番子 triplets, 小三元 and 大三元 as the sums their sources write |
| `05-winds.json` | 門風 / 圈風 / 雙番, 小四喜 and 大四喜 |
| `06-limit-hands.json` | 十三么, 十八羅漢, 九子連環, 天糊 / 地糊 / 人糊, and the cap |
| `07-circumstances.json` | 自摸, 門前清, 搶槓, 海底撈月 / 河底撈魚, 槓上開花, 連槓開花, 補花 |
| `08-bonus-tiles.json` | 正花, 一台花, 無花, 花糊, 大花糊 |
| `09-payments-full.json` | Family A's 全銃制 table, row by row, discard and self-draw |
| `10-payments-half.json` | The 陪銃制 2 : 1 : 1 split, and the self-draw rows that do not change |
| `11-minimum.json` | 三番起糊, what counts towards it, and the settings a table can pick |
| `12-kongs.json` | Hand sizes 14 to 18 |
| `13-invalid.json` | Hands that must be REJECTED, including animals |
| `14-variant-differences.json` | Tiles that score differently in the two variants |

### How the Hong Kong payments were authored

`09-payments-full.json` transcribes Family A's 「分數計算（全銃制）」 table one
row per entry — those base figures were typed from the source. Each row pins
the hand to an exact faan count by setting the cap, so the whole published
curve from 0 to 13 is covered without having to construct fourteen hands of
exactly the right value. `10-payments-half.json` does the same for the 2 : 1 : 1
split. Every other file's payment triple was expanded from those same published
rules by the authoring helper. If that expansion were wrong, file 09 fails.
The engine implements the curve independently, and
`hongkong.corpus.test.ts` checks `basePoints()` against the typed-out column.

---

## Layout (prediction, Run 4)

`predict/` holds one file, 26 entries, and it works differently from the two
scoring corpora because prediction is a SEARCH, not a rule.

Each entry asserts **structure** — which state the panel should be in, how far
from home the hand is, and which hands must or must not be on offer — and those
were written by hand from the tiles. On top of that,
`predict.corpus.test.ts` applies **invariants to every candidate of every
entry**, and those are the ones that matter:

| Invariant | What it stops |
|---|---|
| Every fan figure is re-derived from the variant's own `score()` | A suggestion worth less than it claims |
| No suggestion uses a fifth copy of any tile | A hand that cannot be built |
| No suggestion names a tile the variant does not play | An animal on a Hong Kong table |
| The declared melds and flower tray come back untouched | A plan that quietly discards a claimed set |
| Every suggestion is exactly the hand size the variant asks for | Kong arithmetic going wrong |
| The stated distance equals the tiles asked for | "Three away" that needs four tiles |
| Every discard names a tile actually held | Being told to throw away something you do not have |
| No two suggestions are the same hand | Four rows that say one thing |

The design rule the module is built around is that **the predictor proposes and
the scorer certifies**. There is no fan table in `src/engine/predict/`, and
there must never be one: every candidate is a complete, legal hand that has
been through the variant's own `score()`, and the number reported is the number
that scorer returned. A fan claim is a rules claim, so entries that assert a
specific value cite the ruling behind it.

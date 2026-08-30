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

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

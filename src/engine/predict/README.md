# Prediction — what it does, and what it deliberately does not

**The predictor proposes; the scorer certifies.** There is no fan table in this
directory and there must never be one. Every candidate is a complete, legal
hand that has been through the variant's own `score()`, and every number
reported came back from that scorer.

## The certification

A hand is not worth one number. Which of the missing tiles arrives **last**,
and whether it is **drawn or claimed**, both change the answer:

- Singapore's 平胡 (RULING R5) forfeits its four tai on a closed wait, and an
  all-chow hand that forfeits it scores nothing at all — so the same finished
  hand is worth 4, or is not a legal win, depending only on the order.
- Hong Kong's ordinary concealed hand (HK8a, HK2) reaches three faan only once
  自摸 is counted, so scoring it as a discard hides it entirely.
- Singapore's 四暗刻 requires a self-draw by definition.

So `build()` scores **every realisation** — each needed tile as the last one,
drawn and claimed — and reports:

| Field | Meaning |
|---|---|
| `fan` | the FLOOR: the least it pays across the finishes that win |
| `fanBest` | the most it pays |
| `finishOn` | exactly the needed tiles that make it a legal win when they land last |
| `bestWin` | how it must be won for the best figure |

A candidate survives only if at least one realisation is a legal win. The panel
shows a range and names the condition rather than printing the best case flat.

## Known scope limits

These are deliberate, and the corpus does not pretend otherwise.

1. **No plan contains a kong.** Every hand built is `concealedTargets().min`
   tiles, so 十八羅漢 and any kong-bearing plan cannot be proposed. A fourth
   copy the player holds is at least never listed as a discard.
2. **One plan per archetype.** `bestPlan` returns the completion that reuses
   the most held tiles. If a nearer legal win exists inside the same universe
   as the *second*-best reuse, it is not found, so a distance can occasionally
   be overstated. Certifying across both win methods removed most of the cases
   where this used to bite.
3. **No model of the wall, the discards, or what anyone else holds.** The
   question answered is structural: which complete hands are nearest, and
   exactly which tiles are missing. Nothing here is a probability.

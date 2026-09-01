# Mahjongyuk

**Enjoy the mahjong. Leave the counting to us.**

A mobile mahjong scoring calculator for **Singapore** and **Hong Kong Old
Style**. Key in a hand, get the fan — and, more to the point, get who pays
whom.

**Live: [mahjongyuk.com](https://mahjongyuk.com)**

---

## What it does

**Scores a hand.** Pick your game, key the tiles, and the app works out the
fan, applies the table's limit, and names the hand. Both variants are scored
from their own published rules, not from a shared approximation.

**Settles the money.** Not one number — who pays whom. Self-draw and discard
wins, the dealer's share, Hong Kong's full and half payment, Singapore's
instant payouts, and the case people actually argue about: winning off a
particular player's discard.

**Settles the hands you lose, too.** "Someone else won this one" asks who won,
how, and for how many fan, then settles it through the same payment tables a
win goes through. The result leads with what *you* pay — including "You pay
nothing", which is a real Hong Kong outcome and not a bug.

**Predicts.** From a partial hand it shows what the tiles could become, what
each shape would be worth, and what is still missing — as a *requirement*
("any Dragon pong") rather than a specific tile it invented, unless the tile
really is forced.

**Speaks Indonesian.** Localised, not translated: every Indonesian string was
written to read as a mahjong player would say it, against a binding glossary.
The words a thumb lands on and the names of tiles stay English in both modes.

**Keeps the night's tally.** A signed ledger per hand and a running total, so
the table knows where everyone stands.

---

## The two games

| Game | Tiles | Notes |
|---|---|---|
| **Singapore** | 148 | 144 + four animals. Fan doubles each step; limit agreed at the table, 5 by default. |
| **Hong Kong Old Style** | 144 | No animals. Three faan to win; the score doubles every two faan above four. |

A third card on the front door reads **American — Under Development**. It is a
permanent teaser and is never going to be built: the NMJL card of hands is
copyrighted, so those scoring rules are not ours to implement. It is inert by
construction — no id, no tile set, no rules, no corpus — and a test fails if a
future run tries to make it real.

---

## Correctness

A calculator that pays out the wrong amount is worthless, so the engine is
built against a **golden corpus**: test hands with expected fan and payments,
written from each variant's canonical sources *before* the engine that
satisfies them, and never edited to make a failing engine pass.

| Corpus | Entries |
|---|---|
| Singapore | 270 across 14 files |
| Hong Kong Old Style | 226 across 14 files |
| Concealed-kong resolution | 8, both variants |
| Lost-hand settlement | 10, both variants |

Every conflict between sources is settled in writing, with a citation, in
[`docs/sources/RULING-LOG.md`](docs/sources/RULING-LOG.md) (Singapore) and
[`docs/sources/RULING-LOG-HK.md`](docs/sources/RULING-LOG-HK.md) (Hong Kong,
HK1–HK23). A ruling changes when a new citation says so — never because a test
went red.

**1,729 tests** run on every push. Nothing deploys that fails one.

---

## Known limits

- **Pao and the special-hand payouts do not apply to a hand you lost.** The app
  only learns the winner's fan, never their tiles, so rules that key off a
  named hand cannot be reached from that flow.
- **A washout moves no money**, which is correct, and it is the one hand type
  absent from the running total.

---

## The museum

`/v1/` serves the original single-file Singapore calculator, byte-frozen at the
`v1-final` tag and pinned by hash in the test suite. It never changes.

`/v3/` was the preview address while this app was built. It now forwards to the
root, so old bookmarks still land.

---

## Changelog

**v3.0.0 — Mahjongyuk promoted** · the app moves from `/v3/` to
`mahjongyuk.com`. The Run 3 root app and the `/app/` engine harness are
retired, preserved at the `v2-legacy` tag. `/v3/` becomes a redirect; `/v1/`
is untouched. The guards that protected the old frozen root retire with it,
replaced by guards on what is now true: CNAME, `/v1/` by hash, the root
serving the app, and `/v3/` forwarding.

Before that, in the order the work landed: the engine and the Singapore
corpus; the mobile UI; the submit wizard and the certified Hong Kong engine;
prediction and the v3 brand; the owner's logo and 46 hand-drawn tile faces;
Bahasa Indonesia; the concealed-kong fix, signed ledger and End Game; the
American teaser; and the silent kong, requirement-based prediction and
lost-hand settlement.

---

## Development

```
npm run dev      # local dev server
npm test         # vitest — must be green before anything ships
npm run build    # tsc --noEmit && vite build → dist/
```

Push to `main` → test → build → deploy to GitHub Pages. The build output always
contains `CNAME`, the app at `/`, the redirect at `/v3/`, and `/v1/` unchanged.

[`CLAUDE.md`](CLAUDE.md) is the project constitution and governs the work.

---

*Built by Mummyz.*

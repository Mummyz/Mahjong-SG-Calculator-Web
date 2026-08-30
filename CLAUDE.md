# Mahjongyuk — Project Constitution

This file governs the project. Read it before every run. When a run's
instructions and this file disagree, raise the conflict with the owner rather
than silently picking one.

The owner is non-technical. All git, GitHub, deployment and tooling work is
handled by Claude. Anything that genuinely requires the owner is surfaced as a
single, explicit, copy-pasteable action — never as a vague "you'll need to set
this up".

---

## PRODUCT

A **mobile-only web calculator** for mahjong scoring and payment settlement.

The flow:

1. **Pick a variant.**
2. **See the required tile set for that variant** — a pre-game information
   screen showing exactly which tiles are in play (and how many), so the player
   knows what they are dealing with before they key anything in.
3. **Key in a hand** — full or partial.
4. **Get back three things:**
   - **(a) Correct fan / point calculation** for that variant.
   - **(b) Payment breakdown, per other player.** Not a single number — who pays
     whom, and how much. Must account for:
     - self-draw vs. winning on a discard
     - dealer rules (dealer pays/receives differently)
     - instant payouts, in the variants that have them
   - **(c) Prediction, from a partial hand.** Best candidate winning hands and
     the tiles needed to get there. When very few tiles have been keyed in, do
     not guess wildly — prompt the user to add more tiles, and show archetypes
     (the shapes they could be aiming for) instead of false precision.

Correctness of (a) and (b) is the entire product. A beautiful calculator that
pays out the wrong amount is worthless.

---

## VARIANTS

**FINAL LINEUP. Never add a variant without the owner's explicit approval.**

| Variant | Tiles | Notes |
|---|---|---|
| **Singapore** | **148** | 144 + 4 animals |
| **Hong Kong Old Style** | **144** | no animals |

Two. That is the list. Requests to "just also add Riichi/Taiwanese/American"
are refused pending owner approval.

---

## LANGUAGES

**English + Bahasa Indonesia.**

**From the FIRST UI commit, every user-visible string goes through a `t()` key.
No hardcoded UI text, ever.** Not "for now", not "we'll extract it later".
Retrofitting i18n is how projects end up with half-translated UIs, and this rule
exists specifically to make that impossible.

This applies to: labels, buttons, errors, empty states, tooltips, aria-labels,
number/tile descriptions, and anything else a human reads. Brand names
("Mahjongyuk") are not translatable strings.

### PRODUCT GLOSSARY (binding on all user-facing text)

| Concept | User-facing term | Never say |
|---|---|---|
| The scoring unit a hand is worth | **Fan** | "Tai", "points", "doubles" |

**"Fan" is the user-facing scoring unit everywhere, in every variant** — the
Singapore 台 and the Hong Kong 番 are both presented to the player as *Fan*.
Owner's decision, 2026-08-30. Internal code names (`totalTai`, `rawTai`,
`minTai`) may stay as they are; the boundary is the `t()` layer. When the
Indonesian locale lands, the Language Critic's glossary decides whether *Fan*
is borrowed or translated — but it stays one word across both variants.

Locale files live in `src/i18n/`. `en.json` is the key source of truth; `id.json`
lands in Run 5.

---

## LIVE SITE

- **mahjongyuk.com**, served by **GitHub Pages** from a custom domain.
- **The `CNAME` file is sacred.** It must be present in every build output. If
  it disappears, the domain breaks and the site goes down. There are guards for
  this in both `npm test` and the deploy workflow — do not remove them, do not
  route around them.
- **`/v1/` serves the legacy single-file calculator permanently.** It is
  byte-frozen at the `v1-final` tag and pinned by hash in
  `src/test/scaffold.test.ts`. It never changes.
- Until Run 2 ships the new UI, **`/` also serves v1, unchanged.** This is done
  by the `serveV1AtRoot()` shim in `vite.config.ts`, which Run 2 deletes.

Deployment is automatic: push to `main` → test → build → deploy. Nothing is
deployed that fails a test.

---

## MODEL POLICY

**Opus 5 is this project's model.** Use it.

**Fable is reserved for the owner's other project — never assume it here.**

---

## GAUNTLET

Adapted from the owner's CRM method. Every unit of work goes through it.

### Builder → Code Critic (blocking, every unit)

Build it, then critique it, then fix it. Rounds continue until the Code Critic
has nothing blocking left. "It works" is not a pass.

### MAHJONG RULES CRITIC (blocking, standing on every engine unit)

Acts as an **international mahjong referee**. Not a code reviewer — a rules
authority. Its job is to assume the engine is wrong until the sources say
otherwise.

- **Every scoring rule must trace to the variant's canonical source.**
  - Singapore: official Singaporean scoring rules, incl. singaporemahjong.com
  - Hong Kong: documented HK Old Style scoring
- **Enforcement weapon = the GOLDEN CORPUS** (`src/engine/corpus/`):
  test hands with expected fan/points, **written FROM THE SOURCES**,
  **independently of engine code**, **BEFORE the engine unit is accepted**.
- **The corpus is never edited to make an engine pass** unless the edit itself
  cites a source. "The engine disagrees" is not a source.
- **Engine units are only accepted when the corpus is green.** Blocking.

See `src/engine/corpus/README.md` for the full corpus rules, and
`docs/sources/RULING-LOG.md` for every conflict between sources — or between a
source and v1 — and the citation that settled it. **A ruling is changed by a new
citation, never by a failing test.**

### DESIGN CRITIC (blocking on UI units)

**Mobile-ONLY bar.** This is not "mobile-first". Desktop is not a target.

- Thumb-reach layout — primary actions in the bottom third of the screen
- Tile tap targets **≥ 44px**
- Every tile **clearly readable at 360px width**
- Responsive up to **tablet, 768px**
- **Must read the design skill before every UI unit.** Every time, not once.
  The skill to load is **`artifact-design`** — design guidance and fundamentals.
  *(Run 2 note: this rule originally named `frontend-design`, which is not
  installed on this account. `artifact-design` is the nearest real equivalent
  and is what Run 2 used. If the owner installs a dedicated frontend design
  skill later, change this line to name it.)*

### LANGUAGE CRITIC (blocking on the Indonesian locale)

- Proper **formal Bahasa Indonesia**, **KBBI-standard**
- **Zero English mixing where an Indonesian word exists**
- **First deliverable when i18n lands: a mahjong glossary** deciding which game
  terms stay untranslated (e.g. whether "fan", "pong", "kong" are borrowed or
  translated). Once decided, the glossary is **enforced on every string**.

---

## ROADMAP

| Run | Scope |
|---|---|
| **Run 0** | ✅ v2 scaffold, v1 preserved, this constitution |
| **Run 1** | ✅ Core engine + Singapore port, golden corpus certified (264 tests) |
| **Run 2** | Mobile UI v2 — variant select, pre-game tile info screen, tile picker, hand display |
| **Run 3** | Hong Kong Old Style engine |
| **Run 4** | Prediction (partial hands → candidate wins + tiles needed) |
| **Run 5** | i18n EN + ID |

---

## REPO LAYOUT

```
app/index.html            v2 Vite entry (builds to /app/ until Run 2)
index.html                legacy v1, kept at root as a Pages fallback
public/CNAME              mahjongyuk.com — copied into every build
public/v1/index.html      the permanent /v1/ calculator (hash-pinned)
src/engine/core/          tiles, hand parser, set decomposition
src/engine/variants/      singapore/, hongkong/
src/engine/corpus/        golden test corpus — see its README
docs/sources/             archived rule sources + the ruling log
src/ui/                   Preact components (Run 2)
src/i18n/                 en.json + t(); id.json lands in Run 5
src/test/                 cross-cutting guards
.github/workflows/        deploy.yml — push to main → test → build → Pages
```

## COMMANDS

```
npm run dev      # local dev server
npm test         # vitest — must be green before anything ships
npm run build    # tsc --noEmit && vite build → dist/
```

Build output always contains `CNAME`, v1 at `/`, and v1 at `/v1/`.

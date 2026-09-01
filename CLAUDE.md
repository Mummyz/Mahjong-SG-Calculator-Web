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

### The American card is a PERMANENT TEASER. It is not a roadmap item.

Owner's decision, Run 6B. A third card appears on Pick Your Game reading
**American / Under Development**, and it is **never going to be built**: the
NMJL card of hands is copyrighted, so the scoring rules are not ours to
implement. The card exists because players ask for the game, and it says so
honestly rather than leaving them wondering.

**A future run must not treat that badge as work waiting to be done.** There
is nothing to pick up. Concretely, and permanently:

- It is **not** in `VARIANTS`, and `VariantId` has no `'american'` member —
  so there is no id for the picker to hand on, by type.
- It has **no** tile set, no rules, no payments table and no corpus. The
  engine has never heard of the word, and `src/v3/teaser.test.ts` fails if it
  ever does.
- The card renders as a plain element with no handler, no `tabindex` and no
  `role`. It is inert **by construction**, not by a `disabled` attribute —
  `disabled` would say "a control that is off", and this is not a control.
- Its **name and badge stay English**; its **description line translates**,
  the same as the other two cards'.
- The copy promises nothing and names no date, and the test forbids both.

If the owner ever reverses this, it takes an explicit instruction naming this
section — not a run that reads "Under Development" as a to-do.

---

## LANGUAGES

**The app is LOCALISED, not translated. Owner's decision, Run 7.**

This replaces the Run 5 English-only policy. Bahasa Indonesia is a real mode
now, and the bar is meaning-first:

> Every Indonesian string must read as if written by a native Indonesian
> mahjong player for other players — meaning and situation first, never
> word-for-word.

**The owner's test case, and it is the shape of the whole risk:** "Score this
hand" must NEVER become *"Skor tangan ini"*. **`tangan` is a body part.** A
mahjong hand is a set of tiles. Falling into a false friend like that is a
**blocking** defect, and `src/i18n/coverage.test.ts` refuses the word outright.

### What switches, and what never does

Split in **one place** — `ENGLISH_ALWAYS` in `src/i18n/scope.ts`. It is
enumerated, not inferred, and everything it does not name is translated, so a
NEW key is Indonesian by default. That is deliberate: the failure mode of a
localised app is a string quietly added in English and never noticed.

**Indonesian** — the sentences that explain, warn, count and settle:
the two game descriptions; fan-breakdown line items; the whole prediction
panel; table setup and its teaching copy; the win wizard; the beginner
explanations of the nine special circumstances; the payment ledger; every
status line, hint and error; the tile-set screen's counts and prose.

**English in both modes** — the words a thumb lands on and the words that
NAME things: every button and action; screen and section titles; the landing
copy and tagline; tile, suit and wind names; the tile-group headings (they are
the same words as the tab labels and the tile names — splitting them would put
*Lingkaran* over a tile the app calls 5 Dots); named winning hands in both
regional forms; the nine circumstance NAMES — though every word explaining
them is Indonesian; and `chow`, `pong`, `kong`, `fan`, which the glossary
borrows whole.

**The Chinese hand names are gone from every screen** (Run 7). They were a
second name for the same hand, in a script most of the table cannot read,
beside the number people opened the screen for.

**From the FIRST UI commit, every user-visible string goes through a `t()`
key. No hardcoded UI text, ever.** Unchanged, and now load-bearing: it is what
made a policy this size a scope file rather than a rewrite.

### BRAND DNA (binding on all user-facing text)

**Mahjongyuk = "Mahjong, yuk!"** — Indonesian for *let's play mahjong*. The
name is an **invitation**, and that is the whole brand. It is not a utility
name; it is somebody pulling out a chair for you.

**Voice: playful, welcoming, confident.** We are the friend at the table who
is good at the maths and cheerful about it. Never fussy, never lecturing,
never apologetic. Short sentences. Warm, not cute for its own sake.

**Tagline: "Enjoy the mahjong. Leave the counting to us."** Owner's line,
2026-08-30. Two beats: the invitation, then the promise. It is the masthead on
the front door and it sets the register for everything else.

**The masthead is the owner's logo artwork** (`public/brand/logo-mahjongyuk.png`,
supplied 2026-08-31), and the "yuk" now lives in it — drawn, not typed. Nothing
else on the front door needs to carry the invitation, and the drawn wordmark
that used to is retired.

**What this rules out:** heritage/museum register, corporate hedging
("please note that…"), exclamation-mark spam, and any copy that makes the
player feel tested. The owner rejected the heritage look in Run 4 for being
too old; the words must not put it back.

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
- **`/` IS THE APP** since **v3.0.0**. Its UI is `src/v3/`. The Run 3 app that
  used to sit here, and the `/app/` engine harness, were retired in the
  promotion and are preserved at the **`v2-legacy`** tag.
- **`/v3/` forwards to the root.** It was the preview address for four runs, so
  it is in bookmarks and in every report written before the promotion; it must
  never 404 and must never serve a second copy of the app.
- **`/v1/` serves the legacy single-file calculator permanently.** It is
  byte-frozen at the `v1-final` tag and pinned by hash in
  `src/test/scaffold.test.ts`. It never changes.

**The guard set, enforced in `npm test` AND in the deploy workflow:** CNAME is
`mahjongyuk.com`; `/v1/` matches its sha256; the root serves the app and loads
its bundle; `/v3/` forwards and ships no bundle. The two guards that pinned the
OLD frozen root — its source manifest and its string hash — retired with the
app they protected, and the note explaining why is at the top of
`src/test/scaffold.test.ts`.

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

See `src/engine/corpus/README.md` for the full corpus rules,
`docs/sources/RULING-LOG.md` for every Singapore conflict and the citation that
settled it, and `docs/sources/RULING-LOG-HK.md` (HK1–HK22) for Hong Kong. **A ruling is changed by a new
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

### LANGUAGE CRITIC (blocking, re-scoped in Run 7)

Its scope is `TRANSLATED` — today 188 strings — and its bar is **naturalness
before fidelity**. It judges whether an Indonesian mahjong player would say
this, not whether it maps onto the English.

**Critics read the Indonesian FIRST, with no access to the English.** A reader
who has seen the source cannot un-see it, and will accept a calque that a real
player would trip over. Only after judging naturalness and guessing what each
string means is the English revealed — and the gap between the guess and the
truth is the false-friend report.

All blocking:

- **False friends** — every string back-translated and checked against the
  English MEANING in mahjong context. `tangan` for a hand is the named case;
  the Critic hunts the whole class.
- **Glossary** — `docs/GLOSSARY-ID.md` is binding, including which word a
  mahjong hand takes in which sentence.
- **Register** — warm, plain, spoken Indonesian, consistent across all eight
  areas. Not bureaucratic, not slang.
- **Scope** — nothing on the English list translated, nothing on the
  Indonesian list left English.
- **Placeholders and counts** — `{name}` intact; Indonesian has no plural
  inflection, so counts are phrased once and work for 1 and for 14; thousands
  separated the Indonesian way (1.000).

## ROADMAP

| Run | Scope |
|---|---|
| **Run 0** | ✅ v2 scaffold, v1 preserved, this constitution |
| **Run 1** | ✅ Core engine + Singapore port, golden corpus certified (264 tests) |
| **Run 2** | ✅ Mobile UI v2 — variant select, tile info, tile picker, hand display |
| **Run 2B** | ✅ Hand-entry redesign — rolling table, guided declare, named seats |
| **Run 3** | ✅ Submit wizard, Hong Kong Old Style engine certified, both variants live |
| **Run 4** | ✅ Prediction, Bahasa Indonesia, and the v3 brand — preview at `/v3/` |
| **Run 5** | ✅ Owner logo, 46 redrawn tile faces, English-only UI, gameplay layout rework — still `/v3/` |
| **Run 6** | ✅ Concealed kong fix, signed ledger, End Game, ghost-tile prediction — built AFTER Run 7 (`2839584`, `424d3b8`) |
| **Run 7** | ✅ Bahasa Indonesia localisation, meaning-first — 188 strings, `/v3/` |
| **Run 6B** | ✅ Masthead spacing token, American teaser card (permanent — see VARIANTS) |
| **Run 6C** | ✅ Silent concealed kong, requirement-based ghosts, ledger footers, lost-hand settlement |
| **v3.0.0** | ✅ **Owner review passed. `/v3/` promoted to `mahjongyuk.com`; Run 3 app and `/app/` harness retired to `v2-legacy`** |

The rows are in the order the owner briefed them, which is **not** the order
they landed: Run 7 shipped before Run 6, and Run 6B after both. Read the run
NUMBER as a name, never as a sequence — and never as evidence that a lower
number is already in the repository.

An earlier version of this table said Run 6 had never reached the repository.
That was true when it was written and false the moment Run 6 landed, and the
Run 6B critics caught it. If a run's row and `git log` disagree, `git log` is
the fact.

---

## THE ROADMAP IS COMPLETE. THE PROJECT IS IN MAINTENANCE.

**v3.0.0 shipped the product the roadmap was for.** There is no next run
waiting, and no future work is implied by anything in this file. A run happens
only when the owner asks for one.

**What that changes for a run that does start:**

- **Nothing is a to-do because it is written down here.** The American teaser
  (see VARIANTS) is the standing example, and that rule is unchanged and still
  binding. The *Known limits* below are the same: they are documented so a
  player is not misled, not queued.
- **The GAUNTLET still applies in full.** Maintenance is not a lower bar. A
  field fix to the engine still needs the Mahjong Rules Critic and a green
  corpus; a UI change still needs the Design Critic; new Indonesian still needs
  the Language Critic reading it blind.
- **Critic runs are READ-ONLY.** A Run 6B audit agent edited a source file to
  test whether a guard would catch it, and corrupted the working tree of a live
  project. Every critic run since has been read-only with a tamper watch, and
  every one to come must be.

### Known limits, documented rather than queued

- **Pao and the special-hand payouts do not apply to a hand somebody else won.**
  That flow learns the winner's fan and never their tiles, so the rules keyed to
  a named hand — Singapore R12's thirteen-wonders payout, both variants' pao —
  cannot be reached from it. Fixing this means asking the player a fourth
  question, and the owner has not asked for it.
- **A washout moves no money**, which is correct, and it stays the one hand type
  absent from the running total.

---

## REPO LAYOUT

```
index.html                `/` — THE APP since v3.0.0. Its UI is src/v3/
v3/index.html             `/v3/` — a static forward to `/`. No bundle, ever
public/CNAME              mahjongyuk.com — copied into every build
public/v1/index.html      the permanent /v1/ calculator (hash-pinned)
public/brand/             the owner's logo, served
assets/brand/             the owner's originals — source, never served
src/engine/core/          tiles, hand parser, set decomposition
src/engine/variants/      singapore/, hongkong/, and the registry both are in
src/engine/session/       the table: seats, rotation, declaring, submitting
src/engine/corpus/        golden test corpus — see its README
src/engine/predict/       prediction: distance to win, candidates, requirements
docs/sources/             archived rule sources + the ruling log
src/v3/                   Preact components for the app. The only UI there is
src/v3/tiles/             the 46 tile faces: palette, layouts, parts, Face
src/i18n/                 en.json, id.json, t()/tv(), the locale switch
src/i18n/scope.ts         WHICH strings the switch reaches — the whole policy
docs/GLOSSARY-ID.md       the binding Indonesian glossary
docs/design/              the v3 build specification, from the Run 4 judge panel
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

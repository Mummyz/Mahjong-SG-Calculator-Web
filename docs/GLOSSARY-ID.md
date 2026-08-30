# Bahasa Indonesia — the glossary

Per the constitution the glossary is the **first** i18n deliverable: it decides
which game terms stay untranslated before a single string is written, and it is
then enforced on every string. The Language Critic owns compliance.

The standard is **formal-but-friendly Bahasa Indonesia, KBBI-standard, with
zero English mixing where an Indonesian word exists.** "Friendly" is not a
licence for slang: it is the register of a warm host, not a chat message.

---

## 1. The rule

> **A word stays in its original form only when it is a THING YOU SAY AT THE
> TABLE or a UNIT OF THE GAME. Everything a player merely reads is Indonesian.**

That single test decides every case below, and it is the test to apply to
anything this list has missed.

---

## 2. Borrowed — kept as they are

| Term | Why |
|---|---|
| **Mahjongyuk** | The brand. It is already Indonesian — *mahjong, yuk!* — and it is the one word that must never move. |
| **fan** | The scoring unit, binding across both variants by the owner's decision of 2026-08-30 (see CLAUDE.md). Singapore's 台 and Hong Kong's 番 are both *fan* in English and both *fan* in Indonesian. Indonesian has no word for it, and inventing one would break the one term the two variants share. Written lowercase in running text, as a loanword: *3 fan*, *batas fan*. |
| **pong** | A call. You shout it across the table; you do not translate a shout. |
| **kong** | A call, as above. |
| **chow** | A call, as above. Every place it appears, the Indonesian explains it — *chow · tiga kartu berurutan* — so a player who has never heard the word still knows what the button does. |

**Nothing else is borrowed.** In particular *tile*, *hand*, *dealer*, *wind*,
*flower*, *season*, *discard*, *self-draw*, *limit*, *stake* and *round* all
have ordinary Indonesian words and must use them.

---

## 3. Translated — the binding terms

Once a term appears here, every string must use exactly this word. Consistency
is the point: a player who learns *kartu* on one screen must not meet *ubin* on
the next.

### The furniture

| English | Indonesian | Note |
|---|---|---|
| tile | **kartu** | The physical piece. *ubin* (floor tile) is a false friend and is banned. |
| hand | **tangan** | The tiles you hold. |
| wall | **tembok** | |
| discard | **buangan** (noun) / **membuang** (verb) | |
| self-draw | **tarik sendiri** | |
| dealer | **bandar** | KBBI, and what an Indonesian table actually says. |
| seat / seat wind | **posisi** / **angin posisi** | |
| prevailing wind | **angin putaran** | |
| round | **putaran** | |
| hand (one deal) | **babak** | Distinct from *tangan*, the tiles. |
| limit | **batas** | |
| stake / value of one fan | **nilai** | |
| payment / settlement | **pembayaran** | |
| washout / draw | **seri** | |
| meld (declared set) | **set terbuka** | |
| concealed | **tertutup** | |
| pair | **pasangan** | |

### The suits and honours

| English | Indonesian |
|---|---|
| Characters (萬) | **Karakter** |
| Dots (筒) | **Lingkaran** |
| Bamboo (索) | **Bambu** |
| Winds | **Angin** |
| Dragons | **Naga** |
| East / South / West / North | **Timur / Selatan / Barat / Utara** |
| Red / Green / White Dragon | **Naga Merah / Naga Hijau / Naga Putih** |
| Flowers / Seasons | **Bunga / Musim** |
| Animals | **Hewan** |

The CJK on a tile face — 萬, 東, 中 — is **content, not copy**. It is what is
physically carved into the tile and it is identical in both locales.

### Hand names

**Translated, descriptively.** They are descriptions, not calls: *Full Flush*
is already an English translation of 清一色, so an Indonesian translation is the
same act, not a further remove. The Chinese name is shown beside the Indonesian
one exactly as it is shown beside the English one, which is where a player who
knows the game by its Chinese names will find it.

---

## 4. Brand voice in Indonesian

The name is the brand and the name is Indonesian, so **the Indonesian build is
the one where the invitation is not a translation.**

- **The masthead tagline carries the invitation.** The English is *"Enjoy the
  mahjong. Leave the counting to us."* The Indonesian is not a gloss of that
  sentence; it is the sentence an Indonesian host would actually say, and the
  *yuk* belongs in it.
- **The play call-to-action uses *yuk*.** *Main yuk* — two words that do in
  Indonesian what the whole English front door has to work for.
- Register: warm and direct. *Anda* is too formal for a card table and *lu/gue*
  is too slangy for a product; the copy mostly addresses the player without a
  pronoun at all, which is the natural Indonesian solution and the one to
  prefer. Where a pronoun is unavoidable, **kamu**.
- No exclamation marks except where *yuk* earns one.

---

## 5. What the Language Critic enforces

1. Every key in `en.json` has an `id.json` counterpart, and nothing is left in
   English that this glossary does not permit.
2. Section 2 is exhaustive: any other English word in the Indonesian bundle is
   a defect.
3. Section 3's terms are used consistently, everywhere.
4. Register is even across the whole bundle — no drift between a formal
   settlement line and a playful empty state.
5. KBBI spelling throughout, including the affixes (*di-* as a prefix versus
   *di* as a preposition is the usual failure).
6. *yuk* appears where section 4 says it must, and does not become a verbal tic
   elsewhere.

# Bahasa Indonesia — the glossary

> **SCOPE, Run 7.** The app is **localised, not translated**. The language
> switch reaches the sentences that explain, warn, count and settle — 193
> strings — and never the words a player taps or the words that NAME things.
> Which is which is enumerated in `src/i18n/scope.ts`; the policy is stated in
> CLAUDE.md → LANGUAGES.
>
> **This document is binding on every string the switch reaches.** It is not a
> licence to flag English UI text as code-mixing: the English half is a
> decision, not a defect.
>
> Settled by a panel of five Indonesian mahjong speakers, judged by three, and
> merged. `src/i18n/coverage.test.ts` holds the parts a machine can hold —
> above all the ban on **tangan** — and the Language Critic holds the rest by
> having native speakers read the Indonesian with the English hidden.

---

## 1. The register

Write as one friend at the table who is good at the maths and cheerful about it — warm, plain, spoken Indonesian, the way somebody actually talks while four people are digging for cash at the end of a babak. Short sentences. **No pronoun at all wherever Indonesian can drop it**, which is most of the time; where one is unavoidable it is **kamu**, never *Anda*. No *Silakan / Mohon / Harap* — bare imperatives, and drop the *meN-* prefix in buttons and headings (*Buang*, *Hitung*, *Siapa bayar berapa*), keeping the full form only inside running sentences. Sentence case, never Title Case, which is a calque and a tell. No slang (*gue, lu, bgt, -in* verbs, *24rb*), because the app handles money and the numbers have to look serious. **`belum` rather than `tidak` wherever the player can still fix it** — *belum jadi*, *belum menang* — because "not yet" is both kinder and true. `app.tagline` — *"Mahjong yuk! Biar kami yang menghitung."* — is the best string in the bundle and the standard everything else is raised to; but *yuk* stays on the masthead and the play CTA only, because spread across result screens it becomes a tic.

---

## 2. THE HAND PROBLEM — settled

**There is no single Indonesian word for a mahjong hand, and finding one is the wrong goal.** All three panels reached this independently, so it is settled. The head noun is **kartu**, possessed; **susunan** covers the structural sense; the verb **jadi** covers the state; **babak** is one deal; and in roughly a third of strings **the noun disappears entirely**.

**`tangan` is banned outright, in every position** — including the locative *"kartu di tangan"*. All three panels acknowledged the locative is genuine Indonesian card-table speech, and all three still voted to ban it: with *kartumu*, *susunan* and *jadi* available no sentence needs it, and a bright-line rule survives future contributors in a way a subtle one does not. Where the locative is genuinely wanted, write **"kartu yang kamu pegang"**, **"yang belum turun"** or **"masih dipegang"**.

**THE STANDING RULE, if only one line of this document survives:** when English needs a noun for "hand", check first whether Indonesian needs a noun at all. Half the time the sentence is better without one — and that instinct, not any single word choice, is what keeps the bundle from reading as translated.

### The four senses

| Sense | Word | Test |
|---|---|---|
| The tiles you hold | **kartu**, possessed: *kartumu / kartunya* | The tiles are visible or just named — context does what English needs "hand" for |
| The arrangement being judged (four sets and a pair) | **susunan** | Only where the *shape itself* is the subject. As a standing noun it makes every string read like a rulebook |
| The state of being a valid hand | the verb **jadi** — *sudah jadi / belum jadi* | *jadi* = the shape is valid. **`lengkap` = the count is there (all 14 in).** Hold that split deliberately |
| One deal of the game | **babak** | A different word at a different level; see §3 |

### In this sentence, use this word

| English string | Indonesian | Fixes |
|---|---|---|
| Your hand | **Kartumu** | `hand.yourHand` "Tanganmu" |
| Score this hand | **Hitung fan-nya** | `wizard.title`, `hand.scoreReady` — both literally "Hitung tangan ini" today |
| The hand is complete | **Kartunya sudah jadi** | `hand.declareComplete` "Tangan sudah lengkap" |
| These tiles do not make a hand | **Kartunya belum jadi** + reason line *"Belum ada empat set dan satu pasangan."* | `hand.notAHand`, `predict.notAHand` |
| A winning hand needs 14 tiles | **Untuk menang perlu 14 kartu** (+ *"tambah satu untuk tiap kong"*) | `reject.wrongTileCount` |
| This hand was worth 7 fan | **Nilainya 7 fan** — or bare **7 fan** as the hero figure | `result.fanCapped` → *"Kena batas {limit} fan — aslinya {raw} fan."* |
| What can this hand become? | **Susunan ini bisa jadi apa?** | `predict.title` — structure genuinely is the subject here |
| Pick the winning tile from your hand | **Pilih kartu penentu dari kartu yang kamu pegang** | `reject.winningTileNotInHand` |
| Edit hand / Back to hand | **Ubah kartu** / **Kembali ke kartu** | `result.editHand`, `nav.backToHand` |
| {count} in hand | **{count} kartu** | `harness.inHand` "{count} di tangan" |
| Not a winning hand | **Belum menang** | `harness.notAWin` |

**Why "Hitung fan-nya" and not "Hitung kartunya":** the app already has a tile-counting screen, so "hitung kartunya" can be read as *count how many tiles there are*. Naming the unit is unambiguous, is literally what is asked at the table (*"berapa fan?"*), and echoes the tagline's promise. Never **"Skor tangan ini"** — two false friends in three words.

**Rejected for the hand sense, so none is re-proposed:** *rangkaian* (a chain; belongs to the run), *kombinasi* (lottery/spreadsheet register), *set kartu* (reads as the 148-tile boxed set, and *set* is spent on the meld), *pegangan* (a grip, or a guiding principle), *pasangan* (that is the pair — catastrophic to spend here), *formasi* (sports/military loan).

**Scope, verified against the repo:** `src/i18n/id.json` has 414 keys; `tangan` appears **27 times across 26 keys** (line 276 carries it twice). Every one is a blocking defect. This is **not** a find-and-replace — each string takes *kartu*, *susunan*, *babak* or nothing, decided individually, and most should lose the noun rather than swap it. The twelve `pattern.*` names are a separate judgement (§3).

---

## 3. The terms

### The hand, the deal, the round

| Concept | Indonesian | When to use it | Never say |
|---|---|---|---|
| A mahjong hand | **kartu / kartumu / kartunya**; **susunan**; often no noun | See §2 | **tangan** (in any position), kombinasi, rangkaian, set kartu, pegangan |
| One deal | **babak** | *"Babak 3"*, *"Babak berikutnya"*, *"Babak ini sudah selesai"*. Already correct — do not touch | tangan, putaran, ronde (a loan where *babak* exists; to most Indonesians also a ginger dessert), giliran |
| A round / wind circuit | **putaran** | *"Putaran Timur"*, *"satu putaran = empat babak"* | ronde, siklus, sesi, keliling |
| The opening circuit of turns (earthly/humanly rules) | **giliran** | *"pada giliran pertama"* — already correct, must not be flattened | **putaran pertama** (that claims the whole East round) |
| Hand is complete / not | **sudah jadi / belum jadi** | *jadi* = valid shape. Keep **lengkap** for the count | tidak jadi, tidak lengkap |

### Doing things

| Concept | Indonesian | When to use it | Never say |
|---|---|---|---|
| To score / scoring | **hitung** (buttons, headings) · **menghitung** (prose) · **hitungan** (the count) · **Rincian fan** (breakdown) | Indonesian does not score, it counts — and it is already the brand's promise | **skor / menyekor** (a football scoreline), **menilai / penilaian** (grading a person — the brand forbids copy that makes the player feel tested), kalkulasi |
| To win / a win | **menang** · *"yang menang"* (the winner) · headline **"Menang!" / "Belum menang"** | Prefer the verb: *"siapa yang menang?"* is a person talking; *"siapa pemenangnya?"* is a tournament announcer | memenangkan (wrong valency — the classic translated-UI slip), pemenang, juara, *hu* / *mahjong!* as printed calls |
| The winning tile | **kartu penentu** · wizard question **"Kartu mana yang bikin menang?"** | Prefer the question form; use the noun only where a label is structurally required | **kartu kemenangan** (retired — see §6), kartu menang (ungrammatical), kartu terakhir (collides with the last-tile bonus, a different rule worth fan) |
| Self-draw | **tarik sendiri** | Label *"Tarik sendiri"*; button *"Saya tarik sendiri"*; prose *"kartunya kamu tarik sendiri"*. Pairs against *"Dari buangan"*. Already correct | **tsumo / zimo** (Riichi jargon in a SG/HK app — the single most damaging word available, and a tell that the writer learned mahjong from a video game), ambil sendiri (*ambil* is claiming someone else's discard), menang sendiri, cabut sendiri |
| Discard (game action) | **buang** (button, heading) · **membuang** (prose) · **buangan / kartu buangan** (the tile and the pile) | *"Buang apa?"* is the most-said sentence at the table. *"Dari buangan"* = won off a discard | lepas/lepaskan, keluarkan, singkirkan (collides with *disisihkan*), diskard |
| Remove a tile keyed in wrongly (UI action) | **hapus / urungkan** | **Correctness, not style:** a player reading *"Buang"* on a delete control will think the app is telling him to discard in the game. Keep the two vocabularies apart forever | **buang** |
| Let go of / drop a tile (prediction advice) | **buang** — deliberately the same verb | *"Masih perlu 5 bambu, dan buang 1 karakter."* English splits discard/drop for prose variety; Indonesian has one action and one word | **lepaskan** (`predict.drop` today — you *lepas* a rope, a bird or a grudge), relakan, korbankan, singkirkan |
| Someone threw your winning tile | **"{nama} yang buang"** · prose *"kartunya dari {nama}"* · result line *"Menang dari buangan {nama}"* · wizard *"Siapa yang buang?"* | The *yang*-cleft puts the name first, which is exactly what a settlement screen needs. Word order supplies the emphasis, so no extra verb | **melempar / dilempar** (physically hurling a tile across the room — the second-worst calque after *tangan*), menembak / kena tembak (in-group swagger in print), memberi / dikasih |

### The table

| Concept | Indonesian | When to use it | Never say |
|---|---|---|---|
| Tile | **kartu** | Already correct everywhere — settled, not up for revisiting | ubin (a floor tile) |
| The wall | **tembok** | *"tembok habis"*. Prefer situational phrasing where the wall only locates a tile: *"kartu terakhir yang bisa ditarik"* | dinding (a room partition), benteng, dek, tumpukan (collides with the discard pile) |
| Dealer | **bandar**; to deal = **bagi kartu / membagi kartu** | *"Siapa bandar?"* is the first question at an Indonesian card table, it is KBBI, and it correctly implies the asymmetric money position. Beside Timur/Selatan/Barat/Utara the card sense is unmistakable | **dealer / diler** (a car dealership), pembagi kartu (a job title), tuan rumah, pemain Timur (breaks when the dealer repeats), and never derive **membandari** |
| Seat wind | **angin posisi** (label) · **anginmu** (prose) | Pairs by construction with *angin putaran*, so a player learns both at once | **angin duduk** — BLOCKING. It is the everyday Indonesian lay term for angina / a sudden fatal heart attack; *"angin dudukmu Timur"* tells a player his heart attack is East. Also: angin kursi, angin tempat duduk, angin sendiri |
| Prevailing wind | **angin putaran** · in prose *"putaran Timur"* | Reads as a matched set with *angin posisi* on the screen where the player compares them | angin berlaku (regulations coming into force), angin utama/besar (invents a hierarchy the rules do not have), angin babak (wrong scope) |
| Meld | **set terbuka** (noun) · **"Buka set"** (button) · **turun / diturunkan** (prose) | *set* is a KBBI headword (*satu set kursi*) — **not code-mixing; the Language Critic must not flag it.** The defining fact is that the tiles are face-up. Live table verb: *"sudah turun dua"* | meld, kombinasi terbuka, rangkaian (names only a chow), kelompok, gabungan |
| Concealed / exposed | **tertutup / terbuka**; fully concealed = **"tertutup semua"** | One morphologically matched pair builds every label in the app, and it is physically literal | tertutup penuh (*penuh* describes a container), tersembunyi / rahasia / disembunyikan (imply cheating — keep *tersembunyi* for the pattern name *Harta Tersembunyi*, where the poetry is the point), dibuka/ditutup (actions, not states) |
| Pair | **pasangan** (term) · **sepasang** (counted) | *"satu pasangan"* only inside the definition line *"empat set dan satu pasangan"*, where the parallel with *empat* earns it; *"tinggal sepasang"* everywhere else | bare **pasang** (to place a bet — a live misread in a money app), kembar (twins; *kembar tiga* is triplet babies), mata (opaque outside one circle — a footnote, never a UI string), dua kartu sama |
| Triplet | **pong**; concealed one is **pong tertutup** | Gloss on first use and on the declare button: *"pong · tiga kartu sama"*. Players do not lexically distinguish claimed from drawn triplets — they distinguish with *tertutup/terbuka* | triplet (obstetric to Indonesian ears), tiga serangkai (a famous trio, and a snack brand), kembar tiga, set tiga |
| Run / sequence | **chow** (call, button, tag) · **urutan / berurutan** (the shape in your own tiles) | Standing gloss *"chow · tiga kartu berurutan"*. Regional *ciak/chi* exists; do not switch — *chow* is the internationally legible form and the gloss carries the meaning | **seri** — BLOCKING: *seri* is the washout, and one word meaning both "a run" and "nobody won" on the same result screen is a money-affecting ambiguity. Also rangkaian, deret (arithmetic series), sekuens, jalan |
| Terminals (1s and 9s) | **"kartu 1 dan 9"** in body copy · **"Kartu Ujung"** only inside pattern names, glossed once | 幺九 means "the ends", so *ujung* translates the concept, not the English — but no player says it aloud, so prose says the numbers | **terminal** — BLOCKING: in Indonesian a bus station (Terminal Kampung Rambutan); *"kartu terminal"* is a ticket. The *tangan* mistake wearing a different hat. Also kartu pinggir/tepi, angka mati |
| Honours | **Angin & Naga** — no class noun | Tab label *"Angin & Naga"*; pattern *"Semua Angin dan Naga"*. English needs "honours" because the list would be long; Indonesian does not, because it is two things. **Width-check at 360px against Karakter / Lingkaran / Bambu / Bonus; if it does not fit, shorten a neighbour rather than fall back to a meaningless word** | **kartu kehormatan** (*kehormatan* is dignity — an awards ceremony; `hand.tab.honours` and `pattern.allHonours` are defects today), **kartu honor** (an honorarium — payslips), kartu huruf/karakter (collides with the Karakter suit) |
| Flowers / seasons / animals | **kartu bonus** (class) · **bunga / musim / hewan** (members) · **disisihkan** (what happens to them) | *bonus* is a KBBI headword. In prose name the members: HK *"bunga dan musim"*, SG *"bunga, musim, dan hewan"* — never let *bunga* alone stand as the umbrella, which would hide Singapore's animals, and they pay instantly. **The verb does the rules-teaching: this class is always *disisihkan*, never *dibuang*** | kartu kehormatan (a rules error, not a wording one), kartu tambahan (spares from the box), kartu istimewa, kartu hadiah |

### Money

| Concept | Indonesian | When to use it | Never say |
|---|---|---|---|
| Worth N fan | bare **"{n} fan"** (hero figure) · **"nilainya {n} fan"** (in a sentence) · **"bernilai {n} fan"** (a *predicted* hand) | At a table nobody says a hand is worth seven fan; they say *"tujuh fan"*. The *nilainya / bernilai* split is real: *nilainya* states what happened, *bernilai* evaluates what has not happened yet, so prediction cards keep *bernilai* | berharga (precious / has a price), senilai (contract register), layak, **poin** (reserved strictly for Hong Kong's real base-point table) |
| The fan limit | **batas fan** (setting) · **"Kena batas {limit} fan — aslinya {raw} fan."** (when it bites) | *"Kena batas"* is spoken, compact and slightly rueful — exactly the feeling. *aslinya* beats *sebenarnya*: shorter, more spoken | limit (credit-card register), plafon, maksimum, batasan. **mentok** is rejected — see §6 |
| The stake | field label **"Nilai 1 fan"** (HK: **"Nilai 1 poin"**) · setup heading **"Satu fan berapa?"** | A deliberate two-register split: the heading is the question actually asked before a money game starts, the field is exact. `table.stake` is already right | **taruhan** (names a wager, not a rate, and drags a gambling register in next to *bandar*), pasang/pasangan, harga, modal, tarif |
| Settlement | heading **"Siapa bayar berapa"** · noun **pembayaran** · row **"{nama} bayar {jumlah}"** | The most localised string the app can have: not a translation of "settlement" at all, but the sentence that concept exists to answer, said out loud while everyone digs for cash. Bare *bayar* in headings and rows; *membayar* only in full prose (`result.payments` is a notch stiff today) | **penyelesaian** (legal/dispute register — *penyelesaian sengketa*; it would read as though something had gone wrong), pelunasan, transaksi, setoran, perhitungan akhir |
| You collect | **"Kamu dapat"** · total **"Total yang kamu dapat"** · counterpart **"Kamu bayar"** · per-player **"{nama} bayar kamu {jumlah}"** | *"Dapat berapa?"* is the first thing asked of a winner. This is the happy line on the screen and should sound like getting something — one of the few places *kamu* earns its keep | **mengumpulkan** (gathering objects up — as if sweeping money off the table), menagih (recasts your friends as debtors), **menerima** (`result.youCollect` today — correct but receipt-cold), memperoleh, koleksi |
| Washout / no winner | **seri** · menu row **"Tidak ada yang menang — seri"** · first use **"Seri — tembok habis, tidak ada yang menang."** | Every Indonesian knows *seri* from football, so it lands at zero learning cost; pairing it once with *tembok habis* teaches the mahjong-specific cause. Lead the menu row with the plain sentence — that menu is scanned in a hurry | imbang (implies the scores came out level; nobody scored at all), batal (the babak was played to the end and it counts), mati, hasil nihil, cuci/washout |
| A tile you are waiting for | section **"Yang ditunggu"** · per-tile **"{tile} — masih ditunggu"** · shortfall **"masih kurang {n} kartu"** · one away **"Tinggal satu kartu lagi"** | The frame is **waiting, not needing** — *"nunggu kartu apa?"* is what a player says, it mirrors 聽牌, and it is more accurate, since a needed tile may already be dead | **dibutuhkan / diperlukan** (`tile.neededName`, `predict.need` — passive procurement register, *"dokumen yang diperlukan"*; the stiffest strings in the file), dicari, kartu wajib, kekurangan as a noun |

### Pattern names built on the English word "Hand"

Twelve live `pattern.*` strings open with *Tangan* and every one is a defect. **Two different fixes, decided per name — not a find-and-replace.**

Where "hand" just means the holding, swap in *Kartu* or delete it:

| Key | Now | Becomes |
|---|---|---|
| `pattern.chickenHand` | Tangan Ayam | **Kartu Ayam** |
| `pattern.commonHand` | Tangan Biasa | **Kartu Biasa** |
| `pattern.sequenceHand` | Tangan Berurutan | **Semua Chow** |
| `pattern.lesserSequence` | Tangan Berurutan Kecil | **Berurutan Kecil** |
| `pattern.triplets` | Tangan Semua Pong | **Semua Pong** |
| `pattern.fullFlushSequence` | Tangan Berurutan Sejenis Murni | **Semua Chow Sejenis Murni** |
| `pattern.fullFlushTriplets` | Tangan Semua Pong Sejenis Murni | **Semua Pong Sejenis Murni** |
| `pattern.allHonours` | Semua Kartu Kehormatan | **Semua Angin dan Naga** |

Where the name describes **how the win arrived** (天胡 / 地胡 / 人胡), the right Indonesian noun is the *win*, not the holding — more accurate as well as more evocative, because the heavenly part is the timing:

| `pattern.heavenly` / `.earthly` / `.humanly` | Tangan Langit / Bumi / Manusia | **Menang Langit / Menang Bumi / Menang Manusia** |
|---|---|---|

Same treatment for `flag.heavenly / .earthly / .humanly`. The CJK shows alongside, so nothing is lost for players who know these by 雞胡.

### Orthography

- **Clitics on retained foreign words take a hyphen** (PUEBI): **fan-nya, pong-nya, kong-nya** — never *fannya*. **Mahjongyuk never takes a suffix.**
- **The *di-* trap** is the commonest Indonesian UI spelling error and is worth a grep: *dibuang, diturunkan, ditunggu, disisihkan* are verbs and join; *di meja, di tembok* are prepositions and separate.
- Sentence case throughout: *"Hitung fan-nya"*, not *"Hitung Fan-Nya"*.

---

## 4. Counting and numbers

**ONE TEMPLATE, NEVER A PLURAL BRANCH.** Indonesian has no plural inflection and a noun after a numeral is always bare, so "1 more tile" and "3 more tiles" are the same string with a different digit: `"{n} kartu lagi"`. Standard phrasings — shortfall **"masih kurang {n} kartu"**; countdown **"tinggal {n} kartu lagi"**; progress **"{n} dari {needed}"** (already right).

1. **No plural machinery, ever.** No ICU category beyond `other`, no `_one`/`_other` keys, no pluralisation helper, no "(s)". State this in the i18n layer so nobody adds machinery Indonesian cannot use. **Concrete fix: `predict.awayOne` and `predict.awayN` collapse into one key, `"tinggal {n} kartu lagi"`.** The bright line: **no string may be selected by comparing `n` inside the `t()` layer.**
2. **Zero is a different sentence, not n=0.** Never *"kurang 0 kartu lagi"*. Use **"Sudah lengkap" / "Kartunya sudah jadi" / "Belum ada" / "nihil"** for an empty payment line.
3. **One spelled numeral, and exactly one.** `hand.declareOneLeft` stays **"Tinggal satu kartu lagi"** — a bare digit *1* in running Indonesian looks like a form field. This is a distinct *screen state* the app already routes to, not a count branch, and it is the only place a numeral is spelled out. **Digits from 2 up, everywhere.**
4. **Never reduplicate with a numeral.** *"3 kartu-kartu"* is ungrammatical. Reduplication marks plurality only with no numeral present, and even then prefer the plain form: `hand.notAHand` *"Kartu-kartu ini belum membentuk tangan"* → **"Kartunya belum jadi"**, which is shorter, more spoken, and drops the banned noun.
5. **No classifier.** *"3 buah kartu"* / *"3 keping kartu"* are grammatical and nobody at a table says them; *buah* makes every count read like a stock list. Bare numeral + noun.
6. **No indefinite article.** Never *"sebuah kartu"*.
7. **Units never inflect:** 1 fan, 7 fan, 13 fan — never *fans*, never *fan-fan*. Same for babak: the signboard is flat, **"Babak 3"**, as a scorer writes it (*babak ke-3* is correct Indonesian but wrong register for a chip).
8. **Pairs:** *sepasang* for one, *"{n} pasang"* when counted, *pasangan* as the standing term, *"satu pasangan"* only inside the definition line.

### Separators — the exact inverse of English

**PERIOD for thousands, COMMA for decimals.** `1.000` · `24.000` · `1.280.000` · `3,5`. PUEBI-standard and universal in Indonesia, including on every price tag. This is **not a style nit**: an Indonesian reads an English-formatted "24,000" as twenty-four point zero, which in a settlement app is a money-affecting bug.

**Implementation.** Always `Intl.NumberFormat`, locale-aware, never hand-rolled and never a default-locale call. `src/v3/format.ts` is already correct — it builds `new Intl.NumberFormat(getLocale(), …)`, `getLocale()` returns `'id'`, which resolves to `id-ID` and flips the grouping automatically; its U+2212 minus is correct for Indonesian too. Nothing needs changing, but **two guards are owed**: (a) a unit test asserting that money formatted under locale `'id'` produces `"1.280.000"`, so a future refactor that hardcodes `'en-US'` or drops the locale argument cannot silently invert every separator with no test noticing; (b) never introduce a second formatter or a regex thousands-splitter beside it.

**Money.** No decimals — rupiah has no practical sub-unit and mahjong stakes are round; a trailing `,00` makes the payment screen look like a bank statement. `format.ts`'s existing "decimals only when there are decimals" behaviour is exactly right, and fractional stakes still show theirs. **No abbreviations** in any figure the player hands money over for: never *24rb*, *24k*, *1,25 jt* — spelled *"24 ribu"* is acceptable only inside a spoken-voice hint. Negative or outgoing amounts take a minus sign or a *bayar* label, **never accounting parentheses**.

**Currency, if one is ever added:** **"Rp 24.000"** — *Rp*, one space, no full stop, never *IDR*, never *Rp.*. Strict PUEBI closes it up (*Rp24.000*) and that is defensible, but the spaced form is what `Intl` `id-ID` emits, what Indonesian banks and shops print, and what reads best at 360px. Take the `Intl` output so the choice cannot drift. Today the app prints bare grouped numbers, which is right — it keeps the app out of asserting a currency for tables playing in chips.

---

## 5. Five worked sentences

**1. The primary action** — `wizard.title` / `hand.scoreReady`
> EN: *Score this hand* → ID: **Hitung fan-nya**
>
> The owner's test case. Three words in English, two false friends available, and the fix is to name the unit and delete the noun. *Hitung* is also the tagline's own verb, so the button keeps the masthead's promise.

**2. The rejection** — `hand.notAHand`
> EN: *These tiles don't make a hand yet* → ID: **Kartunya belum jadi**
> with the reason beneath: **Belum ada empat set dan satu pasangan.**
>
> Three moves at once: *belum* not *tidak*, the table's own verb *jadi*, and the reduplication dropped. Currently *"Kartu-kartu ini belum membentuk tangan"* — heavier than the English it renders, and carrying the banned noun.

**3. The result headline** — `result.payments` / `result.youCollect`
> EN: *Who pays what* · *You collect* → ID: **Siapa bayar berapa** · **Kamu dapat 24.000**
>
> Not a translation of "settlement" — the sentence four people say out loud while digging for cash, and the question the winner was already asking. Bare *bayar* saves a dead syllable repeated four times down the ledger.

**4. The prediction** — `predict.need` + `predict.drop`
> EN: *You still need 5 Bamboo — drop 1 Character* → ID: **Yang ditunggu: 5 bambu. Buang 1 karakter.**
>
> Waiting, not needing; one verb for letting a tile go, the same one the game uses. *"masih dibutuhkan"* and *"dan lepaskan"* are the stiffest and the weakest strings in the file respectively.

**5. The cap** — `result.fanCapped`
> EN: *Counted up to the {limit} fan limit — this hand was really {raw} fan* → ID: **Kena batas 5 fan — aslinya 7 fan.**
>
> Spoken, compact, slightly rueful, which is exactly what scoring more than you get paid for feels like. No noun for the hand at all, and the numbers carry the sentence.

---

## 6. Disagreements settled, and enforcement

| Split | Ruling | Why |
|---|---|---|
| **The winning tile**: *kartu penentu* (J1) vs *kartu kemenangan* (J2, J3) | **kartu penentu**, and prefer the question form *"Kartu mana yang bikin menang?"* wherever a noun can be avoided | Neither is table speech, so the majority does not decide it — the standing rule does. *kartu kemenangan* stacks a heavy *-an* nominalisation on another noun and is the most written phrase in the file; *penentu* is everyday (*gol penentu*). J3's counter-argument was churn cost, which is a process argument, not a language one — and the bundle is being rewritten across 26 keys regardless. **`kartu kemenangan` is retired.** |
| **Sequence Hand**: *Semua Berurutan* (J1) vs *Semua Chow* (J2, J3) | **Semua Chow** | *chow* is on the closed borrow list because it is a shout, and *Semua Chow* pairs audibly with the already-correct *Semua Pong*. `Berurutan Kecil` and `Berurutan Sejenis Murni` keep the plain word, where nothing was called. |
| **n=1**: spell *satu* (J1, J3) vs digits throughout (J2) | **Keep the exception, exactly once** — `hand.declareOneLeft` *"Tinggal satu kartu lagi"* | A bare *1* in running Indonesian reads as a form field. It survives only because that is a distinct screen state the app already routes to; it is **not** licence to hand-write a second count string, and §4 rule 1 still forbids branching on `n` inside `t()`. |
| **The coverage guard**: substring `"tangan"` (J1, J2) vs word-boundary regex (J3) | **`/\btangan(ku|mu|nya)?\b/i`** | A plain substring false-fires on *ditangani / menangani*. Neither appears in the bundle today, so the substring test would pass now and block a legitimate string later. Take the regex. |
| **mentok** for the fan cap | **Rejected**, and recorded so it is not re-proposed | All three panels agreed it is the most natural spoken option available and all three refused it: it sits outside the KBBI-standard register bar, and it reads oddly next to a payment figure. **Reopening it is the owner's call, not a writer's.** |
| **Locative "di tangan"** | **Banned**, though all three panels conceded it is genuine card-table Indonesian | A bright line survives future contributors; a subtle one does not. |

**Ban list, for `src/i18n/coverage.test.ts`:** `tangan` (word-boundary, incl. *tanganku/mu/nya*), `di tangan`, `terminal`, `angin duduk`, `kehormatan`, `kartu honor`, `skor`, `melempar`/`dilempar`, `penyelesaian`, `mengumpulkan`, `dibutuhkan`, `diperlukan`, `lepaskan`, `tsumo`, `ubin`, and `seri` used for a sequence (documented; not machine-checkable — hold it by review).

**`docs/GLOSSARY-ID.md` §3 changes in the same commit:** strike the row *hand → **tangan*** and replace it with §2 of this document; keep *seat / seat wind → posisi / angin posisi* but record the *angin duduk* ban as its reason; add a line stating that **`set` and `bonus` are KBBI-listed and therefore not code-mixing**, so the Language Critic does not flag them; and append the ban list above.

**Two things the bundle already gets right and must not be "fixed":** `kartu` for tile (never *ubin*), and `babak` vs `putaran` vs `giliran` for deal, wind round, and circuit of turns.
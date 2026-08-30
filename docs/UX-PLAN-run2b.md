# Run 2B — hand entry UX plan

Owner field-test verdict: the visual design works, the hand-entry *mechanic*
does not. This is the flow it is being rebuilt to.

Guiding rule (owner directive 5): **remove choices, don't explain them.**
Wherever the player can only legally do N things, show only those N.

---

## The table is now a session, not a form

Setting the table happens **once**. After that it rolls by itself.

```
New table ──▶ [names, your seat, prevailing wind, stake, limit] ──▶ hand 1
                                                                     │
   ┌─────────────────────────────────────────────────────────────────┘
   ▼
hand n ──▶ score ──▶ settle ──▶ "Next hand" ──▶ table advances ──▶ hand n+1
                                     │
                                     └─ dealer won?  winds stay
                                        anyone else? deal passes on, and the
                                        prevailing wind advances once the deal
                                        has been round all four players
```

`New table` is the only reset, and it confirms. Everything survives a reload.

**Always visible** in the signboard: hand number, prevailing wind, your seat
wind, whether you are dealer, stake and limit.

---

## Screen by screen

### 1 · Variant select — unchanged

### 2 · Tile check — unchanged

### 3 · Table setup *(once per table)*
- **Four player names**, defaulting to Player 1–4, editable, in seating order.
- **Which one is you** — picked from those names, not from a wind. Winds are
  derived and shown as they change.
- **Which player deals first** — that player holds East.
- Prevailing wind, stake, fan limit.
- → *Start playing*

### 4 · Hand entry *(the hero)*
```
┌ signboard ─── HAND 3 · ROUND 東 · YOU 南 · $0.50 · max 5 ── i ┐
├ suit tabs ──── 萬 · 筒 · 索 · 風箭 · 花 ──────────────────────┤
│ the wall — tapping adds to the hand                          │
│   during a declare, illegal tiles turn face-down and dead    │
├ tray ── the WHOLE hand: exposed melds grouped and toned,     │
│         concealed tiles plain, empty slots dashed            │
│         [Declare] [Undo] [Clear]                             │
│         auto-detected concealed kong shows a chip            │
├ anything unusual? ── collapsed; each item has a plain-English │
│         subtitle and a tap-for-detail sheet                  │
├ who won it ── self-draw, or the player who threw it, by NAME │
└ Score this hand ─────────────────────────────────────────────┘
```

**Declare** is one button, not a concealed/exposed choice.
- Tap *Declare* → Chow · Pong · Kong.
- **Pong / Kong**: tap one tile, done.
- **Chow**: tap a tile; only the tiles that can still finish a run stay live —
  everything else turns face-down and stops responding. Tap again; the set
  narrows again. Three taps and the meld is made.
- Not declaring anything is how you enter a concealed hand. There is no
  "concealed" button, because there is nothing to press.

**Concealed kong** is never declared. Four copies of a tile in hand *is* a
concealed kong: the app says so with a chip and grows the hand by one, because
that is what drawing the replacement tile does.

**The winning tile** has no picker. When the hand is complete, tap the tile in
the tray that finished it. It gets marked. Tap another to change it.

### 5 · Settlement
- Ledger by **name**: "Ming pays 16.00", and your own row reads "You".
- *Next hand* advances the table. *New table* starts over.

---

## What lives where

| Concern | Home |
|---|---|
| Seat rotation, dealer hold, prevailing advance, hand number | `src/engine/variants/singapore/table.ts`, tested |
| Turning a keyed hand into engine input (incl. the concealed kong) | same module, tested |
| Everything else | components |

The engine is untouched.

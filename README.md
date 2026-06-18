# 中 Singapore Mahjong Calculator
### Web-based point calculator for Singapore-style Mahjong — by Mummyz

![Version](https://img.shields.io/badge/Version-1.2-blue)
![GitHub Pages](https://img.shields.io/badge/Live-GitHub%20Pages-brightgreen)
![Language](https://img.shields.io/badge/Built%20With-HTML%20%2F%20CSS%20%2F%20JS-orange)
![License](https://img.shields.io/badge/License-Free%20to%20Use-lightgrey)

---

## 🌐 Live Demo

**[mahjongyuk.com](https://mahjongyuk.com)**

---

## 📖 About

A fully offline, mobile-friendly Singapore Mahjong scoring calculator.
No installation, no login, no database — just open and play.

Built specifically for **Singapore rules (148 tiles)** including:
- Traditional fan-based scoring with official payout tables
- Flowers, Seasons & Animals bonus tiles
- Automatic hand detection (Chow, Pong, Kang)
- Wind rotation and dealer rules
- Round history and cumulative payout tracking
- Full official Singapore Mahjong rules reference built-in

---

## ✨ Features

| Feature | Details |
|---|---|
| 🀄 Hand Detection | Auto-detects Chow, Pong, Kang, and all special hands |
| 🌸 Bonus Tiles | Flowers (4), Seasons (4), Animals (4) — Singapore set |
| 💨 Wind System | Auto seat wind rotation, prevailing wind tracking |
| 💰 Scoring | Traditional Singapore payout (discard + self-draw tables) |
| 📊 Fan Checklist | Live fan progress tracker as you add tiles |
| 📈 Round History | Full history carried across rounds, no database needed |
| 📱 Mobile Friendly | Fully responsive, works on phone, tablet and desktop |
| 🏆 Game End | Congratulations page with Final Payout after full cycle |
| 📋 Built-in Rules | Full official Singapore Mahjong rules from singaporemahjong.com |
| 🎴 Visual Tiles | Large Unicode mahjong tile graphics for Characters, Circles, Bamboo |
| 🌍 Domain | Live at mahjongyuk.com |

---

## 🃏 Singapore Mahjong Rules (Quick Reference)

### Tile Set — 148 tiles
- **3 Suits** × 9 values × 4 copies = 108 (Characters 萬, Circles 筒, Bamboo 索)
- **Winds** × 4 copies = 16 (East 東, South 南, West 西, North 北)
- **Dragons** × 4 copies = 12 (Red 中, Green 發, White 白)
- **Flowers** = 4 (one each: Plum, Orchid, Chrysanthemum, Bamboo)
- **Seasons** = 4 (one each: Spring, Summer, Autumn, Winter)
- **Animals** = 4 (one each: Cat, Mouse, Rooster, Worm)

### Hand Structure
A valid winning hand = **4 sets + 1 pair (14 tiles)**
- **Chow** — 3 consecutive tiles, same suit
- **Pong** — 3 identical tiles
- **Kang** — 4 identical tiles (draws a replacement tile)

### Scoring Formula
```
Points = 2 ^ (total fan)   |   Minimum: 1 fan to win (起胡)
```

| Fan | Hand Type |
|---|---|
| 0 | Chicken Hand (valid only with bonus tile fan) |
| 1 | Lesser Sequence Hand / Self Draw / Dragon Triplet / Own Flower |
| 2 | Triplets Hand / Half Flush |
| 4 | Full Flush / Sequence Hand / Mixed Terminals |
| 5+ | Small Three Dragons, Four Lesser Blessings |
| 7 | Pure One Suit |
| 8 | Big Three Dragons |
| 10 | All Honors |
| Limit | Big Four Winds, Thirteen Orphans, Nine Gates, Four Kangs, Heavenly/Earthly |

### Traditional Singapore Payment Rules

**Discard Win:**
| Points | Discarder pays | Each other player pays | Winner receives |
|---|---|---|---|
| 1 | 2× | 1× | 4× |
| 2 | 4× | 2× | 8× |
| 3 | 8× | 4× | 16× |
| 4 | 16× | 8× | 32× |
| 5 (Limit) | 32× | 16× | 64× |

**Self Draw (Zimo) — more profitable:**
| Points | Each player pays | Winner receives |
|---|---|---|
| 1 | 2× | 6× |
| 2 | 4× | 12× |
| 3 | 8× | 24× |
| 4 | 16× | 48× |
| 5 (Limit) | 32× | 96× |

### Wind Rotation
- Dealer (East) wins → winds **stay**, same dealer
- Any other player wins → winds **rotate anti-clockwise**
- Game ends when all 4 players have completed a turn as dealer

---

## 🚀 How to Use

1. Open **[mahjongyuk.com](https://mahjongyuk.com)**
2. Enter player names and set point value (e.g. 1 pt = $1,000)
3. Set Fan Cap if playing with house rules (default = 13)
4. Select the winning player and tap their tiles
5. The app auto-detects the hand type and fan progress live
6. Add any bonus tiles (Flowers, Seasons, Animals)
7. Tick any manual extra fan conditions (Self Draw, Robbing Kang, etc.)
8. Select who discarded the winning tile (for discard wins)
9. Click **Calculate Results**
10. Click **Start Next Round** — winds rotate automatically!

---

## 📋 Changelog

### Version 1.2 *(Current)*
- 🎴 Redesigned tile picker with large Unicode mahjong tile graphics
- 🎴 Hand display on green felt background with full-size tile visuals
- 🌸 Flowers, Seasons, Animals updated to correct Singapore set (4+4+4, one each)
- ✅ Fan Progress Checklist — live tracking of confirmed and possible fan
- 🔍 Smart Fan Suggestions — filtered by actual hand composition (no contradictory suggestions)
- 🏠 All Honors, Big/Small Three Dragons, Four Winds now properly shown in checklist
- 🐛 Fixed fan double-counting when All Honors or limit hands are detected
- 📖 Full rules rewrite based on official singaporemahjong.com PDF (148 tiles, all hand types, payout tables, penalties)
- 🌏 Custom domain live: mahjongyuk.com
- 📱 Improved mobile responsiveness
- 🔤 Renamed "Man" tiles to "Character" throughout
- 🐉 Dragon and Wind tiles updated to consistent Chinese character style

### Version 1.1
- Added Bahasa Indonesia translation (retained in code, English-only UI)
- Fan cap house rule option added to setup screen
- Congrats page with Final Payout after full game cycle
- Round history carried across rounds without database
- "Who discarded?" selector moved inside Extra Fan section
- Tile limit auto-adjusts for Kang declarations
- Set status box shows named sets (Chow/Pong/Kang + tile name)

### Version 1.0
- Initial release
- 4-player Singapore Mahjong scorer
- Auto hand detection (Chow, Pong, Kang, special hands)
- Wind rotation system
- Flower / Season / Animal bonus tiles
- Traditional Singapore payout calculation
- Mobile responsive design

---

## 🛠️ Tech Stack

- Pure **HTML + CSS + JavaScript** — zero dependencies, zero frameworks
- Single self-contained file (`index.html`)
- Fully offline capable — works without internet after loading
- Hosted on **GitHub Pages** (free)

---

## 🔗 Links

- **Live site:** [mahjongyuk.com](https://mahjongyuk.com)
- **GitHub repo:** [github.com/Mummyz/Mahjong-SG-Calculator-Web](https://github.com/Mummyz/Mahjong-SG-Calculator-Web)

---

*Happy Mahjong 🀄 — Mummyz*

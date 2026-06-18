# 🀄 Singapore Mahjong Calculator
### A web-based point calculator for Singapore-style Mahjong

![GitHub Pages](https://img.shields.io/badge/Live-GitHub%20Pages-brightgreen)
![Language](https://img.shields.io/badge/Built%20With-HTML%20%2F%20CSS%20%2F%20JS-blue)
![License](https://img.shields.io/badge/License-Free%20to%20Use-lightgrey)

---

## 🌐 LIVE DEMO

👉 **[Play it here → MahjongSG](https://bit.ly/MahjongSG)**

---

## 📖 About

A fully offline, mobile-friendly Singapore Mahjong scoring tool.  
No installation, no login, no database — just open and play.

Built specifically for **Singapore rules** including :
- Traditional fan-based scoring (2^fan points)
- Flowers, Seasons & Animals bonus tiles
- Automatic hand detection (Chow, Pong, Kang)
- Wind rotation and dealer rules
- Round history and cumulative payout tracking

---

## ✨ Features

| Feature | Details |
|---|---|
| 🀄 Hand Detection | Auto-detects Chow, Pong, Kang, special hands |
| 🌸 Bonus Tiles | Flowers (4), Seasons (4), Animals (4) |
| 💨 Wind System | Auto seat wind rotation, prevailing wind tracking |
| 💰 Scoring | Traditional Singapore payout (discard + self-draw) |
| 📊 Round History | Full history carried across rounds |
| 📱 Mobile Friendly | Fully responsive, works on phone and tablet |
| 🏆 Game End | Final payout after full cycle |
| 📋 Built-in Rules | Simple Singapore Mahjong rules reference inside the app |

---

## 🃏 Singapore Mahjong Rules (Quick Reference)

### Hand Structure
A valid winning hand = **4 sets + 1 pair (14 tiles)**
- **Chow** — 3 consecutive tiles of the same suit (e.g. Man 3, Man 4, Man 5)
- **Pong** — 3 identical tiles
- **Kang** — 4 identical tiles (draws a replacement tile, hand limit +1)

### Scoring Formula - Points = 2 ^ (total fan)
| Fan | Hand Type |
|---|---|
| 0 | Chicken Hand (valid, no special pattern) |
| 1 | All Sequences / Self Draw / Dragon Triplet / Own Flower |
| 3 | All Triplets / Mixed One Suit / Complete Flowers or Seasons |
| 5 | Small Three Dragons |
| 6 | Small Four Winds |
| 7 | Pure One Suit |
| 8 | Big Three Dragons |
| 10 | All Honors |
| 13 | Big Four Winds / Thirteen Orphans / Nine Gates / Four Kangs |

### Payment Rules
- **Discard win** → Discarder pays **2× base**, each other player pays **1× base** (winner gets 4× total)
- **Self Draw** → Each of 3 losers pays **2× base** (winner gets 6× total — more profitable!)

### Wind Rotation
- Dealer (East) wins → winds **stay**, same dealer plays again
- Any other player wins → winds **rotate anti-clockwise**
- Game ends when all 4 players have completed a turn as dealer

---

## 🚀 How to Use

1. Open the [live link]((https://bit.ly/MahjongSG))
2. Enter player names and set point value
3. Select the winning player and tap their tiles
4. Add any bonus tiles (Flowers, Seasons, Animals)
5. Tick any manual extra fan conditions (Self Draw, etc.)
6. Click **Calculate Results**
7. Click **Start Next Round** — winds rotate automatically!

---

*Happy Mahjong 🀄 — Mummyz*

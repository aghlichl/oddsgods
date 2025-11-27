# PolyWhales Discord Alert Revamp Plan

## 1. Deep Analysis of Current Alert Format

### Current State
The existing alerts in `worker.ts` are functional but minimal.
- **Visuals:** Generic green (`0x00ff00`) or blue (`0x0099ff`) sidebars. No thumbnail images.
- **Typography:** Standard Discord sans-serif. No use of code blocks for alignment.
- **Hierarchy:** Flat. "Market", "Value", "Price" are all equal weight fields.
- **Missing Data:**
  - No wallet intelligence (Win rate, PnL, "Smart Money" badges are hidden in logic but not fully exposed).
  - No visual connection to the specific sport/market (Team logos missing).
  - No "Why this matters" context (e.g., "Swept 3 levels of order book").
- **Clutter:** Repeated text in Description vs Fields.

### What Matters to Traders
1.  **Urgency/Magnitude:** Is this a $500 bet or a $50,000 bet? (Needs visual distinction).
2.  **Smart Money Signal:** Is this a random whale or a proven winner? (Win rate/PnL is critical).
3.  **Market Context:** Who is playing? (Team logos allow instant recognition).
4.  **Actionability:** Link to the market, link to the wallet.

## 2. Brand & Style Direction

**Aesthetic:** "Bloomberg Terminal × Unusual Whales × Polymarket esports feed"
**Core Identity:** Neo-Brutalist, High-Contrast, Data-Dense but Scannable.

### Color Palette
- **Background:** Discord Dark Mode (Default)
- **Accents:**
  - **BUY/YES:** Neon Green (`#00FF00` / `0x00FF00`)
  - **SELL/NO:** Hot Pink/Red (`#FF0044` / `0xFF0044`)
  - **Whale Tier:**
    - *God Whale:* Gold/Amber (`#FFD700`)
    - *Smart Money:* Cyan/Electric Blue (`#00FFFF`)
  - **Text:** White for headers, Light Grey for metadata.

### Typography & Spacing
- **Monospace:** Use Discord code blocks (\` \`) for numerical data to ensure alignment.
- **Headers:** Bold Markdown (`**`) for primary entities (Wallet Name, Market Question).
- **Icons:** Use custom emojis or standard unicode to replace text labels where possible (e.g., 🏆 instead of "Win Rate").

## 3. Information Architecture Upgrade

**New Layout Proposal:**

1.  **Author/Header:**
    - **Icon:** Whale Tier Emoji (🐋, 🦈, 👑)
    - **Name:** Alert Type (e.g., "MEGA WHALE BUY")
    - **Color:** Tier-based color strip.

2.  **Title (Hyperlink):**
    - The Market Question (e.g., "Chiefs vs 49ers Winner?")
    - *Action:* Click to open Polymarket.

3.  **Thumbnail:**
    - Team Logo / Market Image (from `marketMeta.image`).

4.  **Description (The "Ticker"):**
    - A single, dense code block line summarizing the trade.
    - `BUY $50,000 • YES • 54¢ (+2%)`

5.  **Fields (Grid):**
    - **Wallet DNA:** `Smart Money 🧠` | `Win: 78%` | `PnL: +$450k`
    - **Impact:** `Swept 3 Levels` | `Vol: High`
    - **Market Context:** `NFL` | `Super Bowl`

6.  **Footer:**
    - "OddsGods Intelligence • [Timestamp]"

## 4. Discord Rendering Constraints Analysis

- **Embed Limits:**
  - Title: 256 chars
  - Description: 4096 chars
  - Fields: Max 25 (we need ~4-6)
  - Footer: 2048 chars
- **Mobile vs Desktop:**
  - **Desktop:** Fields render in columns (up to 3).
  - **Mobile:** Fields often stack vertically.
  - *Solution:* Use "Inline" fields carefully. Group related data into single fields using newlines to force structure on mobile.
- **Images:**
  - `thumbnail`: Top right (good for team logos).
  - `image`: Big bottom image (good for charts, maybe too noisy for every alert).
  - *Decision:* Use `thumbnail` for Team/Market logo.

## 5. High-Fidelity Example Alert Designs

### Variant A: "The Bloomberg Terminal" (Data-First)
*Focus: Monospace, precision, density.*

```
[Color Strip: Neon Green]
[Thumbnail: Chiefs Logo]
**Title:** Kansas City Chiefs vs San Francisco 49ers? [↗]

**TRADE EXECUTED**
```yaml
SIDE   : BUY (YES)
SIZE   : $55,000
PRICE  : 54.5¢
IMPACT : +1.2% (Sweeper)
```
**WALLET INTELLIGENCE**
`👑 GOD WHALE` • `🧠 Smart Money`
**Win Rate:** 82% (45/55)
**Total PnL:** +$1,240,500
[View Wallet Profile]
```

### Variant B: "The Esports Hype" (Visual-First)
*Focus: Big emojis, bold text, excitement.*

```
[Color Strip: Gold]
[Thumbnail: Trump vs Harris Image]

# 🚨 WHALE NUKE DETECTED

**$125,000** on **DONALD TRUMP** to win!
@ **52¢** (Probability: 52%)

**PLAYER STATS**
🏆 **Win Rate:** 78%
💰 **Bankroll:** $2.5M+
🔥 **Streak:** 3 Wins in a row

*Market: Presidential Election 2024*
[Follow this Whale] | [Bet Now]
```

### Variant C: "Neo-Brutalist Minimal" (Selected Direction)
*Focus: Clean, high-contrast, scannable.*

```
[Color Strip: #00FF00]
[Thumbnail: Market Icon]

**Kansas City Chiefs vs San Francisco 49ers**
> 🐋 **MEGA WHALE** bought **$50,000** of **Chiefs (YES)**

` 🟢 BUY ` ` 💰 $50k ` ` 🏷️ 54¢ ` ` 📊 +2.5% `

**INSIGHTS**
**Wallet:** `0x7a...4f9` (Smart Money 🧠)
**Performance:** 🟢 +$450k PnL | 72% WR
**Context:** Largest trade in this market in 24h.

[Open Market ↗]
```

## 6. Implementation Plan

### Phase 1: Foundation & Types
1.  Create `lib/alerts/formatters.ts`.
2.  Define `AlertStyle` interface (colors, emojis per tier).
3.  Extract `marketMeta.image` correctly in `worker.ts` and pass to alert function.

### Phase 2: The Formatter Logic
Create a reusable function `formatDiscordAlert(trade, profile, market)` that returns the `Embed` object.
- **Logic:**
  - Determine `Color` based on Side (Buy/Sell) and Tier (Whale/God).
  - Format `Money` ($10k, $1.5M).
  - Format `Wallet` (link to Polymarket profile).
  - Construct the "Ticker" string using code blocks.

### Phase 3: Worker Integration
Update `sendWhaleAlertDirectly` in `worker.ts`:
- Fetch `marketMeta.image` (already available).
- Call `formatDiscordAlert`.
- Send payload.

### Phase 4: Testing
- Create a test script `scripts/test-discord-styles.ts` that sends all 3 variants to a private channel to verify mobile rendering.

## 7. Optional Stretch Enhancements
- **Streak Detection:** Query last 5 trades for this wallet in `worker.ts` before alerting. If 3 wins, add 🔥🔥🔥.
- **Micro-Charts:** Generate a sparkline of the last 1h price action using a text-based chart library (e.g., ` ▂▃▅▇`) in the description.
- **Copy Trade Link:** "One-click Copy" link (deep link to OddsGods app with pre-filled trade).

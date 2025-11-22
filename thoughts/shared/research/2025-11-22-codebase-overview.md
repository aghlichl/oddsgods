## Analysis: OddsGods - Prediction Market Aggregator

### Overview

OddsGods is a real-time prediction market aggregator that monitors Polymarket trades, identifies anomalous trading activity, and provides a live feed of "whale" trades to users. The application consists of a Next.js frontend with WebSocket-based real-time data streaming, a background worker that processes trades and stores them in PostgreSQL, and intelligence features for trader profiling and market analysis.

The system processes live trade data from Polymarket's WebSocket API, enriches trades with statistical analysis and trader intelligence, filters them based on user preferences, and displays them in a retro-styled UI with anomaly classification (STANDARD, WHALE, MEGA_WHALE, SUPER_WHALE, GOD_WHALE).

### Entry Points

- `app/page.tsx:42` - Home component renders the main application interface with tabbed navigation
- `server/worker.ts:292` - Background worker connects to Polymarket WebSocket and starts processing
- `lib/market-stream.ts:60` - startFirehose() initiates real-time data streaming for frontend
- `app/api/history/route.ts:4` - GET /api/history endpoint serves historical trades from last 2 hours
- `app/api/top-trades/route.ts:30` - GET /api/top-trades endpoint serves top trades by period (today/weekly/monthly/yearly/max)
- `app/api/leaderboard/route.ts:4` - GET /api/leaderboard endpoint serves top trader leaderboard from last 7 days
- `app/api/proxy/polymarket/markets/route.ts:4` - Proxy endpoint for Gamma API market metadata

### Core Implementation

#### 1. Shared Libraries (`lib/`)

**Configuration (`lib/config.ts`)**
- `CONFIG.THRESHOLDS`: Trade value thresholds (MIN_VALUE: $1000, WHALE: $8000, MEGA_WHALE: $15000, SUPER_WHALE: $50000, GOD_WHALE: $100000)
- `CONFIG.URLS`: External API endpoints (GAMMA_API, WS_CLOB)
- `CONFIG.CONSTANTS`: Processing constants (ODDS_THRESHOLD: 0.97, Z_SCORE_CONTRA_THRESHOLD: 2.0, HEARTBEAT_INTERVAL: 30000ms)

**Type Definitions (`lib/types.ts`)**
- `Anomaly` interface: Core trade data structure with id, type, event, outcome, odds, value, multiplier, zScore, timestamp, side
- `UserPreferences` interface: Filtering options (showStandard, showWhale, showMegaWhale, showSuperWhale, showGodWhale, minValueThreshold)
- `MarketMeta` interface: Market metadata (conditionId, question, outcomes, clobTokenIds)
- `TraderProfile` interface: Wallet intelligence (label, totalPnl, winRate, isFresh, isSmartMoney, isWhale)

**Statistical Analysis (`lib/stats.ts`)**
- `RunningStats` class: Online algorithm for mean, variance, standard deviation, z-score calculation
- `push()`: Updates running statistics with new value
- `getZScore()`: Returns standardized z-score for anomaly detection

**Polymarket Integration (`lib/polymarket.ts`)**
- `fetchMarketsFromGamma()`: Fetches market data from Gamma API with normalization
- `parseMarketData()`: Maps Polymarket data to internal MarketMeta and AssetOutcome structures
- `normalizeMarketResponse()`: Handles API response variations

#### 2. Real-Time Data Streaming (`lib/market-stream.ts`)

**Market Metadata Fetching (`lib/market-stream.ts:40-58`)**
- `fetchMarketMetadata()`: Fetches market metadata via frontend proxy and parses using shared `parseMarketData`
- Updates global maps: `marketsByCondition` and `assetIdToOutcome`
- Returns asset IDs for WebSocket subscription

**WebSocket Connection (`lib/market-stream.ts:60-226`)**
- `startFirehose()`: Main streaming function that connects to Polymarket WebSocket at `CONFIG.URLS.WS_CLOB`
- Subscribes to trades for all active market assets with message format including `assets_ids` and `channel: "trades"`
- Heartbeat logging every 5 seconds
- Metadata refresh every 5 minutes to discover new markets

**Trade Processing (`lib/market-stream.ts:109-210`)**
- Filters trades by minimum value ($1000) and maximum odds (97%)
- Looks up market metadata and outcome labels from cached maps
- Calculates trade value as `price * size`
- Maintains per-market running statistics using `RunningStats`
- Computes z-score for anomaly detection
- Classifies trades: GOD_WHALE ($100k+), SUPER_WHALE ($50k+), MEGA_WHALE ($15k+), WHALE ($8k+), STANDARD
- Applies user preference filtering before emitting anomalies
- Identifies contra trades (low odds + high z-score)

**Preference Filtering (`lib/market-stream.ts:16-38`)**
- `passesPreferences()`: Checks if anomaly meets user-defined filters
- Filters by anomaly type visibility toggles and minimum value threshold

#### 3. Background Trade Processing (`server/worker.ts`)

**Socket.io Setup (`server/worker.ts:15-26`)**
- Creates HTTP server on port 3001 with CORS configuration
- Allows connections from `FRONTEND_URL`

**Market Metadata (`server/worker.ts:36-52`)**
- `updateMarketMetadata()`: Fetches markets directly from Gamma API using `fetchMarketsFromGamma`
- Parses data using shared `parseMarketData` function
- Updates global maps for trade processing

**Trade Enrichment (`server/worker.ts:57-202`)**
- `processTrade()`: Main processing function for individual trades
- Filters noise (< $1000) and unlikely outcomes (> 97% odds)
- Extracts wallet address from trade data (with fallback to mock addresses for demo)
- Enriches with trader profile via `getTraderProfile()`
- Analyzes market impact via `analyzeMarketImpact()`
- Tags trades: WHALE, SMART_MONEY, FRESH_WALLET, SWEEPER
- Creates enriched trade object with market, trade, and analysis sections

**Database Persistence (`server/worker.ts:152-191`)**
- Upserts wallet profiles in `wallet_profiles` table with PnL, win rate, labels
- Creates trade records in `trades` table with intelligence flags
- Links trades to wallet profiles via foreign key relationship

**WebSocket Connection (`server/worker.ts:207-292`)**
- `connectToPolymarket()`: Maintains persistent WebSocket connection to Polymarket CLOB
- Subscribes to all asset IDs for comprehensive trade capture
- Processes trades via `processTrade()` and broadcasts via Socket.io
- Implements reconnection logic with 3-second backoff
- Refreshes metadata every 5 minutes

#### 4. Frontend State Management (`lib/store.ts`)

**Preferences Store (`lib/store.ts:30-63`)**
- `usePreferencesStore`: Manages user filtering preferences with localStorage persistence
- `setPreferences()`: Updates preferences and auto-saves to localStorage
- `loadPreferences()`: Loads saved preferences on app initialization

**Market Store (`lib/store.ts:90-157`)**
- `useMarketStore`: Manages anomaly feed and historical data
- `addAnomaly()`: Adds new anomaly to feed (keeps last 100 items)
- `loadHistory()`: Fetches historical trades from `/api/history`
- `startStream()`: Initializes WebSocket streaming with preference filtering
- `fetchTopTrades()`: Loads top trades by period from `/api/top-trades`
- `setSelectedPeriod()`: Updates selected time period and refetches data

#### 5. Database Schema (`prisma/schema.prisma`)

**WalletProfile Model (`prisma/schema.prisma:13-23`)**
- Primary key: wallet address (lowercased)
- Stores intelligence data: label, totalPnl, winRate, isFresh
- One-to-many relationship with Trade model
- Maps to `wallet_profiles` table

**Trade Model (`prisma/schema.prisma:25-51`)**
- Auto-generated CUID primary key
- Core trade data: assetId, side, size, price, tradeValue, timestamp
- Intelligence flags: isWhale, isSmartMoney, isFresh, isSweeper
- Market context: conditionId, outcome, question
- Foreign key to WalletProfile
- Indexes on walletAddress and timestamp for query performance

### Data Flow

1. **Initialization**
   - Frontend loads user preferences from localStorage
   - Worker fetches market metadata from Gamma API
   - Frontend fetches market metadata via proxy API

2. **Real-Time Streaming**
   - Both frontend and worker establish WebSocket connections to Polymarket CLOB
   - Subscribe to trade events for all active market assets
   - Worker processes all trades, frontend processes filtered subset

3. **Trade Processing**
   - **Frontend**: Statistical analysis (z-score), basic classification, user filtering
   - **Worker**: Intelligence enrichment (wallet profiling, market impact), database persistence

4. **Data Persistence**
   - Worker upserts wallet profiles with intelligence data
   - Worker saves enriched trades to PostgreSQL
   - Worker broadcasts enriched trades via Socket.io

5. **Frontend Display**
   - Real-time anomalies displayed in live feed
   - Historical data loaded from `/api/history` on initialization
   - Top trades and leaderboard fetched from respective APIs

### Key Patterns

- **Shared Logic Library**: Core business logic centralized in `lib/` with consistent interfaces
- **Dual WebSocket Architecture**: Separate connections for display (frontend) and processing (worker)
- **Repository Pattern**: Prisma ORM abstracts database operations
- **Observer Pattern**: Socket.io enables real-time broadcasting to connected clients
- **Statistical Anomaly Detection**: Online Welford's algorithm for streaming z-score calculation
- **Intelligence Enrichment**: Multi-layered trader profiling with caching and market impact analysis
- **Progressive Enhancement**: Frontend works without worker, worker provides enhanced features

### Configuration

- **Centralized Config**: All thresholds, URLs, and constants in `lib/config.ts`
- **Environment Variables**: `REDIS_URL`, `POLYGON_RPC_URL`, `FRONTEND_URL`, `DATABASE_URL`
- **Trade Classification**: Value-based tiers with configurable thresholds
- **Processing Constants**: Odds filtering, z-score thresholds, refresh intervals

### Error Handling

- **WebSocket Resilience**: Automatic reconnection with exponential backoff
- **Graceful Degradation**: Redis caching failures don't break core functionality
- **API Normalization**: Polymarket API response variations handled consistently
- **Database Safety**: Prisma operations wrapped in try-catch with error logging
- **Frontend Robustness**: Loading states, error boundaries, and fallback displays

### Intelligence Features

#### Trader Profiling (`lib/intelligence.ts:50-158`)
- `fetchTraderProfileFromAPI()`: Queries Polymarket Data API for position history
- Calculates PnL and win rate from position data
- Assigns labels based on performance metrics (Smart Whale: PnL > $50k + win rate > 60%)
- `checkWalletFreshness()`: Queries Polygon RPC for transaction count (< 10 = fresh)
- `getTraderProfile()`: Orchestrates profiling with Redis caching (24-hour TTL)

#### Market Impact Analysis (`lib/intelligence.ts:163-214`)
- `analyzeMarketImpact()`: Fetches order book data from Polymarket CLOB API
- Simulates trade execution to measure price impact
- Detects "sweepers" by checking if trade exceeds available liquidity or sweeps > 3 levels
- Calculates slippage percentage based on price movement

### UI Components

**Home Component (`app/page.tsx:42-134`)**
- Tabbed navigation: Feed, Preferences, Top Whales
- Renders filtered anomaly feed using `SlotReel` component
- Displays loading states and empty states
- Bottom navigation with live indicator and version info

**User Preferences (`components/user-preferences.tsx:44-349`)**
- Exponential slider for minimum value threshold ($1K to $1M range)
- Toggle switches for anomaly type visibility
- Color-coded tier system (WHALE=blue, MEGA=purple, SUPER=red, GOD=yellow)
- Real-time preview of active filters

**Anomaly Feed (`components/feed/anomaly-card.tsx`)**
- Renders individual trade cards with retro styling
- Displays event, outcome, odds, value, multiplier, and z-score
- Visual indicators for trade side (BUY/SELL) and contra status
- Animated entrance effects

### API Routes

**History API (`app/api/history/route.ts:4-62`)**
- Fetches whale trades (> $10K) from last 2 hours
- Transforms database trades to Anomaly interface format
- Includes wallet profile data for enriched display

**Top Trades API (`app/api/top-trades/route.ts:30-106`)**
- Supports period filtering: today, weekly, monthly, yearly, max
- Queries trades by tradeValue descending, limited to top 100
- Transforms to Anomaly format matching history API

**Leaderboard API (`app/api/leaderboard/route.ts:4-58`)**
- Aggregates top wallets by volume from last 7 days
- Groups trades by walletAddress with sum of tradeValue and count
- Enriches with wallet profile data (PnL, win rate, labels)

**Proxy API (`app/api/proxy/polymarket/markets/route.ts:4-20`)**
- Proxies Gamma API requests with caching (60 seconds)
- Uses shared `fetchMarketsFromGamma` function for consistency

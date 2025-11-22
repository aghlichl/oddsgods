## Analysis: OddsGods - Prediction Market Aggregator

### Overview

OddsGods is a real-time prediction market aggregator that monitors Polymarket trades, identifies anomalous trading activity, and provides a live feed of "whale" trades to users. The application consists of a Next.js frontend with WebSocket-based real-time data streaming, a background worker that processes trades and stores them in PostgreSQL, and intelligence features for trader profiling and market analysis.

The system processes live trade data from Polymarket's WebSocket API, enriches trades with statistical analysis and trader intelligence, filters them based on user preferences, and displays them in a retro-styled UI with anomaly classification (STANDARD, WHALE, MEGA_WHALE).

### Entry Points

- `app/page.tsx:38` - Home component renders the main application interface
- `server/worker.ts:384` - Background worker connects to Polymarket WebSocket
- `lib/market-stream.ts:145` - startFirehose() initiates real-time data streaming
- `app/api/history/route.ts:4` - GET /api/history endpoint serves historical trades
- `app/api/top-trades/route.ts:30` - GET /api/top-trades endpoint serves top trades by period
- `app/api/leaderboard/route.ts:4` - GET /api/leaderboard endpoint serves top trader leaderboard

### Core Implementation

#### 1. Real-Time Data Streaming (`lib/market-stream.ts:151-330`)

- Connects to Polymarket WebSocket at `wss://ws-subscriptions-clob.polymarket.com/ws/market`
- Fetches market metadata from `/api/proxy/polymarket/markets` at startup
- Subscribes to trade events for all active market assets using asset IDs
- Processes incoming trade messages with event types "last_trade_price" and "trade"
- Filters trades below $1,000 threshold and outcomes with price > 97% (odds > 97) or 99c/100c bets
- Maintains running statistics per market using `RunningStats` class for z-score calculation
- Classifies anomalies as STANDARD (<$8K), WHALE ($8K+), MEGA_WHALE ($15K+), SUPER_WHALE ($50K+), or GOD_WHALE ($100K+) based on trade value
- Applies user preference filtering before emitting anomalies to UI

#### 2. Background Trade Processing (`server/worker.ts:138-287`)

- Maintains separate WebSocket connection to Polymarket for comprehensive trade processing (`server/worker.ts:292-373`)
- Processes trades through `processTrade()` function (`server/worker.ts:138-287`) that enriches data with trader intelligence
- Calls `getTraderProfile()` to fetch wallet statistics from Polymarket Data API
- Analyzes market impact via `analyzeMarketImpact()` to detect order book sweeping
- Persists enriched trades to PostgreSQL using Prisma ORM with wallet profile upsert and trade creation
- Broadcasts processed trades to Socket.io clients on port 3001
- Uses mock wallet addresses for demonstration when real addresses unavailable

#### 3. Frontend State Management (`lib/store.ts:30-157`)

- Uses Zustand for global state with two main stores: `usePreferencesStore` and `useMarketStore`
- `usePreferencesStore` (`lib/store.ts:30-63`) manages user filtering preferences with localStorage persistence including showStandard, showWhale, showMegaWhale, showSuperWhale, showGodWhale, and minValueThreshold
- `useMarketStore` (`lib/store.ts:90-157`) handles anomalies array, loading states, and top trades functionality
- Maintains rolling 100-anomaly buffer for real-time display
- Fetches historical data on stream start and appends real-time anomalies
- Implements period-based top trades fetching (today, weekly, monthly, yearly, max) with default period 'weekly'

#### 4. Database Schema (`prisma/schema.prisma:13-51`)

- `WalletProfile` model stores trader intelligence (PnL, win rate, labels, freshness)
- `Trade` model captures enriched trade data with foreign key to wallet profiles
- Includes intelligence flags (isWhale, isSmartMoney, isFresh, isSweeper)
- Indexed on wallet address and timestamp for efficient queries
- Stores market context (conditionId, outcome, question) for trade enrichment

### Data Flow

1. **Market Data Ingestion**: Worker connects to Polymarket WebSocket and fetches market metadata
2. **Real-Time Processing**: Frontend establishes WebSocket connection via `startFirehose()`
3. **Trade Enrichment**: Background worker processes trades with intelligence analysis
4. **Database Persistence**: Enriched trades stored in PostgreSQL with wallet profile data
5. **Frontend Display**: Real-time anomalies filtered by user preferences and displayed in UI
6. **Historical API**: History and top-trades endpoints serve aggregated database data
7. **Intelligence Caching**: Redis caches trader profiles for 24-hour TTL to reduce API calls

### Key Patterns

- **WebSocket Streaming Pattern**: Dual WebSocket connections (frontend for display, worker for processing)
- **Intelligence Enrichment Pattern**: Multi-step trade processing with API calls and analysis
- **Preference Filtering Pattern**: Client-side filtering with server-side defaults
- **Statistical Anomaly Detection**: Running z-score calculation per market condition
- **Repository Pattern**: Prisma ORM abstracts database operations
- **Observer Pattern**: Socket.io broadcasting of processed trades

### Configuration

- Environment variables: `REDIS_URL`, `POLYGON_RPC_URL`, `FRONTEND_URL`
- Database: PostgreSQL with custom schema in `../generated` directory
- WebSocket endpoints: Polymarket at port 443, internal Socket.io at port 3001
- API rate limiting: 60-second cache for market metadata, 24-hour cache for trader profiles
- Trade thresholds: $1,000 minimum, $8,000 WHALE, $15,000 MEGA_WHALE, $50,000 SUPER_WHALE, $100,000 GOD_WHALE

### Error Handling

- WebSocket reconnection with 3-second backoff for network failures
- Graceful Redis degradation when caching unavailable
- API error handling with fallback to mock data in worker
- Frontend loading states and error boundaries for network issues
- Database operation error logging without stopping processing

### Intelligence Features

#### Trader Profiling (`lib/intelligence.ts:118-158`)
- Fetches position data from `https://data-api.polymarket.com/positions`
- Calculates total PnL, win rate, and whale status from historical positions
- Checks wallet freshness via Polygon RPC transaction count (< 10 transactions)
- Assigns labels: "Smart Whale", "Whale", "Smart Money", "Degen"
- Redis caching prevents repeated API calls for same wallet

#### Market Impact Analysis (`lib/intelligence.ts:163-214`)
- Queries Polymarket CLOB order book at `https://clob.polymarket.com/book`
- Calculates liquidity sweep detection by accumulating order book levels
- Determines price impact percentage and sweeper classification (>3 levels swept)
- Used to tag trades as "SWEEPER" in enriched trade data

### UI Components

#### Anomaly Feed (`components/feed/anomaly-card.tsx:23-91`)
- Renders trade cards with market question, outcome, value, and odds
- Color-coded borders: zinc (standard), blue (whale), purple (mega whale)
- Hover overlay shows timestamp, gauge component displays odds visually
- Side indicators (BUY/SELL) with green/red color scheme

#### User Preferences (`components/user-preferences.tsx:5-162`)
- Toggle switches for anomaly type filtering (STANDARD $0-8K, WHALE $8K-15K, MEGA_WHALE $15K-50K, SUPER_WHALE $50K-100K, GOD_WHALE $100K+)
- Range slider for minimum value threshold ($0-$1M)
- Auto-saves to localStorage on preference changes
- Visual feedback with active/inactive styling and color-coded borders

#### Top Whales Leaderboard (`components/top-whales.tsx:20-99`)
- Period selector buttons (today, weekly, monthly, yearly, all-time)
- Ranked list with top trades by value (no explicit limit in UI)
- Loading states and empty state handling
- Rank indicators with gold/silver/bronze styling for top 3 (yellow/gold for 1st, gray/silver for 2nd, orange/bronze for 3rd)

### API Routes

#### History API (`app/api/history/route.ts:4-60`)
- Fetches whale trades (> $10K) from last 30 minutes
- Includes wallet profile data via Prisma relation
- Transforms database trades to Anomaly interface format
- Used for initial feed population on page load

#### Top Trades API (`app/api/top-trades/route.ts:30-100`)
- Dynamic date filtering based on period parameter
- Orders by trade value descending, limited to 100 results
- Minimum $1,000 threshold for meaningful trades
- Returns standardized anomaly format for UI consumption

#### Leaderboard API (`app/api/leaderboard/route.ts:4-58`)
- Aggregates wallet trading volume over 7-day window
- Groups trades by wallet address with sum/count operations
- Enriches with wallet profile data (PnL, win rate, labels)
- Returns top 10 wallets by trading volume

### Proxy APIs

#### Polymarket Proxy (`app/api/proxy/polymarket/route.ts:3-32`)
- Forwards requests to Polymarket Gamma API events endpoint
- Filters for active, open markets ordered by 24-hour volume
- Used by worker for market discovery and metadata

#### Markets Proxy (`app/api/proxy/polymarket/markets/route.ts:3-34`)
- Proxies market details from Gamma API markets endpoint
- 60-second cache for market metadata
- Provides condition IDs, questions, outcomes, and token mappings

### Background Services

#### Socket.io Server (`server/worker.ts:12-23`)
- Runs on port 3001 with CORS configuration
- Broadcasts enriched trade events to connected clients
- Enables real-time features for multiple frontend instances

#### Metadata Refresh (`server/worker.ts:76-133`)
- Fetches market metadata every 5 minutes to discover new markets
- Parses nested API responses (markets.data or direct array)
- Maps condition IDs to market details and asset IDs to outcomes
- Maintains in-memory maps for fast trade enrichment lookups

### Statistical Analysis

#### Running Statistics (`lib/stats.ts:1-36`)
- Implements Welford's online algorithm for mean/variance calculation
- Maintains count, mean, and sum of squared differences (M2)
- Calculates z-scores for anomaly detection per market condition
- Provides variance and standard deviation for statistical analysis

### Caching Strategy

- **Redis Layer**: 24-hour TTL for trader profiles, handles API rate limiting
- **Memory Maps**: In-memory market metadata and asset mappings refreshed every 5 minutes
- **API Cache**: Next.js revalidate settings (60 seconds for markets, 0 for live data)
- **Local Storage**: User preferences persisted client-side

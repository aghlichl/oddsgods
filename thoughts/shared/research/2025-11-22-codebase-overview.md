## Analysis: OddsGods - Real-time Polymarket Trade Intelligence Platform

### Overview

OddsGods is a Next.js-based real-time trading intelligence platform that monitors Polymarket trades, classifies them by size and trader profile, and presents them through an animated, gamified interface. The application streams live trade data from Polymarket's WebSocket API, enriches trades with trader intelligence data, persists them to a PostgreSQL database, and displays them to users with filtering and ranking capabilities.

### Entry Points

- `app/page.tsx:42` - Home component that renders the main application interface with three navigation pages
- `server/worker.ts:299` - Background worker that connects to Polymarket WebSocket and processes trades
- `app/api/history/route.ts:4` - GET endpoint serving recent whale trades (last 24 hours)
- `app/api/top-trades/route.ts:30` - GET endpoint serving largest trades by period (today/weekly/monthly/yearly/max)
- `app/api/leaderboard/route.ts:4` - GET endpoint serving top trading wallets by volume (last 7 days)

### Core Implementation

#### 1. Real-time Market Streaming (`lib/market-stream.ts:56-204`)

- Establishes WebSocket connection to `wss://ws-subscriptions-clob.polymarket.com/ws/market` at `lib/market-stream.ts:70`
- Subscribes to all active market assets with channel "trades" at `lib/market-stream.ts:76-81`
- Filters trades by minimum value threshold ($1,000) at `lib/market-stream.ts:124`
- Classifies trades into anomaly types based on value thresholds at `lib/market-stream.ts:147-152`:
  - STANDARD: < $8,000
  - WHALE: $8,000 - $14,999
  - MEGA_WHALE: $15,000 - $49,999
  - SUPER_WHALE: $50,000 - $99,999
  - GOD_WHALE: ≥ $100,000
- Applies user preference filtering at `lib/market-stream.ts:177-181` before emitting anomalies
- Refreshes market metadata every 5 minutes at `lib/market-stream.ts:87-102`

#### 2. Trade Intelligence Processing (`server/worker.ts:57-210`)

- Processes each trade through `processTrade()` function at `server/worker.ts:57`
- Fetches trader profile from Polymarket Data API at `lib/intelligence.ts:53-100`
- Analyzes market impact by checking order book liquidity at `lib/intelligence.ts:174-225`
- Tags trades with intelligence flags at `server/worker.ts:102-107`:
  - WHALE: trade value > $10,000 or trader profile indicates whale status
  - SMART_MONEY: trader has high win rate (>60%) and large PnL (>50k)
  - FRESH_WALLET: wallet has < 10 transactions
  - SWEEPER: trade swept multiple order book levels
  - INSIDER: low activity wallet with high win rate and large PnL
- Persists enriched trades to PostgreSQL via Prisma at `server/worker.ts:154-198`

#### 3. State Management (`lib/store.ts:90-157`)

- Uses Zustand for client-side state with two main stores:
  - `usePreferencesStore` at `lib/store.ts:30-63` - manages user filtering preferences in localStorage
  - `useMarketStore` at `lib/store.ts:90-157` - manages anomalies, volume, and top trades state
- Maintains rolling buffer of 100 recent anomalies at `lib/store.ts:101`
- Accumulates total trading volume at `lib/store.ts:102`
- Generates ticker items for top navigation at `lib/store.ts:103`

#### 4. Database Layer (`prisma/schema.prisma:13-54`)

- Stores trader profiles in `WalletProfile` model with intelligence metrics
- Persists all trades in `Trade` model with foreign key to wallet profiles
- Indexes on wallet address and timestamp for efficient queries at `prisma/schema.prisma:50-51`
- Uses PostgreSQL with custom table mapping at `prisma/schema.prisma:25, 54`

### Data Flow

1. **Trade Ingestion**: Polymarket WebSocket → `server/worker.ts:258-274` → trade parsing
2. **Intelligence Enrichment**: Raw trade → `server/worker.ts:57-210` → trader profile fetch (`lib/intelligence.ts:121-169`) → market impact analysis (`lib/intelligence.ts:174-225`) → tagging
3. **Persistence**: Enriched trade → Prisma models → PostgreSQL database
4. **Real-time Broadcasting**: Enriched trade → Socket.io server (`server/worker.ts:203-204`) → connected clients
5. **Frontend Streaming**: WebSocket connection (`lib/market-stream.ts:56-204`) → preference filtering → Zustand store → React components
6. **API Serving**: Database queries → API routes → JSON responses → frontend state updates

### Key Patterns

- **Observer Pattern**: WebSocket connections emit events to multiple subscribers (worker persistence, real-time broadcasting, frontend streaming)
- **Repository Pattern**: Prisma provides data access abstraction in API routes
- **Strategy Pattern**: Trade classification uses threshold-based strategies (`lib/config.ts:2-8`)
- **Decorator Pattern**: Trade enrichment adds layers of intelligence data without modifying core trade structure
- **Factory Pattern**: Polymarket data parsing creates market metadata mappings (`lib/polymarket.ts`)

### Configuration

- Trade thresholds defined in `lib/config.ts:2-8` with values: MIN_VALUE=1000, WHALE=8000, MEGA_WHALE=15000, SUPER_WHALE=50000, GOD_WHALE=100000
- WebSocket URLs configured in `lib/config.ts:9-12` for Gamma API and CLOB WebSocket
- Intelligence constants in `lib/config.ts:13-19` including odds threshold (0.97) and refresh intervals
- Environment variables for Redis URL, Polygon RPC URL, and database connection

### Error Handling

- WebSocket reconnection with exponential backoff at `lib/market-stream.ts:191-195` and `server/worker.ts:280-284`
- Redis connection failures gracefully degrade caching at `lib/intelligence.ts:15-22`
- API fetch failures return default values at `lib/intelligence.ts:58-60`
- Database errors are logged but don't crash the worker at `server/worker.ts:199-201`

### User Interface Components

#### Feed View (`app/page.tsx:80-99`)
- Displays filtered anomalies in `SlotReel` component with entrance animations
- Shows loading states and empty states based on data availability
- Implements preference-based filtering at `app/page.tsx:21-40`

#### Preferences View (`components/user-preferences.tsx`)
- Provides toggles for anomaly type visibility (Standard through God Whale)
- Includes minimum value threshold slider
- Persists settings to localStorage via Zustand store

#### Top Whales View (`components/top-whales.tsx:20-132`)
- Period selector for time ranges (today, weekly, monthly, yearly, all-time)
- Displays ranked list of largest trades with position indicators
- Special animations for God Whale trades

#### Anomaly Cards (`components/feed/anomaly-card.tsx:21-280`)
- Tiered visual design based on anomaly type with distinct color schemes and effects
- God Whale: cosmic energy effects with spinning gradients and flash animations
- Super Whale: critical overload with glitch effects and heat distortion
- Mega Whale: arcane rune with nebula swirls and cosmic dust particles
- Whale: bioluminescent deep with ocean-like breathing effects
- Displays trade amount in holographic data shard design at `components/feed/anomaly-card.tsx:172-235`

### Background Services

#### Intelligence Worker (`server/worker.ts:299`)
- Runs as separate Node.js process on port 3001
- Maintains persistent WebSocket connection to Polymarket
- Processes trades asynchronously to avoid blocking
- Broadcasts enriched trades via Socket.io for real-time updates

#### Caching Layer (`lib/intelligence.ts:6-22`)
- Redis-based caching of trader profiles with 24-hour TTL
- Graceful degradation when Redis unavailable
- Polygon RPC integration for wallet transaction count analysis

### API Architecture

#### History API (`app/api/history/route.ts:4-81`)
- Fetches whale trades (> $10,000) from last 24 hours
- Transforms database trades to Anomaly interface format
- Includes wallet profile data for trader context

#### Top Trades API (`app/api/top-trades/route.ts:30-124`)
- Supports period-based filtering with date range calculations
- Returns top 100 trades by value for specified time period
- Transforms trades with wallet intelligence data

#### Leaderboard API (`app/api/leaderboard/route.ts:4-58`)
- Aggregates trading volume by wallet over 7-day period
- Returns top 10 wallets by total volume
- Enriches with profile data for display

#### Market History API (`app/api/market-history/route.ts:4-85`)
- Provides price history for specific market outcomes
- Supports wallet-specific trade history
- Converts timestamps and prices for charting (cents format)
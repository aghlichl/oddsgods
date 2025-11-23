## Analysis: OddsGods - Prediction Market Intelligence Platform

### Overview

OddsGods is a Next.js application that provides real-time monitoring and analysis of Polymarket prediction market trades. The platform aggregates trade data, classifies trades by value tiers (Standard, Whale, Mega Whale, Super Whale, God Whale), enriches trades with trader profile data, and displays anomalies through a streaming interface with visual effects for different trade sizes.

### Entry Points

- `app/page.tsx:41` - Home component serving as main application interface
- `server/worker.ts:314` - Background worker process that connects to Polymarket WebSocket
- `app/api/history/route.ts:4` - REST API endpoint for historical trade data
- `app/api/top-trades/route.ts:30` - REST API endpoint for top trades by time period
- `app/api/proxy/polymarket/markets/route.ts:4` - Proxy endpoint for Polymarket market metadata

### Core Implementation

#### 1. Main Application Structure (`app/page.tsx:41-182`)

- Renders three main views: Live Feed (page 1), User Preferences (page 0), and Top Whales (page 2)
- Uses Zustand stores for state management (`useMarketStore`, `usePreferencesStore`)
- Implements intelligent search filtering at `app/page.tsx:61-78` with exact and fuzzy matching
- Applies user preference filtering at `app/page.tsx:20-39` and `app/page.tsx:81-83`
- Maintains pagination state with `currentPage` and search query state with `searchQuery`

#### 2. State Management (`lib/store.ts`)

##### Preferences Store (`lib/store.ts:30-63`)
- Manages user filtering preferences for anomaly types and minimum value thresholds
- Persists preferences to localStorage with auto-save on changes
- Defaults defined at `lib/store.ts:13-20` with all anomaly types enabled and $0 minimum threshold

##### Market Store (`lib/store.ts:90-157`)
- Maintains real-time anomalies array with 100 item limit
- Tracks volume accumulation and manages ticker display items
- Fetches historical data on stream start at `lib/store.ts:122-123`
- Provides top trades functionality with period-based filtering (today, weekly, monthly, yearly, max)

#### 3. Real-Time Data Streaming (`lib/market-stream.ts`)

##### Market Metadata Management (`lib/market-stream.ts:36-54`)
- Fetches market metadata from `/api/proxy/polymarket/markets` endpoint
- Parses market data at `lib/market-stream.ts:43` using `parseMarketData` function
- Maps condition IDs to market metadata and asset IDs to outcome labels

##### WebSocket Connection (`lib/market-stream.ts:56-214`)
- Connects to Polymarket WebSocket at `CONFIG.URLS.WS_CLOB`
- Subscribes to trade events for all asset IDs at `lib/market-stream.ts:75-80`
- Refreshes market metadata every 5 minutes at `lib/market-stream.ts:87-102`

##### Trade Processing Logic (`lib/market-stream.ts:105-194`)
- Filters trades below $1000 threshold at `lib/market-stream.ts:124`
- Filters out outcomes above 97% odds at `lib/market-stream.ts:158`
- Classifies trades into anomaly types based on value thresholds at `lib/market-stream.ts:147-152`
- Enriches trades with wallet context at `lib/market-stream.ts:166-182`
- Applies user preference filtering before emitting anomalies at `lib/market-stream.ts:187-192`

#### 4. Background Processing (`server/worker.ts`)

##### Database Persistence (`server/worker.ts:169-217`)
- Upserts wallet profiles at `server/worker.ts:171-193` with trader statistics
- Creates trade records at `server/worker.ts:195-213` with intelligence flags
- Broadcasts enriched trades via Socket.io at `server/worker.ts:219`

##### Intelligence Enrichment (`server/worker.ts:111-122`)
- Tags trades with intelligence flags (WHALE, SMART_MONEY, FRESH_WALLET, SWEEPER, INSIDER)
- Analyzes trader profiles using `getTraderProfile` at `server/worker.ts:112`
- Evaluates market impact using `analyzeMarketImpact` at `server/worker.ts:115`

##### WebSocket Processing (`server/worker.ts:273-289`)
- Processes trade events from Polymarket WebSocket at `server/worker.ts:277-285`
- Handles both individual trades and trade arrays at `server/worker.ts:278-279`

### Data Flow

1. **Market Data Acquisition**: `server/worker.ts:235` connects to Polymarket WebSocket and fetches initial market metadata via `updateMarketMetadata()`

2. **Real-Time Trade Processing**: WebSocket receives trade events at `server/worker.ts:273`, processes them through `processTrade()` function, and broadcasts to Socket.io clients

3. **Frontend Streaming**: `lib/market-stream.ts:56` starts firehose stream, receives enriched anomalies, and adds them to Zustand store via `addAnomaly()`

4. **Historical Data**: `app/page.tsx:90-95` triggers historical data load on component mount through `startStream()` which calls `loadHistory()` at `lib/store.ts:105-120`

5. **API Data Serving**: `app/api/history/route.ts:4-81` queries database for recent trades, transforms them to Anomaly format, and returns JSON response

6. **Top Trades**: `app/api/top-trades/route.ts:30-124` accepts period parameter, applies date filtering via `getDateFilter()`, and returns sorted trade data

### Key Patterns

- **Factory Pattern**: Trade enrichment logic centralized in `processTrade()` function at `server/worker.ts:59`
- **Repository Pattern**: Database operations abstracted through Prisma client with models for Trade and WalletProfile
- **Observer Pattern**: Socket.io broadcasting at `server/worker.ts:219` and Zustand store subscriptions
- **Strategy Pattern**: Different anomaly classification thresholds in `CONFIG.THRESHOLDS` at `lib/config.ts:2-8`
- **Middleware Chain**: Preference filtering applied both in streaming (`lib/market-stream.ts:187-192`) and historical data (`app/page.tsx:81-83`)

### Configuration

- **Trade Thresholds**: Defined at `lib/config.ts:2-8` with GOD_WHALE at $100k, SUPER_WHALE at $50k, MEGA_WHALE at $15k, WHALE at $8k, minimum at $1k
- **API Endpoints**: Polymarket Gamma API at `lib/config.ts:10` and WebSocket at `lib/config.ts:11`
- **Processing Constants**: Odds threshold at 97% (`lib/config.ts:14`), metadata refresh every 5 minutes (`lib/config.ts:17`)
- **Intelligence Settings**: Activity levels based on transaction counts (LOW <50, MEDIUM <500, HIGH >=500) at `lib/intelligence.ts:145-147`

### Error Handling

- **WebSocket Reconnection**: Automatic reconnection with 3-second delay at `lib/market-stream.ts:202-205` and `server/worker.ts:295-299`
- **API Fallbacks**: Graceful degradation when Polymarket APIs unavailable, continues processing with available data
- **Database Errors**: Logged at `server/worker.ts:215` but don't stop processing pipeline
- **Cache Failures**: Redis errors at `lib/intelligence.ts:164` don't prevent API calls, cache simply unavailable
- **Preference Loading**: Falls back to defaults on localStorage parse errors at `lib/store.ts:50-52`
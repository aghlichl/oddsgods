## Analysis: API Data Flow Between Frontend and Backend

### Overview

This system implements a real-time trading intelligence platform that processes Polymarket trade data through multiple processing layers. The architecture consists of a Next.js frontend consuming data from a Socket.io-powered backend worker that processes live trade streams, with comprehensive API endpoints for historical data access. The system transforms raw Polymarket trades into enriched "anomalies" with wallet profiling, market analysis, and trader intelligence.

### Entry Points

- `server/worker.ts:325` - Main worker process that connects to Polymarket WebSocket
- `app/api/history/route.ts:5` - GET /api/history endpoint for paginated historical trades
- `app/api/leaderboard/route.ts:4` - GET /api/leaderboard endpoint for top trading wallets
- `app/api/market-history/route.ts:4` - GET /api/market-history endpoint for price/wallet charts
- `app/api/top-trades/route.ts:31` - GET /api/top-trades endpoint for filtered top trades
- `app/api/top-whales/route.ts:4` - GET /api/top-whales endpoint for wallet leaderboards
- `app/api/save-trade/route.ts:19` - POST /api/save-trade endpoint for manual trade storage
- `app/api/proxy/polymarket/route.ts:3` - GET /api/proxy/polymarket endpoint for live market data
- `app/page.tsx:44` - Main React component that orchestrates data flow

### Core Implementation

#### 1. Real-time Data Pipeline (`server/worker.ts:240-327`)

- **WebSocket Connection**: Connects to Polymarket's CLOB WebSocket at `CONFIG.URLS.WS_CLOB`
- **Metadata Refresh**: Calls `updateMarketMetadata()` every 5 minutes to sync market mappings
- **Trade Processing**: Each incoming trade triggers `processTrade()` which:
  - Validates trade data (price, size, asset_id)
  - Filters noise (< $1,000 trades)
  - Enriches with wallet intelligence via `getTraderProfile()`
  - Analyzes market impact via `analyzeMarketImpact()`
  - Applies anomaly classification (GOD_WHALE > $100k, SUPER_WHALE > $50k, etc.)
  - Persists to database and broadcasts via Socket.io

#### 2. Database Persistence Layer (`server/worker.ts:177-226`)

- **Wallet Profile Upsert**: Creates/updates wallet profiles with P&L, win rate, transaction counts
- **Trade Storage**: Saves enriched trade data with anomaly flags (isWhale, isSmartMoney, etc.)
- **Dual Persistence**: Both worker and frontend API routes can save trades

#### 3. Frontend State Management (`lib/store.ts:129-301`)

- **Zustand Store**: Manages anomalies, history, top trades, and user preferences
- **Real-time Stream**: `startStream()` connects to worker's Socket.io server
- **Historical Loading**: `loadHistory()` fetches paginated data from `/api/history`
- **Top Trades**: `fetchTopTrades()` loads period-filtered data from `/api/top-trades`
- **Preference Filtering**: Client-side filtering based on user settings

#### 4. API Route Implementations

##### History API (`app/api/history/route.ts:5-107`)
- Fetches trades > $10k from last 24 hours, ordered by timestamp DESC
- Uses cursor-based pagination with 100 items per page
- Transforms database trades to "anomaly" format matching real-time data
- Returns `{trades: Anomaly[], nextCursor?: string}`

##### Leaderboard API (`app/api/leaderboard/route.ts:4-58`)
- Aggregates top 10 wallets by volume from last 7 days using Prisma `groupBy`
- Enriches with wallet profile data (P&L, win rate)
- Returns array of wallet objects with volume and trade count

##### Market History API (`app/api/market-history/route.ts:4-85`)
- Fetches last 100 price trades and optional wallet history (20 trades)
- Converts prices to cents (multiply by 100) and timestamps to numbers
- Returns chronological data for charting: `{priceHistory: [], walletHistory: []}`

##### Top Trades API (`app/api/top-trades/route.ts:31-159`)
- Filters trades by period (today/weekly/monthly/yearly/max) and value (> $1000)
- Uses cursor-based pagination with 100 items per page
- Transforms to anomaly format with enhanced wallet context
- Returns period, count, nextCursor, and trades array

##### Top Whales API (`app/api/top-whales/route.ts:4-50`)
- Gets top 20 wallet profiles ordered by totalPnl DESC
- Includes trade count via `_count` aggregation
- Returns enriched wallet profile data

##### Save Trade API (`app/api/save-trade/route.ts:19-90`)
- Accepts trade data via POST and validates required fields
- Determines intelligence flags based on anomaly type
- Upserts wallet profile and creates trade record
- Used by frontend `saveTradeToDatabase()` function

##### Proxy APIs (`app/api/proxy/polymarket/`)
- **Markets Route**: Caches market metadata for 60 seconds via `fetchMarketsFromGamma()`
- **Events Route**: Proxies live market data with no caching for real-time updates

### Data Flow

#### Real-time Trade Processing:
1. **Polymarket WebSocket** → Raw trade events
2. **Worker Process** (`server/worker.ts:68`) → Intelligence enrichment
3. **Database Storage** → Trade and wallet profile persistence
4. **Socket.io Broadcast** → Real-time frontend updates
5. **Frontend Store** (`lib/store.ts:144`) → UI state updates

#### Historical Data Loading:
1. **Frontend Request** → API call to `/api/history` with cursor
2. **Database Query** → Paginated trade fetch with wallet joins
3. **Data Transformation** → Convert to anomaly format
4. **Frontend Store** → Append to anomalies array
5. **UI Rendering** → Display in feed with infinite scroll

#### Top Trades Flow:
1. **Period Selection** → User selects time period
2. **API Request** → `/api/top-trades?period=X&cursor=Y`
3. **Database Aggregation** → Filter by date range and order by value DESC
4. **Cursor Pagination** → Return next batch of high-value trades
5. **Store Update** → Update topTrades array with ranking indicators

#### Market Analysis Flow:
1. **Trade Details Modal** → User clicks on anomaly card
2. **History API Call** → `/api/market-history?question=X&outcome=Y&walletAddress=Z`
3. **Dual Data Fetch** → Price history + wallet trading history
4. **Chart Rendering** → Recharts visualization of price movements

### Key Patterns

- **Dual Processing Paths**: Both worker and frontend can process/save trades
- **Cursor-based Pagination**: History and top-trades APIs use efficient pagination
- **Intelligence Layer**: Worker enriches trades with wallet profiling and market impact analysis
- **State Synchronization**: Frontend maintains real-time stream + historical pagination
- **Preference Filtering**: Client-side filtering allows dynamic user customization
- **Proxy Pattern**: Frontend accesses Polymarket data through Next.js API routes

### Configuration

- **Trade Thresholds** (`lib/config.ts`): GOD_WHALE ($100k), SUPER_WHALE ($50k), etc.
- **WebSocket URLs** (`lib/config.ts`): Polymarket CLOB endpoint
- **Cache Settings**: Market metadata cached 60 seconds, events not cached
- **Heartbeat Intervals**: Worker heartbeats every 30 seconds
- **Metadata Refresh**: Market mappings updated every 5 minutes

### Error Handling

- **WebSocket Resilience**: Automatic reconnection with exponential backoff
- **Database Errors**: Logged but don't crash trade processing
- **API Failures**: Graceful fallbacks with loading states
- **Network Timeouts**: Proxy routes handle Polymarket API failures
- **Data Validation**: Required fields checked before processing

### External Dependencies

- **Polymarket APIs**: WebSocket for real-time trades, REST for market metadata
- **Prisma Database**: PostgreSQL with wallet profiles and trade tables
- **Redis**: Used by worker for caching (configured but not heavily used in visible code)
- **Socket.io**: Real-time communication between worker and frontend
- **Intelligence Module** (`lib/intelligence.ts`): Wallet profiling and market analysis

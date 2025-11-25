## Analysis: Timestamp Handling in Market Stream System

### Overview

The system processes timestamps through multiple parallel paths with different handling logic. Raw WebSocket trades from Polymarket contain a `timestamp` field that gets processed differently across client-side anomaly detection, server-side enrichment, and database storage.

### Entry Points

- `lib/market-stream.ts:111` - `startFirehose()` function initiates client-side WebSocket connection
- `server/worker.ts:240` - `connectToPolymarket()` function initiates server-side WebSocket connection
- `hooks/use-signals.ts:37` - `useSignals()` hook receives Socket.io trades on frontend

### Core Implementation

#### 1. Raw WebSocket Data Reception (`server/worker.ts:283-299`)

- Receives raw Polymarket WebSocket messages at line 283
- Parses JSON data at line 285
- Processes `trade` and `last_trade_price` events at line 287-294
- Calls `processTrade()` for each valid trade at line 292

#### 2. Client-Side Timestamp Processing (`lib/market-stream.ts:160-257`)

- Receives WebSocket messages at line 160
- Parses JSON data at line 162
- Processes trades at line 166-253
- Creates anomaly object at line 221-238 with timestamp handling at line 228:

```typescript
timestamp: trade.timestamp ? new Date(trade.timestamp).getTime() : Date.now(),
```

- If `trade.timestamp` exists, converts it to Date object then gets milliseconds since epoch
- If no `trade.timestamp`, uses current timestamp in milliseconds via `Date.now()`
- Passes anomaly to `onAnomaly` callback at line 247

#### 3. Server-Side Timestamp Processing (`server/worker.ts:68-235`)

- `processTrade()` function receives raw Polymarket trade at line 68
- Creates enriched trade object at line 134-175 with timestamp at line 148:

```typescript
timestamp: new Date(trade.timestamp || Date.now()),
```

- Creates Date object directly from `trade.timestamp` (or current time if missing)
- Emits enriched trade via Socket.io at line 229

#### 4. Frontend Socket.io Reception (`hooks/use-signals.ts:78-81`)

- Receives enriched trades via Socket.io at line 78
- Adds to trades state at line 80 with type `EnrichedTrade` containing `timestamp: Date | string`

#### 5. Frontend Store Conversion (`lib/store.ts:220-240`)

- Converts Socket.io enriched trades to anomaly format at line 227:

```typescript
timestamp: new Date(enrichedTrade.trade.timestamp).getTime(),
```

- Converts the timestamp back to milliseconds since epoch

### Data Flow

**Path 1 (Client-side market-stream → Database):**
1. Raw WebSocket trade arrives at `market-stream.ts:160`
2. Timestamp converted to milliseconds at `market-stream.ts:228`
3. Anomaly created and passed to `onAnomaly` callback
4. `saveTradeToDatabase()` called at `market-stream.ts:241`
5. API call made to `/api/save-trade` at `market-stream.ts:73`
6. Database save occurs at `app/api/save-trade/route.ts:62-80` with `timestamp: new Date(tradeData.timestamp)` at line 69

**Path 2 (Server-side worker → Database → Frontend):**
1. Raw WebSocket trade arrives at `server/worker.ts:283`
2. `processTrade()` called at `server/worker.ts:292`
3. Enriched trade created with `timestamp: new Date(trade.timestamp || Date.now())` at line 148
4. Trade saved to database at `server/worker.ts:205-223` with `timestamp: new Date()` at line 212
5. Enriched trade emitted via Socket.io at `server/worker.ts:229`
6. Frontend receives via `hooks/use-signals.ts:78`
7. Converted to anomaly format at `lib/store.ts:227` with `new Date(enrichedTrade.trade.timestamp).getTime()`

### Key Patterns

- **Dual Processing Paths**: Both client-side (`market-stream.ts`) and server-side (`server/worker.ts`) process the same raw WebSocket data independently
- **Timestamp Format Conversion**: Client-side converts timestamps to milliseconds, server-side keeps as Date objects
- **Database Storage**: Both paths ultimately store Date objects in database via Prisma
- **Frontend Display**: Timestamps displayed using `new Date(timestamp)` in `components/feed/anomaly-card.tsx:456`

### Configuration

- Polymarket WebSocket URL configured at `lib/config.ts` (referenced as `CONFIG.URLS.WS_CLOB`)
- No explicit timestamp timezone configuration found
- Database schema defines `timestamp` as `DateTime` in `prisma/schema.prisma:35`

### Error Handling

- Client-side falls back to `Date.now()` if no timestamp at `lib/market-stream.ts:228`
- Server-side falls back to `Date.now()` if no timestamp at `server/worker.ts:148`
- Database operations wrapped in try-catch blocks in both `app/api/save-trade/route.ts:83-87` and `server/worker.ts:224-226`

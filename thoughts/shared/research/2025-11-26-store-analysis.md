## Analysis: Store Implementation (lib/store.ts)

### Overview

The store implementation provides two Zustand-based state management systems: a preferences store for user filtering settings and a market store for real-time trading anomaly data. The preferences store manages user filter preferences with localStorage persistence, while the market store handles WebSocket streaming of trade data, historical data loading, and top trades pagination.

### Entry Points

- `lib/store.ts:57` - `usePreferencesStore` export for user preference management
- `lib/store.ts:131` - `useMarketStore` export for market data and anomalies
- `lib/store.ts:6` - `passesPreferences()` helper function for anomaly filtering

### Core Implementation

#### 1. Preferences Management (`lib/store.ts:49-90`)

- **PreferencesStore Interface** (`lib/store.ts:49-55`): Defines store structure with preferences object, load state, and CRUD methods
- **DEFAULT_PREFERENCES** (`lib/store.ts:39-47`): Default settings with boolean toggles for anomaly types and numeric threshold
- **setPreferences()** (`lib/store.ts:60-68`): Updates preferences and auto-saves to localStorage after initial load
- **loadPreferences()** (`lib/store.ts:69-84`): Loads from localStorage with SSR safety, falls back to defaults on error
- **savePreferences()** (`lib/store.ts:85-89`): Persists current preferences to localStorage with SSR safety

#### 2. Anomaly Filtering Logic (`lib/store.ts:6-27`)

- **passesPreferences()** (`lib/store.ts:6-27`): Filters anomalies based on user preferences
- Checks minimum value threshold against `preferences.minValueThreshold` (`lib/store.ts:10`)
- Switches on anomaly type to check corresponding boolean preference (`lib/store.ts:13-26`)
- Returns true for unknown types (`lib/store.ts:24-25`)

#### 3. Market Data Management (`lib/store.ts:106-305`)

- **MarketStore Interface** (`lib/store.ts:106-129`): Defines store with anomalies array, pagination state, and streaming controls
- **addAnomaly()** (`lib/store.ts:146-151`): Prepends new anomalies, limits to 2000 items, updates volume and ticker
- **loadHistory()** (`lib/store.ts:152-190`): Fetches historical data from `/api/history` endpoint with pagination
- **loadMoreHistory()** (`lib/store.ts:191-196`): Loads additional historical data using cursor-based pagination

#### 4. Real-time Streaming (`lib/store.ts:197-255`)

- **startStream()** (`lib/store.ts:197-255`): Initializes Socket.io connection to worker server
- Connects to `process.env.NEXT_PUBLIC_SOCKET_URL` or `http://localhost:3001` (`lib/store.ts:202-207`)
- Loads initial history data before starting stream (`lib/store.ts:199`)
- **Trade Event Handler** (`lib/store.ts:217-248`): Converts enriched trade format to anomaly structure
- Maps analysis tags to anomaly types (`lib/store.ts:221-224`)
- Creates anomaly object with wallet context (`lib/store.ts:219-239`)
- Applies preference filtering before adding (`lib/store.ts:244-247`)

#### 5. Top Trades Functionality (`lib/store.ts:257-305`)

- **fetchTopTrades()** (`lib/store.ts:258-294`): Loads top trades from `/api/top-trades` with period and cursor parameters
- **loadMoreTopTrades()** (`lib/store.ts:295-300`): Loads additional top trades using cursor
- **setSelectedPeriod()** (`lib/store.ts:301-304`): Updates period and triggers fresh fetch

### Data Flow

#### Preference Management Flow:
1. User preferences loaded from localStorage via `loadPreferences()` (`lib/store.ts:69`)
2. Preferences merged with defaults (`lib/store.ts:76`)
3. Changes trigger `setPreferences()` which updates state (`lib/store.ts:60-63`)
4. Auto-save to localStorage if loaded (`lib/store.ts:65-67`)

#### Market Data Flow:
1. **Historical Loading**: `loadHistory()` fetches from `/api/history` (`lib/store.ts:160-164`)
2. Data appended or replaced based on cursor presence (`lib/store.ts:178`)
3. **Real-time Streaming**: Socket connects and listens for 'trade' events (`lib/store.ts:217`)
4. Enriched trade converted to anomaly format (`lib/store.ts:219-239`)
5. Preference filtering applied via `passesPreferences()` (`lib/store.ts:244-247`)
6. Filtered anomalies added via `addAnomaly()` (`lib/store.ts:246`)

#### Top Trades Flow:
1. Period selection triggers `setSelectedPeriod()` (`lib/store.ts:302`)
2. `fetchTopTrades()` called with period parameter (`lib/store.ts:303`)
3. API call to `/api/top-trades` with period and limit (`lib/store.ts:268-273`)
4. Data appended or replaced based on cursor (`lib/store.ts:280`)

### Key Patterns

- **Zustand Store Pattern**: Two separate stores with typed interfaces and functional updates
- **LocalStorage Persistence**: Preferences automatically saved/loaded with error handling
- **Cursor-based Pagination**: Both history and top trades use cursor tokens for infinite scrolling
- **WebSocket Streaming**: Socket.io client for real-time trade updates with reconnection logic
- **Preference-based Filtering**: Centralized filtering logic applied to both historical and real-time data
- **Memory Management**: Anomalies limited to 2000 items with slice operation (`lib/store.ts:148`)

### Configuration

- **Socket URL**: Configurable via `process.env.NEXT_PUBLIC_SOCKET_URL` with fallback to `http://localhost:3001` (`lib/store.ts:202`)
- **API Limits**: Hardcoded limit of 100 items per history/top-trades request (`lib/store.ts:164`, `lib/store.ts:270`)
- **Memory Limits**: Anomalies capped at 2000 items (`lib/store.ts:148`)
- **Ticker Limit**: Ticker items limited to 20 entries (`lib/store.ts:150`)

### Error Handling

- **Preferences Loading**: Falls back to defaults on JSON parse errors (`lib/store.ts:77-79`)
- **SSR Safety**: Window checks prevent localStorage access during server-side rendering (`lib/store.ts:70`, `lib/store.ts:86`)
- **API Failures**: Loading states reset on failed history/top-trades fetches (`lib/store.ts:184`, `lib/store.ts:288`)
- **Socket Errors**: Logged to console with error event handler (`lib/store.ts:250-252`)
- **Graceful Degradation**: Stream continues on preference loading failures, anomalies added without filtering

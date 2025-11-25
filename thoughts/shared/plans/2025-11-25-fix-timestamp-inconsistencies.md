# Fix Frontend Timestamp Display Implementation Plan

## Overview

The system has timestamp inconsistencies where live WebSocket streaming shows incorrect dates (February when it should be November), while page reloads show correct timestamps from the database. The server worker has correct timestamp logic, but the frontend is not properly following the server's timestamp handling for live streaming.

## Current State Analysis

### Active Processing Path
- **Server-side worker**: Processes Polymarket WebSocket trades and emits via Socket.io
- **Data flow**: Polymarket WebSocket → Server Worker → Socket.io (server's timestamp logic) → Frontend Store → Display

### Timestamp Issues Identified
1. **Server timestamp logic correct**: `server/worker.ts:148` uses `timestamp: new Date(trade.timestamp || Date.now())`
2. **Frontend conversion issue**: `lib/store.ts:227` converts Socket.io timestamp but creates wrong dates during live streaming
3. **Database has correct timestamps**: Page reloads show correct dates from DB
4. **Live streaming shows wrong dates**: February dates instead of November

### Key Findings
- Server uses `new Date(trade.timestamp || Date.now())` for Socket.io emission
- Frontend converts this to milliseconds: `new Date(enrichedTrade.trade.timestamp).getTime()`
- Live streaming shows incorrect dates, suggesting timestamp format/interpretation issue
- Database timestamps appear correct on page reload

## Desired End State

- Frontend live streaming displays correct timestamps matching server's logic
- Consistent timestamp display between live streaming and database-loaded data
- Frontend properly interprets Socket.io timestamp emissions
- No February/wrong date displays in live streaming

### Key Verification Points
- Live WebSocket trades show correct current dates (November 2025)
- Timestamp display matches between live streaming and page reload
- Frontend correctly interprets server's Date object emissions

## What We're NOT Doing

- Changing server timestamp logic (user confirmed it's correct)
- Modifying database storage logic
- Changing Socket.io emission format
- Altering the Anomaly interface timestamp type

## Implementation Approach

Fix the frontend timestamp conversion to properly handle the server's Date object emissions via Socket.io.

## Phase 1: Fix Frontend Timestamp Conversion

### Overview
Update the frontend store to properly convert the server's Date object timestamp from Socket.io to milliseconds for anomaly display.

### Changes Required

#### 1. Frontend Store Timestamp Conversion (`lib/store.ts`)

**File**: `lib/store.ts`

**Current Code** (line 227):
```typescript
timestamp: new Date(enrichedTrade.trade.timestamp).getTime(),
```

**New Code**:
```typescript
timestamp: new Date(enrichedTrade.trade.timestamp || Date.now()).getTime(),
```

### Success Criteria

#### Automated Verification
- [x] TypeScript compilation passes: `npm run build`
- [x] Linting passes: `npm run lint`
- [x] Frontend builds without errors: `npm run build`

#### Manual Verification
- [ ] Live WebSocket trades show correct current dates (not February)
- [ ] Timestamp display matches between live streaming and database data
- [ ] No regression in existing timestamp display logic

**Implementation Note**: This aligns the frontend conversion with the server's timestamp logic.

## Testing Strategy

### Unit Tests
- Verify timestamp conversion handles Date objects, ISO strings, and invalid inputs
- Test fallback to `Date.now()` when timestamp is missing
- Ensure no regression in anomaly creation

### Integration Tests
- Process WebSocket trades and verify frontend displays correct timestamps
- Confirm live streaming shows same dates as database records
- Test with various timestamp formats from server

### Manual Testing Steps
1. Start the application with live WebSocket streaming
2. Monitor trade timestamps during active market hours
3. Verify live streaming shows correct current dates (November 2025)
4. Compare timestamps between live streaming and page reload
5. Check that February dates no longer appear

## Performance Considerations

- No performance impact expected (single line change)
- Timestamp conversion is already happening
- No additional API calls or computations

## Migration Notes

- No data migration needed
- Existing database records remain unchanged
- Fix applies only to new live streaming data

## References

- Timestamp analysis: `thoughts/shared/research/2025-11-25-timestamp-analysis.md`
- Server worker implementation: `server/worker.ts`
- Frontend store implementation: `lib/store.ts`

## Testing Strategy

### Unit Tests
- Verify timestamp parsing handles various input formats (string, number, Date)
- Test fallback to `Date.now()` when timestamp is missing
- Ensure no regression in trade processing logic

### Integration Tests
- Process sample trades and verify database timestamps match input
- Confirm Socket.io emissions maintain correct timing
- Test with malformed timestamp data

### Manual Testing Steps
1. Start the server worker
2. Monitor database for new trades during active market hours
3. Compare database timestamps with known Polymarket trade times
4. Verify frontend display shows consistent timing
5. Check that no trades have future timestamps

## Performance Considerations

- No performance impact expected (single line change)
- Timestamp parsing is already happening for Socket.io emission
- Database write pattern unchanged

## Migration Notes

- Existing incorrect timestamps in database will remain as historical data
- New trades will have correct timestamps
- No data migration needed (timestamps are for reference only)

## References

- Timestamp analysis: `thoughts/shared/research/2025-11-25-timestamp-analysis.md`
- Server worker implementation: `server/worker.ts`
- Database schema: `prisma/schema.prisma`

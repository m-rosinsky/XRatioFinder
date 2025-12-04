# X Ratio Finder - Architecture

## Overview

The X Ratio Finder uses a **client-server architecture** with backend polling to efficiently scale and minimize X API calls.

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────┐
│                    X API (Twitter)                      │
└─────────────────────────────────────────────────────────┘
                           ▲
                           │ Poll every 5 min
                           │ (Single source)
                           ▼
┌─────────────────────────────────────────────────────────┐
│                   Backend Server                        │
│  ┌──────────────┐  ┌──────────────┐                    │
│  │   Poller     │──│  Data Store  │                    │
│  │ (5min cycle) │  │ (In-memory)  │                    │
│  └──────────────┘  └──────────────┘                    │
└─────────────────────────────────────────────────────────┘
                           │
                           │ REST API
                           ▼
            ┌──────────────────────────────────┐
            │        Multiple Clients          │
            │  ┌─────────┐  ┌─────────┐       │
            │  │ Client  │  │ Client  │  ...  │
            │  └─────────┘  └─────────┘       │
            └──────────────────────────────────┘
```

## Components

### 1. Backend Server (`src/index.tsx`)

**Responsibilities:**
- Start and manage the polling service
- Serve frontend static files
- Expose REST API endpoints

**API Endpoints:**
- `GET /api/ratios` - Get all cached ratios
- `POST /api/refresh` - Trigger manual refresh
- `GET /api/status` - Get server status and stats

### 2. Poller (`src/server/poller.ts`)

**Responsibilities:**
- Poll X API every 5 minutes
- Search for high-engagement replies (500+ likes)
- Calculate ratios and identify brutal ratios
- Store new ratios in the data store

**Features:**
- Configurable polling interval
- Manual polling trigger
- Status monitoring
- Error handling and logging

### 3. Data Store (`src/server/store.ts`)

**Responsibilities:**
- Store ratios in memory (Map-based)
- Automatic cleanup of old data (48hr TTL)
- Filter ratios by criteria
- Provide statistics

**Data Model:**
```typescript
interface StoredRatio {
  id: string;
  parent: { ... };    // Original post being ratioed
  reply: { ... };     // Reply that's ratioing
  ratio: number;      // Reply likes / parent likes
  isBrutalRatio: boolean; // ratio >= 10x
  isRatio: boolean;   // ratio >= 2x
  discoveredAt: number; // When we found it
}
```

### 4. Frontend (`src/App.tsx`)

**Responsibilities:**
- Fetch data from REST API
- Display and filter ratios client-side
- Manual refresh trigger

**Features:**
- Client-side sorting and filtering
- Manual refresh button
- Load data on demand

## Data Flow

### Initial Load
```
1. Client loads page
2. Client requests data via REST API
3. Backend sends cached ratios
4. Client displays ratios
```

### Polling Cycle
```
1. Every 5 minutes, poller queries X API
2. Poller finds new ratios
3. Poller stores in data store
4. Data remains available for client requests
```

### Manual Refresh
```
1. User clicks "Refresh" button
2. Client fetches latest data via GET /api/ratios
3. Client updates display with new data
```

## Scalability Benefits

### Before (Direct API Calls)
- ❌ Each client makes X API calls
- ❌ Rate limits hit quickly (50 req/24hr free tier)
- ❌ Duplicate data fetching
- ❌ No shared state between clients

### After (Backend Polling)
- ✅ Single polling source
- ✅ Efficient API usage (1 call per 5 min)
- ✅ All clients share same data
- ✅ Manual refresh for new data
- ✅ Scales to unlimited clients

## Performance

**API Calls:**
- Before: N clients × M requests = High usage
- After: 1 request per 5 minutes = 288 requests/day

**Client Load:**
- Lightweight: Simple REST API calls
- No API authentication needed on client
- Data loaded on demand

## Future Enhancements

1. **Persistent Storage**: Replace in-memory store with SQLite/PostgreSQL
2. **Advanced Filters**: More sophisticated ratio detection
3. **User Accounts**: Save preferences, notifications
4. **Analytics**: Track ratio trends over time
5. **Rate Limit Management**: Dynamic polling based on API quotas

## Running the Server

```bash
# Development
bun run dev

# Production
NODE_ENV=production bun start
```

The server will:
- Start polling X API every 5 minutes
- Serve the frontend on the configured port
- Log all polling activity and client connections

## Monitoring

Check server status:
```bash
curl http://localhost:3000/api/status
```

Returns:
```json
{
  "success": true,
  "poller": {
    "isPolling": false,
    "isRunning": true,
    "intervalMs": 300000
  },
  "store": {
    "total": 42,
    "ratios": 38,
    "brutalRatios": 12
  },
  "clients": 5,
  "timestamp": 1699488000000
}
```


## Analysis: Home Page Component (app/page.tsx)

### Overview

The Home page component is a client-side Next.js page that serves as the main application interface, displaying live market intelligence data with filtering, search, and pagination capabilities. It manages three distinct views (user preferences, live feed, and top whales) and implements infinite scrolling for historical data loading. The component integrates with Zustand stores for market data and user preferences, using Framer Motion for smooth page transitions.

### Entry Points

- `app/page.tsx:54` - export default function Home() - Main page component entry point
- `app/page.tsx:23` - passesPreferences() - Helper function for filtering anomalies based on user preferences
- `app/page.tsx:88` - intelligentSearch() - Helper function for fuzzy search matching

### Core Implementation

#### 1. State Management (`app/page.tsx:54-60`)

- Uses Zustand stores: `useMarketStore` for anomalies data and `usePreferencesStore` for user settings
- Local state includes `currentPage` (0, 1, 2 for different views), `searchQuery`, and `activeFilter`
- `currentPage` controls which content is displayed: 0=user preferences, 1=live feed, 2=top whales

#### 2. Infinite Scroll Logic (`app/page.tsx:61-73`)

- Implements IntersectionObserver API for automatic loading of historical data
- `lastElementRef` callback attaches observer to sentinel element at bottom of feed
- Triggers `loadMoreHistory()` when sentinel comes into view and `hasMoreHistory` is true
- Observer disconnects during loading states to prevent duplicate requests

#### 3. Navigation and Search Handlers (`app/page.tsx:75-105`)

- `handlePageChange()` updates currentPage and scrolls to top on tab switches
- `handleFilterSelect()` sets active filter and search query, resets to page 1
- `intelligentSearch()` performs fuzzy matching on event names and outcomes
- Search splits query into words and matches any word against event/outcome text

#### 4. Filtering Pipeline (`app/page.tsx:108-110`)

- Two-stage filtering: first by user preferences, then by search query
- `passesPreferences()` checks minimum value threshold, sports filter, and anomaly type visibility
- Sports filtering hides events containing specific keywords when sports are disabled
- Anomaly types (STANDARD, WHALE, MEGA_WHALE, SUPER_WHALE, GOD_WHALE) are individually toggleable

#### 5. Data Streaming Setup (`app/page.tsx:112-122`)

- `loadPreferences()` called on component mount to initialize user settings
- `startStream()` initiated with preferences getter function for dynamic preference updates
- Stream dependency only on `startStream` hook, not preferences, allowing runtime preference changes

#### 6. Dynamic Title Generation (`app/page.tsx:125-136`)

- `getCenterTitle()` returns JSX with animated spans based on currentPage
- Page 0: "USER PREFERENCES", Page 1: "LIVE MARKET INTELLIGENCE", Page 2: "TOP WHALES"
- Uses CSS classes for color animations and uppercase styling

### Data Flow

1. Component mounts, calls `loadPreferences()` and `startStream()`
2. User preferences loaded from store, stream begins fetching anomalies
3. Anomalies filtered through `passesPreferences()` then `intelligentSearch()`
4. Filtered anomalies rendered in `SlotReel` component for live feed (page 1)
5. IntersectionObserver monitors scroll position, loads more history when needed
6. Page changes trigger smooth transitions via Framer Motion
7. Search/filter changes reset pagination and update filtered results

### Key Patterns

- **Store-based State Management**: Uses Zustand stores for global state (market data, preferences)
- **Intersection Observer Pattern**: Custom hook pattern for infinite scroll implementation
- **Compound Component Pattern**: `DesktopLayout` accepts leftPanel, rightPanel, and centerTitle as props
- **Conditional Rendering Pattern**: Multiple views controlled by single `currentPage` state
- **Callback Ref Pattern**: `lastElementRef` for attaching observers to DOM elements

### Configuration

- Sports filtering keywords defined inline at `app/page.tsx:30-32`: 'vs.', 'spread:', 'win on 202', 'counter-strike'
- Minimum value threshold from `preferences.minValueThreshold` (from store)
- Anomaly type visibility flags: `showStandard`, `showWhale`, `showMegaWhale`, `showSuperWhale`, `showGodWhale`
- Page transition duration: 300ms (`app/page.tsx:175`)

### Error Handling

- IntersectionObserver checks `isLoading` state before attaching observer (`app/page.tsx:64`)
- Observer disconnects existing instance before creating new one (`app/page.tsx:65`)
- Empty state messages for no search results or waiting for data (`app/page.tsx:190-200`)
- Loading indicator shown during data fetching (`app/page.tsx:196-200`)
- Graceful fallback for invalid anomaly types returns true (`app/page.tsx:50`)

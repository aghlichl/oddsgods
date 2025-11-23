import Redis from 'ioredis';
import { createPublicClient, http } from 'viem';
import { polygon } from 'viem/chains';

// Initialize Redis with error handling
const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
  retryStrategy: (times) => {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
  maxRetriesPerRequest: 3,
  lazyConnect: true, // Don't connect immediately
});

redis.on('error', (err) => {
  console.warn('[Intelligence] Redis connection error:', err.message);
});

// Attempt to connect (will fail gracefully if Redis is not available)
redis.connect().catch(() => {
  console.warn('[Intelligence] Redis not available, caching disabled');
});

// Polygon RPC client for checking wallet freshness
export const publicClient = createPublicClient({
  chain: polygon,
  transport: http(process.env.POLYGON_RPC_URL || 'https://polygon-rpc.com'),
});


export interface TraderProfile {
  address: string;
  label: string | null;
  totalPnl: number;
  winRate: number;
  isFresh: boolean;
  isSmartMoney: boolean;
  isWhale: boolean;
  txCount: number;
  maxTradeValue: number;
  activityLevel: 'LOW' | 'MEDIUM' | 'HIGH' | null;
}

interface PolymarketPosition {
  cashPnl: number;
  percentPnl: number;
  realizedPnl: number;
  currentValue: number;
}

/**
 * Fetches trader profile from Polymarket Data API
 */
async function fetchTraderProfileFromAPI(address: string): Promise<Partial<TraderProfile>> {
  try {
    const url = `https://data-api.polymarket.com/positions?user=${address}`;
    const response = await fetch(url);

    if (!response.ok) {
      console.warn(`[Intelligence] Failed to fetch positions for ${address}: ${response.statusText}`);
      return { totalPnl: 0, winRate: 0, isWhale: false };
    }

    const positions: PolymarketPosition[] = await response.json();

    if (!positions || positions.length === 0) {
      return { totalPnl: 0, winRate: 0, isWhale: false };
    }

    // Aggregate stats
    const totalPnl = positions.reduce((acc, pos) => acc + (pos.cashPnl || 0), 0);
    const winningPositions = positions.filter(p => (p.percentPnl || 0) > 0);
    const winRate = positions.length > 0 ? winningPositions.length / positions.length : 0;

    // Check if they have any large positions
    const isWhale = positions.some(p => (p.currentValue || 0) > 10000);

    // Determine label
    let label: string | null = null;
    if (totalPnl > 50000 && winRate > 0.60) {
      label = 'Smart Whale';
    } else if (totalPnl > 50000) {
      label = 'Whale';
    } else if (winRate > 0.60 && totalPnl > 0) {
      label = 'Smart Money';
    } else if (totalPnl < -10000) {
      label = 'Degen';
    }

    return {
      totalPnl,
      winRate,
      isWhale,
      isSmartMoney: totalPnl > 50000 && winRate > 0.60,
      label,
    };
  } catch (error) {
    console.error(`[Intelligence] Error fetching profile for ${address}:`, error);
    return { totalPnl: 0, winRate: 0, isWhale: false };
  }
}

/**
 * Checks if a wallet is "fresh" (< 10 transactions)
 */
async function checkWalletFreshness(address: `0x${string}`): Promise<number> {
  try {
    const txCount = await publicClient.getTransactionCount({
      address,
    });
    return txCount;
  } catch (error) {
    console.error(`[Intelligence] Error checking freshness for ${address}:`, error);
    return 0;
  }
}

/**
 * Gets trader profile with caching
 * Checks Redis first, then fetches from API if needed
 */
export async function getTraderProfile(address: string): Promise<TraderProfile> {
  const cacheKey = `wallet:${address.toLowerCase()}`;
  const cacheTTL = 24 * 60 * 60; // 24 hours

  try {
    // Check Redis cache
    const cached = await redis.get(cacheKey);
    if (cached) {
      const profile = JSON.parse(cached) as TraderProfile;
      return profile;
    }
  } catch (error) {
    // Cache miss or Redis error - continue to API fetch
    // This is expected if Redis is not available
  }

  // Cache miss - fetch from API
  const [apiProfile, txCount] = await Promise.all([
    fetchTraderProfileFromAPI(address),
    checkWalletFreshness(address as `0x${string}`),
  ]);

  // Determine activity level
  let activityLevel: 'LOW' | 'MEDIUM' | 'HIGH' = 'LOW';
  if (txCount > 500) activityLevel = 'HIGH';
  else if (txCount > 50) activityLevel = 'MEDIUM';

  const profile: TraderProfile = {
    address: address.toLowerCase(),
    label: apiProfile.label || null,
    totalPnl: apiProfile.totalPnl || 0,
    winRate: apiProfile.winRate || 0,
    isFresh: txCount < 10,
    txCount,
    maxTradeValue: 0, // Will be updated by worker
    activityLevel,
    isSmartMoney: apiProfile.isSmartMoney || false,
    isWhale: apiProfile.isWhale || false,
  };

  // Cache in Redis
  try {
    await redis.setex(cacheKey, cacheTTL, JSON.stringify(profile));
  } catch (error) {
    // Silently fail if Redis is not available
  }

  return profile;
}

/**
 * Analyze market impact by checking if trade swept order book levels
 */
export async function analyzeMarketImpact(assetId: string, tradeSize: number, side: 'BUY' | 'SELL'): Promise<{
  isSweeper: boolean;
  liquidityAvailable: number;
  priceImpact: number;
}> {
  try {
    const url = `https://clob.polymarket.com/book?token_id=${assetId}`;
    const response = await fetch(url);

    if (!response.ok) {
      return { isSweeper: false, liquidityAvailable: 0, priceImpact: 0 };
    }

    const book = await response.json();
    const levels = side === 'BUY' ? book.asks : book.bids;

    if (!levels || !Array.isArray(levels)) {
      return { isSweeper: false, liquidityAvailable: 0, priceImpact: 0 };
    }

    let accumulatedLiquidity = 0;
    let levelsSwept = 0;
    let priceImpact = 0;
    const initialPrice = levels[0]?.price ? parseFloat(levels[0].price) : 0;

    for (const level of levels) {
      const levelSize = parseFloat(level.size || '0');
      const levelPrice = parseFloat(level.price || '0');

      accumulatedLiquidity += levelSize;
      levelsSwept++;

      if (accumulatedLiquidity >= tradeSize) {
        // Trade was absorbed within this liquidity
        priceImpact = initialPrice > 0 ? Math.abs((levelPrice - initialPrice) / initialPrice) * 100 : 0;
        break;
      }
    }

    // If trade size exceeds all available liquidity, it's definitely a sweeper
    const isSweeper = accumulatedLiquidity < tradeSize || levelsSwept > 3;

    return {
      isSweeper,
      liquidityAvailable: accumulatedLiquidity,
      priceImpact,
    };
  } catch (error) {
    console.error(`[Intelligence] Error analyzing market impact for ${assetId}:`, error);
    return { isSweeper: false, liquidityAvailable: 0, priceImpact: 0 };
  }
}

/**
 * Extracts wallet addresses from transaction logs
 * Looks for OrderFilled event signature: 0xd0a08e8c493f9c94f29311604c9de1b4e8c8d4c06bd0c789af57f2d65bfec0f6
 */
export async function getWalletsFromTx(txHash: string): Promise<{ maker: string | null; taker: string | null }> {
  try {
    const receipt = await publicClient.getTransactionReceipt({
      hash: txHash as `0x${string}`,
    });

    // Find the OrderFilled event
    // Signature: 0xd0a08e8c493f9c94f29311604c9de1b4e8c8d4c06bd0c789af57f2d65bfec0f6
    const orderFilledLog = receipt.logs.find(log =>
      log.topics[0] === '0xd0a08e8c493f9c94f29311604c9de1b4e8c8d4c06bd0c789af57f2d65bfec0f6'
    );

    if (orderFilledLog && orderFilledLog.topics.length >= 4) {
      // Based on observation:
      // Topic 1: ?
      // Topic 2: Address 1 (Maker or Taker)
      // Topic 3: Address 2 (Maker or Taker)

      // We'll return both and let the worker decide or use both
      // Usually the taker is the one who sent the tx, but in a relayer setup it might differ.
      // For now, we just return them.

      const address1 = orderFilledLog.topics[2] ? `0x${orderFilledLog.topics[2].slice(26)}` : null;
      const address2 = orderFilledLog.topics[3] ? `0x${orderFilledLog.topics[3].slice(26)}` : null;

      return {
        maker: address1,
        taker: address2
      };
    }

    return { maker: null, taker: null };
  } catch (error) {
    console.error(`[Intelligence] Error fetching tx ${txHash}:`, error);
    return { maker: null, taker: null };
  }
}



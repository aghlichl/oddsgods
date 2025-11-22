import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    // Calculate timestamp for 30 minutes ago
    const thirtyMinutesAgo = new Date(Date.now() - 1440 * 60 * 1000);

    // Fetch whale trades from last 30 minutes
    const trades = await prisma.trade.findMany({
      where: {
        tradeValue: {
          gt: 10000,
        },
        timestamp: {
          gte: thirtyMinutesAgo,
        },
      },
      orderBy: {
        timestamp: 'desc',
      },
      include: {
        walletProfile: true,
      },
    });

    // Transform to Anomaly interface format (matching market-stream.ts)
    const anomalies = trades.map(trade => {
      const value = trade.tradeValue;
      const price = trade.price;

      // Determine anomaly type based on trade value (matching market-stream.ts logic)
      let type: 'GOD_WHALE' | 'SUPER_WHALE' | 'MEGA_WHALE' | 'WHALE' | 'STANDARD' = 'STANDARD';
      if (value > 100000) type = 'GOD_WHALE';
      else if (value > 50000) type = 'SUPER_WHALE';
      else if (value > 15000) type = 'MEGA_WHALE';
      else if (value > 8000) type = 'WHALE';

      return {
        id: trade.id, // Use actual trade ID instead of random
        type,
        event: trade.question || 'Unknown Market',
        outcome: trade.outcome || 'Unknown',
        odds: Math.round(price * 100),
        value,
        timestamp: trade.timestamp.getTime(), // Convert to number
        side: trade.side, // Include the side from the trade
        wallet_context: {
          address: trade.walletProfile?.id || trade.walletAddress,
          label: trade.walletProfile?.label || 'Unknown',
          pnl_all_time: `$${trade.walletProfile?.totalPnl.toLocaleString()}`,
          win_rate: `${((trade.walletProfile?.winRate || 0) * 100).toFixed(0)}%`,
          is_fresh_wallet: trade.walletProfile?.isFresh || false,
        },
        trader_context: {
          tx_count: trade.walletProfile?.txCount || 0,
          max_trade_value: trade.walletProfile?.maxTradeValue || 0,
          activity_level: trade.walletProfile?.activityLevel || null,
        },
        analysis: {
          tags: [
            trade.isWhale && 'WHALE',
            trade.isSmartMoney && 'SMART_MONEY',
            trade.isFresh && 'FRESH_WALLET',
            trade.isSweeper && 'SWEEPER',
            // Reconstruct INSIDER tag logic since it's not stored directly on trade
            (trade.walletProfile?.activityLevel === 'LOW' && (trade.walletProfile?.winRate || 0) > 0.7 && (trade.walletProfile?.totalPnl || 0) > 10000) && 'INSIDER',
          ].filter(Boolean) as string[],
        },
      };
    });

    return NextResponse.json(anomalies);
  } catch (error) {
    console.error('[API] Error fetching history:', error);
    return NextResponse.json(
      { error: 'Failed to fetch history' },
      { status: 500 }
    );
  }
}


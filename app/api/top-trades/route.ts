import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

type Period = 'today' | 'weekly' | 'monthly' | 'yearly' | 'max';

function getDateFilter(period: Period): Date | null {
  const now = new Date();

  switch (period) {
    case 'today':
      // Start of today
      return new Date(now.getFullYear(), now.getMonth(), now.getDate());
    case 'weekly':
      // 7 days ago
      return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    case 'monthly':
      // 30 days ago
      return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    case 'yearly':
      // 365 days ago
      return new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
    case 'max':
      // No date filter (beginning of time)
      return null;
    default:
      return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000); // Default to weekly
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const period = (searchParams.get('period') as Period) || 'weekly';

    // Get date filter based on period
    const dateFilter = getDateFilter(period);

    // Build where clause
    const whereClause: {
      tradeValue: { gt: number };
      timestamp?: { gte: Date };
    } = {
      tradeValue: {
        gt: 1000, // Only show meaningful trades
      },
    };

    // Add date filter if not 'max'
    if (dateFilter) {
      whereClause.timestamp = {
        gte: dateFilter,
      };
    }

    // Fetch top 100 trades by trade value
    const trades = await prisma.trade.findMany({
      where: whereClause,
      orderBy: {
        tradeValue: 'desc',
      },
      take: 100,
      include: {
        walletProfile: true,
      },
    });

    // Transform to Anomaly interface format (matching market-stream.ts and history)
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
        id: trade.id,
        type,
        event: trade.question || 'Unknown Market',
        outcome: trade.outcome || 'Unknown',
        odds: Math.round(price * 100),
        value,
        timestamp: trade.timestamp.getTime(),
        side: trade.side,
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
            (trade.walletProfile?.activityLevel === 'LOW' && (trade.walletProfile?.winRate || 0) > 0.7 && (trade.walletProfile?.totalPnl || 0) > 10000) && 'INSIDER',
          ].filter(Boolean) as string[],
        },
      };
    });

    return NextResponse.json({
      period,
      count: anomalies.length,
      trades: anomalies,
    });
  } catch (error) {
    console.error('[API] Error fetching top trades:', error);
    return NextResponse.json(
      { error: 'Failed to fetch top trades' },
      { status: 500 }
    );
  }
}

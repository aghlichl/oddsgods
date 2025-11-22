import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    // Calculate timestamp for 30 minutes ago
    const thirtyMinutesAgo = new Date(Date.now() - 120 * 60 * 1000);

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


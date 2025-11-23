import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ wallet: string }> }
) {
    try {
        const { wallet } = await params;
        const walletAddress = wallet.toLowerCase();

        // Get active markets based on recent trades
        // This is a simplification, ideally we'd track open positions
        const recentTrades = await prisma.trade.findMany({
            where: { walletAddress },
            distinct: ['conditionId'],
            orderBy: { timestamp: 'desc' },
            take: 20,
            select: {
                conditionId: true,
                title: true,
                outcome: true,
                eventSlug: true,
                assetId: true,
                timestamp: true
            }
        });

        return NextResponse.json(recentTrades);
    } catch (error) {
        console.error('Error fetching trader markets:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

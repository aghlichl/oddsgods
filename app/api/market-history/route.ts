import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const question = searchParams.get('question');
    const outcome = searchParams.get('outcome');
    const walletAddress = searchParams.get('walletAddress');

    if (!question || !outcome) {
        return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    try {
        // 1. Fetch Price History (last 100 trades for this outcome)
        const priceHistory = await prisma.trade.findMany({
            where: {
                question: question,
                outcome: outcome,
            },
            orderBy: {
                timestamp: 'desc',
            },
            take: 100,
            select: {
                timestamp: true,
                price: true,
                tradeValue: true,
                side: true,
            },
        });

        // 2. Fetch Wallet History (last 20 trades for this wallet)
        let walletHistory: any[] = [];
        if (walletAddress) {
            walletHistory = await prisma.trade.findMany({
                where: {
                    walletAddress: walletAddress.toLowerCase(),
                },
                orderBy: {
                    timestamp: 'desc',
                },
                take: 20,
                select: {
                    timestamp: true,
                    question: true,
                    outcome: true,
                    side: true,
                    price: true,
                    tradeValue: true,
                    walletProfile: {
                        select: {
                            totalPnl: true,
                        }
                    }
                },
            });
        }

        // Reverse to chronological order for charts
        const sortedPriceHistory = priceHistory.reverse().map(t => ({
            ...t,
            timestamp: t.timestamp.getTime(),
            price: t.price * 100, // Convert to cents
        }));

        const sortedWalletHistory = walletHistory.reverse().map(t => ({
            ...t,
            timestamp: t.timestamp.getTime(),
            price: t.price * 100,
        }));

        return NextResponse.json({
            priceHistory: sortedPriceHistory,
            walletHistory: sortedWalletHistory,
        });

    } catch (error) {
        console.error('[API] Error fetching market history:', error);
        return NextResponse.json(
            { error: 'Failed to fetch market history' },
            { status: 500 }
        );
    }
}

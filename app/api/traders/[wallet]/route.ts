import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ wallet: string }> }
) {
    try {
        const { wallet } = await params;
        const walletAddress = wallet.toLowerCase();

        const trader = await prisma.trader.findUnique({
            where: { id: walletAddress },
            include: {
                trades: {
                    take: 50,
                    orderBy: { timestamp: 'desc' }
                }
            }
        });

        if (!trader) {
            // Try to fetch from Data API if not in DB? 
            // For now just return 404 or empty profile
            return NextResponse.json({ error: 'Trader not found' }, { status: 404 });
        }

        return NextResponse.json(trader);
    } catch (error) {
        console.error('Error fetching trader:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

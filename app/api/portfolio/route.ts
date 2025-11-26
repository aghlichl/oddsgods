import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { fetchPortfolio } from '@/lib/gamma';

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const address = searchParams.get('address');

    if (!address) {
        return NextResponse.json({ error: 'Address is required' }, { status: 400 });
    }

    const walletAddress = address.toLowerCase();

    try {
        // 1. Check for fresh snapshot in DB (last 5 mins)
        const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
        const existingSnapshot = await prisma.walletPortfolioSnapshot.findFirst({
            where: {
                walletAddress,
                timestamp: {
                    gt: fiveMinutesAgo,
                },
            },
            orderBy: {
                timestamp: 'desc',
            },
        });

        if (existingSnapshot) {
            // Transform database snapshot to GammaPortfolio format
            const totalPnlPercent = existingSnapshot.totalValue > 0
                ? (existingSnapshot.totalPnl / (existingSnapshot.totalValue - existingSnapshot.totalPnl)) * 100
                : 0;

            return NextResponse.json({
                address: existingSnapshot.walletAddress,
                totalValue: existingSnapshot.totalValue,
                totalPnl: existingSnapshot.totalPnl,
                totalPnlPercent,
                positions: existingSnapshot.positions
            });
        }

        // 2. If no fresh snapshot, fetch from Gamma
        const portfolio = await fetchPortfolio(walletAddress);

        if (!portfolio) {
            // If we have an old snapshot, return it as fallback?
            // Or just return 404 if we really can't get data.
            // Let's check for ANY snapshot
            const oldSnapshot = await prisma.walletPortfolioSnapshot.findFirst({
                where: { walletAddress },
                orderBy: { timestamp: 'desc' },
            });

            if (oldSnapshot) {
                // Transform database snapshot to GammaPortfolio format
                const totalPnlPercent = oldSnapshot.totalValue > 0
                    ? (oldSnapshot.totalPnl / (oldSnapshot.totalValue - oldSnapshot.totalPnl)) * 100
                    : 0;

                return NextResponse.json({
                    address: oldSnapshot.walletAddress,
                    totalValue: oldSnapshot.totalValue,
                    totalPnl: oldSnapshot.totalPnl,
                    totalPnlPercent,
                    positions: oldSnapshot.positions,
                    isStale: true
                });
            }

            return NextResponse.json({ error: 'Portfolio not found' }, { status: 404 });
        }

        // 3. Save new snapshot
        // Ensure wallet profile exists first (foreign key constraint)
        // If it doesn't exist, we might need to create a dummy one or skip saving?
        // Usually we want to save it.

        // Upsert wallet profile to ensure it exists
        await prisma.walletProfile.upsert({
            where: { id: walletAddress },
            update: {},
            create: {
                id: walletAddress,
                totalPnl: portfolio.totalPnl,
                winRate: 0, // Unknown
            },
        });

        const newSnapshot = await prisma.walletPortfolioSnapshot.create({
            data: {
                walletAddress,
                totalValue: portfolio.totalValue,
                totalPnl: portfolio.totalPnl,
                positions: portfolio.positions as any,
                timestamp: new Date(),
            },
        });

        // Transform database snapshot to GammaPortfolio format
        const totalPnlPercent = newSnapshot.totalValue > 0
            ? (newSnapshot.totalPnl / (newSnapshot.totalValue - newSnapshot.totalPnl)) * 100
            : 0;

        return NextResponse.json({
            address: newSnapshot.walletAddress,
            totalValue: newSnapshot.totalValue,
            totalPnl: newSnapshot.totalPnl,
            totalPnlPercent,
            positions: newSnapshot.positions
        });

    } catch (error) {
        console.error('[API] Error fetching portfolio:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

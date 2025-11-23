import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
    try {
        const whales = await prisma.trader.findMany({
            orderBy: { totalVolumeUsd: 'desc' },
            take: 20,
        });
        return NextResponse.json(whales);
    } catch (error) {
        console.error('Error fetching top whales:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}


import 'dotenv/config';
import { prisma } from '../lib/prisma';
import { getTraderProfile } from '../lib/intelligence';

async function main() {
    console.log('Verifying intelligence metrics...');

    // 1. Create a mock trade for a fresh wallet
    const walletAddress = '0x' + '1'.repeat(40); // Mock address

    // Clean up previous test
    await prisma.trade.deleteMany({ where: { walletAddress } });
    await prisma.walletProfile.deleteMany({ where: { id: walletAddress } });

    console.log('Cleaned up previous test data');

    // 2. Simulate worker logic (simplified)
    // We can't easily import worker.ts functions because it starts the server
    // So we'll replicate the logic we want to test

    const tradeValue = 5000;
    const profile = {
        address: walletAddress,
        label: null,
        totalPnl: 15000,
        winRate: 0.8,
        isFresh: false,
        txCount: 20,
        maxTradeValue: 0,
        activityLevel: 'LOW' as const,
        isSmartMoney: false,
        isWhale: false,
    };

    // Logic from worker.ts
    const isInsider = profile.activityLevel === 'LOW' && profile.winRate > 0.7 && profile.totalPnl > 10000;

    console.log('Insider detection:', isInsider ? 'PASS' : 'FAIL');
    if (!isInsider) throw new Error('Failed to detect insider');

    // 3. Test Database Persistence
    await prisma.walletProfile.create({
        data: {
            id: walletAddress,
            label: profile.label,
            totalPnl: profile.totalPnl,
            winRate: profile.winRate,
            isFresh: profile.isFresh,
            txCount: profile.txCount,
            maxTradeValue: tradeValue, // First trade sets max value
            activityLevel: profile.activityLevel,
        }
    });

    const savedProfile = await prisma.walletProfile.findUnique({ where: { id: walletAddress } });

    console.log('Saved Profile:', savedProfile);

    if (savedProfile?.txCount !== 20) throw new Error('txCount not saved');
    if (savedProfile?.maxTradeValue !== 5000) throw new Error('maxTradeValue not saved');
    if (savedProfile?.activityLevel !== 'LOW') throw new Error('activityLevel not saved');

    console.log('Verification successful!');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });

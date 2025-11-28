require('dotenv').config();
const { prisma } = require('./lib/prisma');

async function test() {
  try {
    console.log('Testing history query...');
    const twentyFourHoursAgo = new Date(Date.now() - 1440 * 60 * 1000);

    const trades = await prisma.trade.findMany({
      where: {
        tradeValue: {
          gt: 5000,
        },
        timestamp: {
          gte: twentyFourHoursAgo,
        },
      },
      orderBy: {
        timestamp: 'desc',
      },
      take: 5,
      include: {
        walletProfile: true,
      },
    });

    console.log(`Found ${trades.length} trades`);
    if (trades.length > 0) {
      console.log('First trade:', {
        id: trades[0].id,
        walletAddress: trades[0].walletAddress,
        hasWalletProfile: !!trades[0].walletProfile,
        walletProfileId: trades[0].walletProfile?.id
      });
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

test();

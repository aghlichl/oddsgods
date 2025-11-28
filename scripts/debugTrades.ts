// scripts/debugTrades.ts
import "dotenv/config";
import { prisma } from '../lib/prisma';

async function main() {
  console.log('DATABASE_URL seen by Prisma:', process.env.DATABASE_URL);

  // 1) Prisma model-based count
  const modelCount = await prisma.trade.count();
  console.log('Prisma trade.count():', modelCount);

  // 2) Raw SQL COUNT(*) against the actual table name
  const rows = await prisma.$queryRawUnsafe(
    'SELECT COUNT(*)::bigint AS count FROM "trades";'
  );
  console.log('Raw SQL COUNT(*) on "Trade":', rows[0]?.count?.toString());
}

main()
  .catch((e) => {
    console.error('DEBUG SCRIPT ERROR:', e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

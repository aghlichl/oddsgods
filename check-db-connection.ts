import 'dotenv/config';
import { prisma } from './lib/prisma';

async function main() {
    try {
        console.log('Connecting...');
        await prisma.$connect();
        console.log('Connected.');

        console.log('Querying...');
        const count = await prisma.trader.count();
        console.log('Trader count:', count);

        await prisma.$disconnect();
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

main();

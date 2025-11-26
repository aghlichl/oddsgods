import "dotenv/config";
import { prisma } from "../lib/prisma";

async function main() {
    console.log("Starting alert system test...");

    // Create a test user with settings
    const testEmail = "test-alert-user@example.com";
    const testWallet = "0x1234567890123456789012345678901234567890";

    // Clean up existing test user
    await prisma.userAlertSettings.deleteMany({
        where: { user: { email: testEmail } }
    });
    await prisma.user.deleteMany({
        where: { email: testEmail }
    });

    const user = await prisma.user.create({
        data: {
            id: "did:privy:test-alert-user",
            email: testEmail,
            walletAddress: testWallet,
            alertSettings: {
                create: {
                    discordWebhook: "https://discord.com/api/webhooks/1234567890/abcdefg", // Dummy webhook
                    alertTypes: ["WHALE_MOVEMENT"],
                    wallets: [], // All wallets
                    markets: [] // All markets
                }
            }
        }
    });

    console.log("Created test user:", user.id);

    // Test direct alert sending (simulating what happens in worker.ts)
    try {
        console.log("Testing direct whale alert...");

        // Simulate the direct alert sending logic from worker.ts
        const users = await prisma.user.findMany({
            where: {
                alertSettings: {
                    is: {
                        alertTypes: { has: "WHALE_MOVEMENT" }
                    }
                }
            },
            include: { alertSettings: true }
        });

        console.log(`Found ${users.length} recipients`);

        // Send to each user's Discord webhook
        await Promise.all(users.map(async (user) => {
            const webhookUrl = user.alertSettings?.discordWebhook;
            if (!webhookUrl) return;

            try {
                const payload = {
                    content: null,
                    embeds: [{
                        title: `🐋 TEST WHALE ALERT`,
                        description: `**0xWhale...** BUY $1000000 of **Test Outcome** in *Test Market* @ 5000¢`,
                        color: 0x00ff00,
                        timestamp: new Date().toISOString(),
                        fields: [
                            { name: "Market", value: "Test Market", inline: true },
                            { name: "Value", value: "$1000000", inline: true },
                            { name: "Price", value: "5000¢", inline: true }
                        ]
                    }]
                };

                const response = await fetch(webhookUrl, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload),
                });

                if (response.ok) {
                    console.log(`✅ Alert sent to ${user.email}`);
                } else {
                    console.log(`❌ Failed to send alert to ${user.email}: ${response.status}`);
                }
            } catch (error) {
                console.log(`❌ Error sending alert to ${user.email}: ${(error as Error).message}`);
            }
        }));

    } catch (error) {
        console.error("Test failed:", error);
    }

    // Cleanup
    await prisma.userAlertSettings.deleteMany({
        where: { user: { email: testEmail } }
    });
    await prisma.user.deleteMany({
        where: { email: testEmail }
    });

    console.log("Test complete!");
    process.exit(0);
}

main().catch(console.error);

import { prisma } from "../prisma";
import { AlertEvent, NotificationTransport, UserWithSettings } from "./types";
import { DiscordTransport } from "./transports/discord";

export class NotificationRouter {
    private transports: NotificationTransport[] = [];

    constructor() {
        // Register transports
        this.transports.push(new DiscordTransport());
        // Future: Add SMS, Telegram, etc.
    }

    async route(event: AlertEvent): Promise<void> {
        console.log(`[NotificationRouter] Routing event: ${event.type} - ${event.title}`);

        try {
            // Find users who should receive this alert
            const users = await this.findRecipients(event);

            console.log(`[NotificationRouter] Found ${users.length} recipients`);

            // Send to each user via appropriate transports
            await Promise.all(users.map(user => this.sendToUser(user, event)));
        } catch (error) {
            console.error("[NotificationRouter] Error routing alert:", error);
        }
    }

    private async findRecipients(event: AlertEvent): Promise<UserWithSettings[]> {
        // Only filter by alert type - users get all alerts for enabled types
        // No wallet or market subscription filtering needed

        return await prisma.user.findMany({
            where: {
                alertSettings: {
                    is: {
                        alertTypes: {
                            has: event.type
                        }
                    }
                }
            },
            include: {
                alertSettings: true
            }
        });
    }

    private async sendToUser(user: UserWithSettings, event: AlertEvent): Promise<void> {
        // Try all transports
        // In reality, we might check user preferences for WHICH transport to use for WHICH alert.
        // For now, we just try to send to all configured channels.

        const promises = this.transports.map(transport => transport.send(user, event));
        await Promise.all(promises);
    }
}

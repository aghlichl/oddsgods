import { EnrichedTrade, MarketMeta } from "../../lib/types";
import { resolveTeamFromMarket, getLogoPathForTeam, inferLeagueFromMarket } from "../teamResolver";

export interface AlertStyle {
    color: number;
    emoji: string;
    titlePrefix: string;
}

export const ALERT_STYLES = {
    GOD_WHALE: { color: 0xFFD700, emoji: "👑", titlePrefix: "GOD WHALE" }, // Gold
    SUPER_WHALE: { color: 0xFF4500, emoji: "🔥", titlePrefix: "SUPER WHALE" }, // Orange Red
    MEGA_WHALE: { color: 0x00FFFF, emoji: "⚡", titlePrefix: "MEGA WHALE" }, // Cyan
    WHALE: { color: 0x00FF00, emoji: "🐋", titlePrefix: "WHALE" }, // Green
    SMART_MONEY: { color: 0x9B59B6, emoji: "🧠", titlePrefix: "SMART MONEY" }, // Purple
    DEFAULT: { color: 0x3498db, emoji: "📊", titlePrefix: "TRADE" } // Blue
};


export interface DiscordEmbedField {
    name: string;
    value: string;
    inline?: boolean;
}

export interface DiscordEmbed {
    title: string;
    description: string;
    url?: string;
    color: number;
    timestamp: string;
    footer?: { text: string; icon_url?: string };
    thumbnail?: { url: string };
    image?: { url: string };
    author?: { name: string; icon_url?: string };
    fields: DiscordEmbedField[];
}

/**
 * Formats a trade into a Discord embed following the "Neo-Brutalist Minimal" style
 */
export function formatDiscordAlert(trade: EnrichedTrade): DiscordEmbed {
    // Determine style based on tags
    let style = ALERT_STYLES.DEFAULT;
    const tags = trade.analysis.tags || [];

    if (tags.includes("GOD_WHALE")) style = ALERT_STYLES.GOD_WHALE;
    else if (tags.includes("SUPER_WHALE")) style = ALERT_STYLES.SUPER_WHALE;
    else if (tags.includes("MEGA_WHALE")) style = ALERT_STYLES.MEGA_WHALE;
    else if (tags.includes("WHALE")) style = ALERT_STYLES.WHALE;
    else if (tags.includes("SMART_MONEY")) style = ALERT_STYLES.SMART_MONEY;

    // Override color based on side (Buy/Sell) if it's a standard whale alert
    // But keep special colors for God/Smart money if preferred. 
    // Plan says: BUY=Neon Green, SELL=Hot Pink. 
    // Let's use side colors for the strip, but maybe keep the header text indicating tier.
    // Actually, the plan says "Color: Tier-based color strip".
    // But also "Accents: BUY/YES: Neon Green, SELL/NO: Hot Pink".
    // Let's stick to the Tier color for the embed color strip to distinguish importance,
    // and use the emojis/text to indicate Buy/Sell.

    // However, for pure "Whale" alerts, maybe Buy/Sell colors are better?
    // Let's follow the plan's "Variant C" which shows a Green color strip.
    // Let's use the Tier color for now as it conveys "Importance".

    const isBuy = trade.trade.side.toUpperCase() === "BUY";
    const sideEmoji = isBuy ? "🟢" : "🔴";
    const sideText = isBuy ? "BUY" : "SELL";

    // Format Money
    const valueFormatted = `$${Math.round(trade.trade.tradeValue).toLocaleString()}`;
    const priceFormatted = `${Math.round(trade.trade.price * 100)}¢`;

    // Market Impact / Prob Delta (mocked for now or calculated if available)
    // In EnrichedTrade we have market_impact.slippage_induced
    const impact = trade.analysis.market_impact?.slippage_induced || "0%";

    // Wallet Info
    const walletLabel = trade.analysis.wallet_context.label ||
        `${trade.analysis.wallet_context.address?.slice(0, 6)}...${trade.analysis.wallet_context.address?.slice(-4)}`;
    const winRate = trade.analysis.wallet_context.win_rate;
    const pnl = trade.analysis.wallet_context.pnl_all_time;
    const isSmart = tags.includes("SMART_MONEY");

    // Construct Description (The "Ticker")
    // ` 🟢 BUY ` ` 💰 $50k ` ` 🏷️ 54¢ ` ` 📊 +2.5% `
    const ticker = `\` ${sideEmoji} ${sideText} \` \` 💰 ${valueFormatted} \` \` 🏷️ ${priceFormatted} \` \` 📊 Impact: ${impact} \``;

    // Construct Fields
    const fields: DiscordEmbedField[] = [
        {
            name: "INSIGHTS",
            value: [
                `**Wallet:** [${walletLabel}](https://polymarket.com/profile/${trade.analysis.wallet_context.address}) ${isSmart ? "🧠" : ""}`,
                `**Performance:** ${pnl.startsWith("-") ? "🔴" : "🟢"} ${pnl} PnL | ${winRate} WR`,
                `**Context:** ${trade.analysis.tags.filter(t => t !== "WHALE" && t !== "SMART_MONEY").join(", ") || "High Value Trade"}`
            ].join("\n"),
            inline: false
        }
    ];

    // Market URL (Polymarket)
    // We need the condition ID or slug. EnrichedTrade has conditionId.
    // URL format: https://polymarket.com/event/<slug>?tid=<conditionId>
    // Since we might not have slug easily, we can use a search or just the main page if needed, 
    // but ideally we construct a valid URL. 
    // For now, let's link to the market if we can. 
    // Actually, `market` object has `question`.
    const marketUrl = `https://polymarket.com/market/${trade.market.conditionId}`; // This is a guess, might need slug.
    // Better: https://polymarket.com/event?tid=... if we don't have slug.
    // Or just https://polymarket.com/

    return {
        title: trade.market.question,
        url: marketUrl,
        description: `> ${style.emoji} **${style.titlePrefix}** ${sideText.toLowerCase()} **${valueFormatted}** of **${trade.market.outcome}**\n\n${ticker}`,
        color: style.color,
        timestamp: trade.trade.timestamp.toISOString(),
        thumbnail: (() => {
            // Use the same team resolution logic as the frontend
            const team = resolveTeamFromMarket({
                marketTitle: trade.market.question,
                outcomeLabel: trade.market.outcome,
                question: trade.market.question,
            });

            const league = team?.league || inferLeagueFromMarket({ question: trade.market.question } as MarketMeta);
            const logoPath = getLogoPathForTeam(team, league);

            if (logoPath && logoPath !== '/logos/generic/default.svg') {
                // Convert relative path to full URL for Discord
                const baseUrl = process.env.FRONTEND_URL || 'https://oddsgods.com';
                const fullUrl = logoPath.startsWith('http') ? logoPath : `${baseUrl}${logoPath}`;
                return { url: fullUrl };
            }

            // Fall back to market image if no team logo found
            return trade.market.image ? { url: trade.market.image } : undefined;
        })(),
        footer: {
            text: "OddsGods Intelligence",
            icon_url: "https://oddsgods.com/logo.png" // Optional
        },
        fields: fields
    };
}

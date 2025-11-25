import { MarketMeta, AssetOutcome, PolymarketMarket, DataAPITrade, WalletEnrichmentResult } from './types';
import { CONFIG } from './config';

export function normalizeMarketResponse(data: any): PolymarketMarket[] {
    if (Array.isArray(data)) {
        return data;
    } else if (data && Array.isArray(data.data)) {
        return data.data;
    } else {
        console.error('Unexpected markets payload shape:', JSON.stringify(data, null, 2));
        return [];
    }
}

export async function fetchMarketsFromGamma(init?: RequestInit): Promise<PolymarketMarket[]> {
    const response = await fetch(CONFIG.URLS.GAMMA_API, {
        ...init,
        headers: {
            'Accept': 'application/json',
            'User-Agent': 'OddsGods/1.0',
            ...init?.headers
        }
    });

    if (!response.ok) {
        throw new Error(`Failed to fetch markets: ${response.statusText}`);
    }

    const data = await response.json();
    return normalizeMarketResponse(data);
}

export function parseMarketData(markets: PolymarketMarket[]): {
    marketsByCondition: Map<string, MarketMeta>;
    assetIdToOutcome: Map<string, AssetOutcome>;
    allAssetIds: string[];
} {
    const marketsByCondition = new Map<string, MarketMeta>();
    const assetIdToOutcome = new Map<string, AssetOutcome>();
    const allAssetIds: string[] = [];

    markets.forEach(market => {
        if (!market.conditionId || !market.clobTokenIds || !market.outcomes) return;

        let tokenIds: string[] = [];
        let outcomes: string[] = [];

        try {
            if (Array.isArray(market.clobTokenIds)) {
                tokenIds = market.clobTokenIds;
            } else if (typeof market.clobTokenIds === 'string') {
                tokenIds = JSON.parse(market.clobTokenIds);
            }

            if (Array.isArray(market.outcomes)) {
                outcomes = market.outcomes;
            } else if (typeof market.outcomes === 'string') {
                outcomes = JSON.parse(market.outcomes);
            }

            const eventTitle = market.events && market.events.length > 0 ? market.events[0].title : 'Unknown Event';

            // Extract image URL (prioritize twitterCardImage > image > icon)
            // Check market level first, then event level
            let imageUrl = market.twitterCardImage || market.image || market.icon;

            if (!imageUrl && market.events && market.events.length > 0) {
                const event = market.events[0];
                imageUrl = event.image || event.icon;
            }

            const meta: MarketMeta = {
                conditionId: market.conditionId,
                eventId: market.events && market.events.length > 0 ? market.events[0].id : '',
                eventTitle,
                question: market.question,
                marketType: market.marketType,
                outcomes,
                clobTokenIds: tokenIds,
                image: imageUrl
            };

            marketsByCondition.set(market.conditionId, meta);

            if (tokenIds && Array.isArray(tokenIds) && outcomes && Array.isArray(outcomes)) {
                tokenIds.forEach((assetId, index) => {
                    const outcomeLabel = outcomes[index] || 'Unknown';
                    assetIdToOutcome.set(assetId, {
                        outcomeLabel,
                        conditionId: market.conditionId
                    });
                    allAssetIds.push(assetId);
                });
            }
        } catch (error) {
            // console.warn(`Error parsing market ${market.conditionId}:`, error);
        }
    });

    return { marketsByCondition, assetIdToOutcome, allAssetIds };
}

/**
 * Query parameters for Data-API /trades endpoint
 */
export interface DataAPITradeQuery {
    asset_id?: string;
    maker?: string;
    after?: number;  // Unix timestamp in seconds
    before?: number; // Unix timestamp in seconds
    limit?: number;
}

/**
 * Fetches trades from Polymarket Data-API /trades endpoint
 * Rate limit: 75 requests per 10 seconds
 */
export async function fetchTradesFromDataAPI(params: DataAPITradeQuery): Promise<DataAPITrade[]> {
    try {
        const url = new URL(CONFIG.URLS.DATA_API_TRADES);
        
        if (params.asset_id) url.searchParams.set('asset_id', params.asset_id);
        if (params.maker) url.searchParams.set('maker', params.maker);
        if (params.after) url.searchParams.set('after', params.after.toString());
        if (params.before) url.searchParams.set('before', params.before.toString());
        if (params.limit) url.searchParams.set('limit', params.limit.toString());

        const response = await fetch(url.toString(), {
            headers: {
                'Accept': 'application/json',
                'User-Agent': 'OddsGods/1.0',
            }
        });

        if (!response.ok) {
            console.warn(`[DataAPI] Failed to fetch trades: ${response.status} ${response.statusText}`);
            return [];
        }

        const data = await response.json();
        return Array.isArray(data) ? data : [];
    } catch (error) {
        console.error('[DataAPI] Error fetching trades:', error);
        return [];
    }
}

/**
 * Input for trade enrichment - matches our Trade model fields
 */
export interface TradeForEnrichment {
    assetId: string;
    price: number;
    size: number;
    timestamp: Date;
    transactionHash?: string | null;
}

/**
 * Enriches a trade with wallet identity from Data-API
 * 
 * Matching strategy:
 * 1. If transactionHash exists, match directly by hash
 * 2. Otherwise, query by asset_id + time window + price/size tolerance
 */
export async function enrichTradeWithDataAPI(trade: TradeForEnrichment): Promise<WalletEnrichmentResult | null> {
    try {
        const timestampSec = Math.floor(trade.timestamp.getTime() / 1000);
        const timeWindow = Math.floor(CONFIG.ENRICHMENT.TIME_WINDOW_MS / 1000);

        // Query Data-API with time window around our trade
        const trades = await fetchTradesFromDataAPI({
            asset_id: trade.assetId,
            after: timestampSec - timeWindow,
            before: timestampSec + timeWindow,
            limit: 100, // Get a batch to search through
        });

        if (trades.length === 0) {
            return null;
        }

        // Strategy 1: Direct match by transaction hash (most reliable)
        if (trade.transactionHash) {
            const exactMatch = trades.find(t => 
                t.transaction_hash?.toLowerCase() === trade.transactionHash?.toLowerCase()
            );
            
            if (exactMatch) {
                return {
                    walletAddress: exactMatch.owner || exactMatch.maker_address,
                    maker: exactMatch.maker_address,
                    taker: exactMatch.owner,
                    source: 'data-api',
                };
            }
        }

        // Strategy 2: Match by price/size/timestamp proximity
        const priceTolerance = CONFIG.ENRICHMENT.PRICE_TOLERANCE;
        const sizeTolerance = CONFIG.ENRICHMENT.SIZE_TOLERANCE;

        const matchingTrades = trades.filter(apiTrade => {
            const apiPrice = parseFloat(apiTrade.price);
            const apiSize = parseFloat(apiTrade.size);
            const apiTimestamp = new Date(apiTrade.match_time).getTime();

            // Check price within tolerance
            const priceMatch = Math.abs(apiPrice - trade.price) / trade.price <= priceTolerance;
            
            // Check size within tolerance  
            const sizeMatch = Math.abs(apiSize - trade.size) / trade.size <= sizeTolerance;
            
            // Check timestamp within window
            const timestampMatch = Math.abs(apiTimestamp - trade.timestamp.getTime()) <= CONFIG.ENRICHMENT.TIME_WINDOW_MS;

            return priceMatch && sizeMatch && timestampMatch;
        });

        if (matchingTrades.length === 0) {
            return null;
        }

        // If multiple matches, pick the one closest in timestamp
        const bestMatch = matchingTrades.reduce((best, current) => {
            const bestTimeDiff = Math.abs(new Date(best.match_time).getTime() - trade.timestamp.getTime());
            const currentTimeDiff = Math.abs(new Date(current.match_time).getTime() - trade.timestamp.getTime());
            return currentTimeDiff < bestTimeDiff ? current : best;
        });

        return {
            walletAddress: bestMatch.owner || bestMatch.maker_address,
            maker: bestMatch.maker_address,
            taker: bestMatch.owner,
            source: 'data-api',
        };
    } catch (error) {
        console.error('[DataAPI] Error enriching trade:', error);
        return null;
    }
}

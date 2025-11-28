-- Check for empty wallet addresses
SELECT 'Empty wallet addresses' as check_type, COUNT(*) as count FROM trades WHERE "walletAddress" = '';

-- Total wallet profiles
SELECT 'Total wallet profiles' as check_type, COUNT(*) as count FROM wallet_profiles;

-- Orphaned references (trades with walletAddress that doesn't exist in wallet_profiles)
SELECT 'Orphaned wallet references' as check_type, COUNT(*) as count
FROM trades t
LEFT JOIN wallet_profiles wp ON t."walletAddress" = wp.id
WHERE wp.id IS NULL AND t."walletAddress" != '';

-- Recent trades with wallet info
SELECT 'Recent trades (last 24h)' as check_type, COUNT(*) as count
FROM trades
WHERE timestamp >= NOW() - INTERVAL '24 hours' AND "tradeValue" > 5000;

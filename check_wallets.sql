SELECT "walletAddress", COUNT(*) as count
FROM trades
GROUP BY "walletAddress"
ORDER BY count DESC
LIMIT 10;

import { NextResponse } from 'next/server';

export async function GET() {
    try {
        // Fetch markets from Gamma API
        // Limit to active and open markets, ordered by volume to get relevant ones
        const response = await fetch(
            'https://gamma-api.polymarket.com/markets?limit=500&active=true&closed=false&order=volume24hr&ascending=false',
            {
                headers: {
                    'Accept': 'application/json',
                    'User-Agent': 'OddsGods/1.0'
                },
                next: { revalidate: 60 } // Cache for 60 seconds
            }
        );

        if (!response.ok) {
            return NextResponse.json(
                { error: 'Failed to fetch markets from Polymarket' },
                { status: response.status }
            );
        }

        const data = await response.json();
        return NextResponse.json(data);
    } catch (error) {
        console.error('Proxy error:', error);
        return NextResponse.json(
            { error: 'Internal Server Error' },
            { status: 500 }
        );
    }
}


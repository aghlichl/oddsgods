import { NextResponse } from 'next/server';

export async function GET() {
    try {
        const response = await fetch(
            'https://gamma-api.polymarket.com/events?limit=500&active=true&closed=false&order=volume24hr&ascending=false',
            {
                headers: {
                    'Accept': 'application/json',
                    'User-Agent': 'OddsGods/1.0'
                },
                next: { revalidate: 0 } // Disable cache for live data
            }
        );

        if (!response.ok) {
            return NextResponse.json(
                { error: 'Failed to fetch from Polymarket' },
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

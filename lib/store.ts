import { create } from 'zustand';
import { Anomaly, startFirehose } from './market-stream';

interface MarketStore {
    anomalies: Anomaly[];
    volume: number;
    tickerItems: string[];
    addAnomaly: (anomaly: Anomaly) => void;
    startStream: () => () => void;
}

export const useMarketStore = create<MarketStore>((set, get) => ({
    anomalies: [],
    volume: 0,
    tickerItems: [],
    addAnomaly: (anomaly) => set((state) => ({
        anomalies: [anomaly, ...state.anomalies].slice(0, 50),
        volume: state.volume + anomaly.value,
        tickerItems: [`${anomaly.event} ${anomaly.type === 'MEGA_WHALE' ? 'WHALE' : 'TRADE'} $${(anomaly.value / 1000).toFixed(1)}k`, ...state.tickerItems].slice(0, 20)
    })),
    startStream: () => {
        // Start the WebSocket Firehose
        const cleanup = startFirehose((anomaly) => {
            get().addAnomaly(anomaly);
        });
        return cleanup;
    }
}));

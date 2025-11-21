"use client";

import { useEffect, useState } from "react";
import { useMarketStore } from "@/lib/store";
import { Ticker } from "@/components/feed/ticker";
import { SlotReel } from "@/components/feed/slot-reel";
import { AnomalyCard, convertAnomalyToCardProps } from "@/components/feed/anomaly-card";
import { motion } from "framer-motion";
import { RefreshCw } from "lucide-react";

export default function Home() {
  const { anomalies, startStream } = useMarketStore();
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    const cleanup = startStream();
    return cleanup;
  }, [startStream]);

  const handleRefresh = () => {
    setRefreshing(true);
    // Simulate haptic/refresh
    setTimeout(() => setRefreshing(false), 1000);
  };

  return (
    <main className="min-h-screen bg-background flex flex-col overflow-hidden">
      <Ticker />

      <div className="flex-1 overflow-y-auto p-4 pb-20 scrollbar-hide">
        <motion.div
          className="max-w-md mx-auto w-full"
          animate={refreshing ? { x: [-2, 2, -2, 2, 0] } : {}}
          transition={{ duration: 0.3 }}
        >

          {/* Pull to refresh trigger area (simplified) */}
          <div
            className="flex justify-center py-4 cursor-pointer active:scale-95 transition-transform"
            onClick={handleRefresh}
          >
            <motion.div
              animate={refreshing ? { rotate: 360 } : {}}
              transition={{ duration: 1, repeat: refreshing ? Infinity : 0 }}
              className="text-zinc-600"
            >
              <RefreshCw size={24} />
            </motion.div>
          </div>

          <SlotReel>
            {anomalies.map((anomaly) => {
              const cardProps = convertAnomalyToCardProps(anomaly);
              return (
                <div key={anomaly.id} className="flex items-stretch gap-3 w-full">
                  <div className="flex-1 min-w-0">
                    <AnomalyCard {...cardProps} />
                  </div>
                  <div className="flex-shrink-0 flex items-center justify-center w-[56px] text-xs text-zinc-500 font-mono">
                    {new Date(anomaly.timestamp).toLocaleTimeString([], { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  </div>
                </div>
              );
            })}
          </SlotReel>

          {anomalies.length === 0 && (
            <div className="text-center text-zinc-600 mt-20 font-mono">
              WAITING FOR SIGNAL...
            </div>
          )}
        </motion.div>
      </div>

      {/* Bottom Navigation / Status Bar */}
      <div className="h-16 border-t border-zinc-800 bg-zinc-950/90 backdrop-blur flex items-center justify-around px-4 z-50">
        <div className="flex flex-col items-center text-primary">
          <div className="w-1 h-1 bg-primary rounded-full mb-1 animate-pulse" />
          <span className="text-[10px] font-mono tracking-widest">LIVE</span>
        </div>
        <div className="text-zinc-600 text-xs font-mono">ODDSGOD v1.0</div>
      </div>
    </main >
  );
}

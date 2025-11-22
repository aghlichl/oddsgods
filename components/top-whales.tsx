"use client";

import { useEffect } from "react";
import { useMarketStore } from "@/lib/store";
import { AnomalyCard } from "@/components/feed/anomaly-card";
import { cn } from "@/lib/utils";

type Period = 'today' | 'weekly' | 'monthly' | 'yearly' | 'max';

const PERIOD_LABELS: Record<Period, string> = {
  today: 'TODAY',
  weekly: 'WEEKLY',
  monthly: 'MONTHLY',
  yearly: 'YEARLY',
  max: 'ALL'
};

const PERIODS: Period[] = ['today', 'weekly', 'monthly', 'yearly', 'max'];

export function TopWhales() {
  const {
    topTrades,
    topTradesLoading,
    selectedPeriod,
    fetchTopTrades,
    setSelectedPeriod
  } = useMarketStore();

  // Load initial data on mount
  useEffect(() => {
    fetchTopTrades(selectedPeriod);
  }, [fetchTopTrades, selectedPeriod]);

  return (
    <div className="w-full">
      {/* Fixed Header and Controls */}
      <div className="space-y-6 pb-4">
        {/* Header */}
        <div className="text-center pl-14 pr-2">
          <h1 className="text-2xl font-mono font-bold text-zinc-300 mb-2">
            TOP WHALES
          </h1>
          <p className="text-sm text-zinc-500 font-mono">
            Largest trades by bet amount
          </p>
        </div>

        {/* Period Selector */}
        <div className="flex flex-wrap gap-2 justify-center pl-14 pr-2">
          {PERIODS.map((period) => (
            <button
              key={period}
              onClick={() => setSelectedPeriod(period)}
              disabled={topTradesLoading}
              className={cn(
                "px-2 py-1.5 border-2 font-mono text-xs font-bold uppercase transition-all duration-200 shrink-0",
                selectedPeriod === period
                  ? "border-[#b8a889] bg-[#b8a889]/10 text-[#e9e2d3] shadow-[3px_3px_0px_0px_rgba(184,168,137,0.7)]"
                  : "border-zinc-600 bg-zinc-800 text-zinc-400 hover:border-zinc-500 hover:text-zinc-300",
                topTradesLoading && "opacity-50 cursor-not-allowed"
              )}
            >
              {PERIOD_LABELS[period]}
            </button>
          ))}
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="max-h-[calc(100vh-280px)] overflow-y-auto scrollbar-hide">
        {topTradesLoading ? (
          <div className="text-center text-zinc-600 mt-20 font-mono">
            LOADING TOP TRADES...
          </div>
        ) : topTrades.length > 0 ? (
          <div className="space-y-4 pl-10 pr-4 py-2">
            {topTrades.map((anomaly, index) => (
              <div key={anomaly.id} className="relative">
                {/* Dragon Ball Z/Demon Slayer Aura - Only for God Whale */}
                {anomaly.type === 'GOD_WHALE' && (
                  <>
                    {/* Demonic Flame Rings - Around Card Border */}
                    <div className="absolute -inset-1 z-0 pointer-events-none">
                      {/* Outer Ring - Slow Pulsing */}
                      <div className="absolute inset-0 bg-[conic-gradient(from_0deg_at_50%_50%,transparent_0deg,rgba(251,191,36,0.8)_45deg,rgba(239,68,68,0.9)_90deg,rgba(251,191,36,0.7)_135deg,transparent_180deg,rgba(168,85,247,0.6)_225deg,rgba(239,68,68,0.8)_270deg,rgba(251,191,36,0.7)_315deg,transparent_360deg)] animate-[spin_8s_linear_infinite] opacity-70 blur-sm" />

                      {/* Inner Ring - Faster Rotation */}
                      <div className="absolute inset-1 bg-[conic-gradient(from_0deg_at_50%_50%,transparent_0deg,rgba(239,68,68,1.0)_30deg,rgba(251,191,36,1.0)_60deg,rgba(239,68,68,0.9)_90deg,transparent_120deg,rgba(251,191,36,0.8)_150deg,rgba(239,68,68,1.0)_180deg,rgba(251,191,36,0.9)_210deg,transparent_240deg,rgba(168,85,247,0.7)_270deg,rgba(239,68,68,0.8)_300deg,rgba(251,191,36,1.0)_330deg,transparent_360deg)] animate-spin-reverse opacity-60 blur-sm" />
                    </div>

                    {/* Energy Wisps - Floating Demonic Particles Around Border */}
                    <div className="absolute -inset-0.5 z-0 pointer-events-none">
                    {/* Top wisps */}
                    <div className="absolute -top-0.5 left-1/4 w-0.5 h-3 bg-linear-to-t from-transparent via-yellow-400 to-transparent animate-energy-wisp" style={{ animationDelay: '0s' }} />
                    <div className="absolute -top-0.5 right-1/3 w-0.5 h-2 bg-linear-to-t from-transparent via-red-400 to-transparent animate-energy-wisp" style={{ animationDelay: '1s' }} />

                    {/* Side wisps */}
                    <div className="absolute top-1/2 -left-0.5 w-2 h-0.5 bg-linear-to-r from-transparent via-orange-400 to-transparent animate-energy-wisp" style={{ animationDelay: '0.5s' }} />
                    <div className="absolute top-1/3 -right-0.5 w-1.5 h-0.5 bg-linear-to-l from-transparent via-yellow-300 to-transparent animate-energy-wisp" style={{ animationDelay: '1.5s' }} />

                    {/* Bottom wisps */}
                    <div className="absolute -bottom-0.5 left-1/3 w-0.5 h-2.5 bg-linear-to-t from-yellow-500 via-orange-400 to-transparent animate-energy-wisp" style={{ animationDelay: '2s' }} />
                    <div className="absolute -bottom-0.5 right-1/4 w-0.5 h-1.5 bg-linear-to-t from-red-500 via-yellow-400 to-transparent animate-energy-wisp" style={{ animationDelay: '0.8s' }} />
                    </div>
                  </>
                )}

                {/* Rank indicator */}
                <div className="absolute -left-8 top-4 z-10">
                  <div className={cn(
                    "w-6 h-6 rounded-full border-2 flex items-center justify-center text-xs font-mono font-bold",
                    index === 0 ? "border-yellow-500 bg-yellow-950/20 text-yellow-300" :
                      index === 1 ? "border-gray-400 bg-gray-950/20 text-gray-300" :
                        index === 2 ? "border-orange-600 bg-orange-950/20 text-orange-300" :
                          "border-zinc-600 bg-zinc-800 text-zinc-400"
                  )}>
                    {index + 1}
                  </div>
                </div>
                <AnomalyCard anomaly={anomaly} />
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center text-zinc-600 mt-20 font-mono">
            NO TRADES FOUND FOR {PERIOD_LABELS[selectedPeriod].toUpperCase()}
          </div>
        )}
      </div>
    </div>
  );
}

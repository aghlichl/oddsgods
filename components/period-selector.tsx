"use client";

import { useMarketStore } from "@/lib/store";
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

export function PeriodSelector() {
  const {
    topTradesLoading,
    selectedPeriod,
    setSelectedPeriod
  } = useMarketStore();

  return (
    <div className="flex items-center gap-2">
      {PERIODS.map((period) => (
        <button
          key={period}
          onClick={() => setSelectedPeriod(period)}
          disabled={topTradesLoading}
          className={cn(
            "px-2 py-1.5 border-2 text-xs font-bold uppercase transition-all duration-200 shrink-0",
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
  );
}


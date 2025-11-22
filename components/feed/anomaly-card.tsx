import { Anomaly } from "@/lib/market-stream";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Gauge } from "./gauge";

interface AnomalyCardProps {
    anomaly: Anomaly;
}

export function convertAnomalyToCardProps(anomaly: Anomaly) {
    return {
        title: anomaly.event,
        amount: `$${Math.round(anomaly.value).toLocaleString()}`,
        bet: `${anomaly.outcome} | ${anomaly.odds}¢`,
        type: anomaly.type,
        multiplier: anomaly.multiplier,
        zScore: anomaly.zScore,
        isContra: anomaly.isContra
    };
}

export function AnomalyCard({ anomaly }: AnomalyCardProps) {
    const { event: title, value, outcome, odds, type, timestamp, side } = anomaly;
    const amount = `$${Math.round(value).toLocaleString()}`;
    const isGod = type === 'GOD_WHALE';
    const isSuper = type === 'SUPER_WHALE';
    const isMega = type === 'MEGA_WHALE';
    const isWhale = type === 'WHALE';

    return (
        <Card className={cn(
            "relative p-4 border-2 transition-all duration-300 group rounded-none",
            isGod ? "border-yellow-500 bg-zinc-950 shadow-[4px_4px_0px_0px_#fbbf24]" :
                isSuper ? "border-red-500 bg-zinc-950 shadow-[4px_4px_0px_0px_#ef4444]" :
                    isMega ? "border-purple-500 bg-zinc-950 shadow-[4px_4px_0px_0px_#a855f7]" :
                        isWhale ? "border-blue-500 bg-zinc-950 shadow-[4px_4px_0px_0px_#3b82f6]" :
                            "border-zinc-700 bg-zinc-950 shadow-[4px_4px_0px_0px_#27272a]"
        )}>
            {/* Timestamp overlay - appears on hover */}
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-black/80 z-10">
                <div className="text-sm font-mono text-zinc-200 font-bold bg-black border border-white px-2 py-1">
                    {new Date(timestamp).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit',
                        hour12: false
                    })}
                </div>
            </div>

            <div className="grid grid-cols-[1fr_auto] gap-4">
                {/* Top Left: Title */}
                <div className="flex items-start">
                    <h3 className="text-sm font-bold uppercase tracking-tight text-zinc-100 line-clamp-2" title={title}>
                        {title}
                    </h3>
                </div>

                {/* Top Right: Amount */}
                <div className="flex items-start justify-end">
                    <div className={cn(
                        "text-lg font-bold font-mono border-b",
                        isGod ? "text-yellow-300 border-yellow-300/60" :
                            isSuper ? "text-red-300 border-red-300/60" :
                                isMega ? "text-purple-300 border-purple-300/60" :
                                    isWhale ? "text-blue-300 border-blue-300/60" :
                                        "text-zinc-300 border-zinc-300/60"
                    )}>
                        {amount}
                    </div>
                </div>

                {/* Bottom Left: Outcome */}
                <div className="flex items-end">
                    <div className="flex flex-col justify-end">
                        <div className={cn(
                            "px-2 py-0.5 border-2 font-black text-sm uppercase bg-zinc-900",
                            side === 'SELL'
                                ? "border-[#ff3b3b] text-[#ff3b3b] shadow-[3px_3px_0px_0px_#ff3b3b]"
                                : "border-[#21ff99] text-[#21ff99] shadow-[3px_3px_0px_0px_#21ff99]"
                        )}>
                            {outcome}
                        </div>
                    </div>
                </div>

                {/* Bottom Right: Gauge */}
                <div className="flex items-end justify-end">
                    <Gauge value={odds} label={side} size={64} strokeWidth={2} />
                </div>
            </div>
        </Card>
    );
}


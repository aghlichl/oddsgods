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
        <div className="group relative h-full select-none hover:z-50">
            <Card className={cn(
                "relative z-10 h-full p-4 border-2 transition-all duration-300 ease-out rounded-none overflow-hidden",
                // Standard Tier (Default)
                !isGod && !isSuper && !isMega && !isWhale &&
                "border-zinc-700 bg-zinc-950 shadow-[4px_4px_0px_0px_#27272a] group-hover:shadow-[6px_6px_0px_0px_#27272a] group-hover:-translate-y-1",

                // Whale Tier - Subtle Blue
                isWhale && "border-zinc-700 bg-zinc-950 shadow-[4px_4px_0px_0px_#3b82f6] group-hover:shadow-[6px_6px_0px_0px_#3b82f6] group-hover:-translate-y-1",

                // Mega Whale - Pulsing Purple
                isMega && "border-zinc-700 bg-zinc-950 shadow-[4px_4px_0px_0px_#a855f7] group-hover:shadow-[6px_6px_0px_0px_#a855f7] group-hover:-translate-y-1",

                // Super Whale - Aggressive Red
                isSuper && "border-zinc-700 bg-zinc-950 shadow-[4px_4px_0px_0px_#ef4444] group-hover:shadow-[6px_6px_0px_0px_#ef4444] group-hover:-translate-y-1",

                // God Whale - Mythic Gold
                isGod && "border-zinc-700 bg-zinc-950 shadow-[4px_4px_0px_0px_#fbbf24] group-hover:shadow-[6px_6px_0px_0px_#fbbf24] group-hover:-translate-y-1"
            )}>
                {/* God Tier: Cosmic Limit Break (Anime Style) */}
                {isGod && (
                    <>
                        {/* Manga Speed Lines (Rapid Rotation) */}
                        <div className="absolute inset-[-150%] z-0 pointer-events-none bg-[conic-gradient(from_0deg_at_50%_50%,transparent_0deg,rgba(251,191,36,0.4)_10deg,transparent_20deg,rgba(251,191,36,0.1)_50deg,transparent_60deg,rgba(251,191,36,0.4)_90deg,transparent_100deg)] animate-super-spin mix-blend-plus-lighter opacity-70" />

                        {/* Core Energy Flash (Blinding Light) */}
                        <div className="absolute inset-0 z-0 pointer-events-none bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.8)_0%,rgba(251,191,36,0.5)_20%,transparent_60%)] animate-flash mix-blend-screen" />

                        {/* Expanding Shockwaves */}
                        <div className="absolute inset-0 z-0 pointer-events-none bg-[radial-gradient(circle_at_center,transparent_30%,rgba(251,191,36,0.6)_40%,transparent_50%)] animate-shockwave mix-blend-plus-lighter" />

                        {/* Rising Aura (Flame Effect) */}
                        <div className="absolute inset-0 z-0 pointer-events-none bg-[linear-gradient(0deg,rgba(251,191,36,0.2)_0%,transparent_100%)] animate-pulse" />

                        {/* Deep Cosmic Shadow Overlay */}
                        <div className="absolute inset-0 z-0 pointer-events-none bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.4)_100%)]" />
                    </>
                )}

                {/* Super Tier: Critical Overload */}
                {isSuper && (
                    <>
                        {/* Warning Throb (Siren) */}
                        <div className="absolute inset-0 z-0 pointer-events-none bg-red-500/10 animate-[pulse_0.5s_ease-in-out_infinite]" />

                        {/* Jagged Scanline */}
                        <div className="absolute inset-0 z-0 pointer-events-none bg-[linear-gradient(180deg,transparent_40%,rgba(239,68,68,0.8)_50%,transparent_60%)] bg-[length:100%_200%] animate-scanline mix-blend-plus-lighter opacity-80" />

                        {/* Heat Distortion Waves */}
                        <div className="absolute inset-0 z-0 pointer-events-none opacity-15">
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-red-500/10 to-transparent animate-heat-distortion" />
                            <div className="absolute inset-0 bg-gradient-to-l from-transparent via-red-600/8 to-transparent animate-heat-distortion" style={{ animationDelay: '0.5s' }} />
                            <div className="absolute inset-0 bg-gradient-to-t from-transparent via-red-400/12 to-transparent animate-heat-distortion" style={{ animationDelay: '1s' }} />
                        </div>

                        {/* RGB Glitch Cycling Border */}
                        <div className="absolute inset-0 z-0 pointer-events-none border-2 border-red-500/60 animate-rgb-glitch-cycle" />

                        {/* Glitch Border Overlay */}
                        <div className="absolute inset-0 z-0 pointer-events-none border-2 border-red-500/30 animate-glitch-border" />

                        {/* Digital Noise (Static) */}
                        <div className="absolute inset-0 z-0 pointer-events-none opacity-10 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] mix-blend-overlay" />
                    </>
                )}

                {/* Mega Tier: The Arcane Rune */}
                {isMega && (
                    <>
                        {/* Spinning Rune Circle */}
                        <div className="absolute inset-[-50%] z-0 pointer-events-none bg-[conic-gradient(from_0deg_at_50%_50%,transparent_0deg,rgba(168,85,247,0.1)_60deg,transparent_120deg)] animate-[spin_10s_linear_infinite]" />

                        {/* Mana Surge (Breathing Core) */}
                        <div className="absolute inset-0 z-0 pointer-events-none bg-[radial-gradient(circle_at_center,rgba(168,85,247,0.3)_0%,transparent_70%)] animate-heartbeat mix-blend-screen" />

                        {/* Arcane Nebula - Contained Swirling Motion */}
                        <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden rounded-none">
                            {/* Primary Nebula Swirl - Large central vortex */}
                            <div className="absolute inset-0 bg-[conic-gradient(from_0deg_at_50%_50%,transparent_0deg,rgba(168,85,247,0.1)_30deg,rgba(168,85,247,0.3)_60deg,rgba(168,85,247,0.1)_90deg,rgba(147,51,234,0.2)_120deg,rgba(147,51,234,0.4)_150deg,rgba(147,51,234,0.2)_180deg,transparent_210deg)] animate-[nebula-swirl_12s_linear_infinite] mix-blend-screen opacity-70" />

                            {/* Secondary Energy Streams - Flowing tendrils */}
                            <div className="absolute inset-[-20%] bg-[radial-gradient(circle_at_30%_70%,rgba(168,85,247,0.4)_0%,rgba(168,85,247,0.1)_30%,transparent_60%),radial-gradient(circle_at_70%_30%,rgba(147,51,234,0.3)_0%,rgba(147,51,234,0.1)_40%,transparent_70%)] animate-[energy-flow_8s_ease-in-out_infinite_alternate] mix-blend-plus-lighter opacity-60" />

                            {/* Cosmic Dust Particles - Stars across entire card */}
                            <div className="absolute inset-0 opacity-50">
                                {/* Upper region stars */}
                                <div className="absolute top-[15%] left-[25%] w-0.5 h-0.5 bg-purple-300 rounded-full animate-[dust-twinkle_3s_ease-in-out_infinite]" style={{ animationDelay: '0s' }} />
                                <div className="absolute top-[20%] right-[15%] w-1 h-1 bg-purple-400 rounded-full animate-[dust-twinkle_4s_ease-in-out_infinite]" style={{ animationDelay: '1s' }} />
                                <div className="absolute top-[10%] left-[60%] w-0.5 h-0.5 bg-purple-200 rounded-full animate-[dust-twinkle_3.5s_ease-in-out_infinite]" style={{ animationDelay: '2s' }} />
                                <div className="absolute top-[25%] right-[70%] w-0.5 h-0.5 bg-white rounded-full animate-[dust-twinkle_5s_ease-in-out_infinite]" style={{ animationDelay: '0.5s' }} />

                                {/* Central region stars */}
                                <div className="absolute top-[45%] left-[15%] w-0.5 h-0.5 bg-purple-500 rounded-full animate-[dust-twinkle_4.5s_ease-in-out_infinite]" style={{ animationDelay: '1.5s' }} />
                                <div className="absolute top-[55%] right-[25%] w-1 h-1 bg-purple-100 rounded-full animate-[dust-twinkle_3.2s_ease-in-out_infinite]" style={{ animationDelay: '2.5s' }} />
                                <div className="absolute top-[35%] left-[75%] w-0.5 h-0.5 bg-purple-300 rounded-full animate-[dust-twinkle_4.8s_ease-in-out_infinite]" style={{ animationDelay: '0.8s' }} />

                                {/* Lower region stars */}
                                <div className="absolute bottom-[20%] left-[30%] w-0.5 h-0.5 bg-purple-400 rounded-full animate-[dust-twinkle_3.8s_ease-in-out_infinite]" style={{ animationDelay: '1.2s' }} />
                                <div className="absolute bottom-[15%] right-[45%] w-0.5 h-0.5 bg-purple-200 rounded-full animate-[dust-twinkle_4.2s_ease-in-out_infinite]" style={{ animationDelay: '2.8s' }} />
                                <div className="absolute bottom-[25%] left-[70%] w-1 h-1 bg-white rounded-full animate-[dust-twinkle_3.6s_ease-in-out_infinite]" style={{ animationDelay: '0.3s' }} />
                                <div className="absolute bottom-[10%] right-[20%] w-0.5 h-0.5 bg-purple-500 rounded-full animate-[dust-twinkle_5.2s_ease-in-out_infinite]" style={{ animationDelay: '1.8s' }} />
                            </div>

                            {/* Inner Glow Core - Pulsing center */}
                            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-[radial-gradient(circle,rgba(168,85,247,0.6)_0%,rgba(168,85,247,0.2)_50%,transparent_100%)] animate-[core-pulse_4s_ease-in-out_infinite] rounded-full blur-sm" />
                        </div>

                        {/* Static Border Glow */}
                        <div className="absolute inset-0 z-0 pointer-events-none border border-purple-500/30 shadow-[inset_0_0_20px_rgba(168,85,247,0.2)]" />
                    </>
                )}

                {/* Whale Tier: The Bioluminescent Deep */}
                {isWhale && (
                    <>
                        {/* Deep Ocean Base */}
                        <div className="absolute inset-0 z-0 pointer-events-none bg-[radial-gradient(circle_at_50%_120%,rgba(59,130,246,0.4)_0%,rgba(59,130,246,0.1)_40%,transparent_70%)] animate-breathe" />

                        {/* Floating Plankton (Noise Texture) */}
                        <div className="absolute inset-0 z-0 pointer-events-none opacity-20 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] mix-blend-overlay animate-drift" />

                    </>
                )}

                <div className={cn(
                    "relative z-10 grid grid-cols-[1fr_auto] gap-2",
                    isSuper && "animate-heat-distortion"
                )}>
                    {/* Top Left: Title */}
                    <div className="flex items-center">
                        <h3 className="text-lg font-bold uppercase tracking-tight text-zinc-100 line-clamp-2 leading-tight" title={title}>
                            {title}
                        </h3>
                    </div>

                    {/* Top Right: Amount */}
                    <div className="flex items-start justify-end">
                        <div className="relative group">
                            {/* Quantum Energy Core - Compact Aura */}
                            <div className={cn(
                                "absolute -inset-1 rounded-full blur-sm opacity-50",
                                isGod ? "bg-[radial-gradient(circle,rgba(251,191,36,0.7)_0%,rgba(251,191,36,0.3)_70%,transparent_100%)]" :
                                    isSuper ? "bg-[radial-gradient(circle,rgba(239,68,68,0.7)_0%,rgba(239,68,68,0.3)_70%,transparent_100%)]" :
                                        isMega ? "bg-[radial-gradient(circle,rgba(168,85,247,0.7)_0%,rgba(168,85,247,0.3)_70%,transparent_100%)]" :
                                            isWhale ? "bg-[radial-gradient(circle,rgba(59,130,246,0.7)_0%,rgba(59,130,246,0.3)_70%,transparent_100%)]" :
                                                "bg-[radial-gradient(circle,rgba(161,161,170,0.5)_0%,rgba(161,161,170,0.2)_70%,transparent_100%)]"
                            )} />

                            {/* Holographic Display Panel */}
                            <div className="relative bg-black/85 backdrop-blur-sm border border-white/25 rounded-md px-2 py-0.5 shadow-lg">
                                {/* Scan Lines */}
                                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/8 to-transparent bg-[length:100%_3px] animate-pulse opacity-40" />

                                {/* Amount Display with Digital Effect */}
                                <div className="relative flex items-center gap-0.5">
                                    {/* Currency Symbol */}
                                    <span className={cn(
                                        "text-xs font-bold",
                                        isGod ? "text-yellow-400" :
                                            isSuper ? "text-red-400" :
                                                isMega ? "text-purple-400" :
                                                    isWhale ? "text-blue-400" :
                                                        "text-zinc-400"
                                    )}>
                                        $
                                    </span>

                                    {/* Main Amount with Matrix-style effect */}
                                    <span className={cn(
                                        "font-mono font-black text-lg tabular-nums tracking-wide relative",
                                        isGod ? "text-yellow-100 drop-shadow-[0_0_8px_rgba(251,191,36,0.9)]" :
                                            isSuper ? "text-red-100 drop-shadow-[0_0_8px_rgba(239,68,68,0.9)]" :
                                                isMega ? "text-purple-100 drop-shadow-[0_0_8px_rgba(168,85,247,0.9)]" :
                                                    isWhale ? "text-blue-100 drop-shadow-[0_0_8px_rgba(59,130,246,0.9)]" :
                                                        "text-zinc-100 drop-shadow-[0_0_5px_rgba(161,161,170,0.7)]"
                                    )}>
                                        {Math.round(value).toLocaleString()}
                                    </span>

                                    {/* Digital Noise Overlay */}
                                    <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgdmlld0JveD0iMCAwIDEwMCAxMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIxIiBoZWlnaHQ9IjEiIGZpbGw9IiNmZmYiIG9wYWNpdHk9IjAuMDMiLz4KPHJlY3QgeD0iMyIgeT0iMyIgd2lkdGg9IjEiIGhlaWdodD0iMSIgZmlsbD0iI2ZmZiIgb3BhY2l0eT0iMC4wNSIvPgo8cmVjdCB4PSI2IiB5PSIyIiB3aWR0aD0iMSIgaGVpZ2h0PSIxIiBmaWxsPSIjZmZmIiBvcGFjaXR5PSIwLjA4Ii8+Cjwvc3ZnPg==')] opacity-15 animate-pulse" />
                                </div>
                            </div>
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

            {/* Timestamp Reveal - Appears behind the lifting card */}
            <div className="absolute bottom-0 left-0 right-0 flex justify-center items-end z-0 opacity-0 group-hover:opacity-100 group-hover:translate-y-6 transition-all duration-300 delay-75">
                <span className="text-[10px] font-mono font-bold text-zinc-400 uppercase tracking-wider bg-black/50 px-2 py-0.5 rounded">
                    {new Date(timestamp).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit',
                        hour12: false
                    })}
                </span>
            </div>
        </div>
    );
}


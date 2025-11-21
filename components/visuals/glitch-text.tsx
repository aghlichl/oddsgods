"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface GlitchTextProps {
    text: string;
    className?: string;
    trigger?: unknown; // Value that triggers the glitch
}

export function GlitchText({ text, className, trigger }: GlitchTextProps) {
    const [isGlitching, setIsGlitching] = useState(false);

    useEffect(() => {
        // Trigger glitch effect when text or trigger changes
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setIsGlitching(true);
        const timeout = setTimeout(() => setIsGlitching(false), 300);
        return () => clearTimeout(timeout);
    }, [text, trigger]);

    return (
        <div className={cn("relative inline-block", className)}>
            <span className="relative z-10">{text}</span>
            {isGlitching && (
                <>
                    <motion.span
                        className="absolute top-0 left-0 -z-10 text-primary opacity-70 mix-blend-screen"
                        animate={{ x: [-2, 2, -1, 0], y: [1, -1, 0] }}
                        transition={{ duration: 0.2 }}
                    >
                        {text}
                    </motion.span>
                    <motion.span
                        className="absolute top-0 left-0 -z-10 text-secondary opacity-70 mix-blend-screen"
                        animate={{ x: [2, -2, 1, 0], y: [-1, 1, 0] }}
                        transition={{ duration: 0.2 }}
                    >
                        {text}
                    </motion.span>
                </>
            )}
        </div>
    );
}

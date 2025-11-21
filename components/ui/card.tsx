import { cn } from "@/lib/utils";

export function Card({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
    return (
        <div
            className={cn(
                "bg-card border border-border shadow-[0_0_15px_-5px_rgba(0,0,0,0.5)] relative overflow-hidden rounded-sm",
                className
            )}
            {...props}
        >
            {children}
        </div>
    );
}

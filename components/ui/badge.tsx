import { cn } from "@/lib/utils";
import { cva, type VariantProps } from "class-variance-authority"; // Added cva import

const badgeVariants = cva(
    "inline-flex items-center rounded-sm border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
    {
        variants: {
            variant: {
                default:
                    "border-zinc-700 text-zinc-400 bg-zinc-900/50",
                primary:
                    "border-primary/50 text-primary bg-primary/10 shadow-[0_0_10px_-3px_var(--color-primary)]",
                secondary:
                    "border-secondary/50 text-secondary bg-secondary/10 shadow-[0_0_10px_-3px_var(--color-secondary)]",
                gold:
                    "border-gold/50 text-gold bg-gold/10 shadow-[0_0_10px_-3px_var(--color-gold)]",
                outline: "text-foreground", // Added outline variant
            },
        },
        defaultVariants: {
            variant: "default",
        },
    }
);

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement>, VariantProps<typeof badgeVariants> { } // Updated BadgeProps to use VariantProps

export function Badge({ className, variant, ...props }: BadgeProps) { // Removed default variant from destructuring as cva handles it
    return (
        <span
            className={cn(
                badgeVariants({ variant }), // Used badgeVariants to apply styles
                className
            )}
            {...props}
        />
    );
}

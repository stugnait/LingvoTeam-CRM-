import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/src/lib/utils"

const badgeVariants = cva(
    "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-all duration-200 border shadow-xs",
    {
        variants: {
            variant: {
                default:
                    "bg-primary/10 text-primary border-primary/20 hover:bg-primary/15",
                secondary:
                    "bg-secondary text-secondary-foreground border-border hover:bg-secondary/80",
                outline:
                    "bg-transparent text-foreground border-input-border hover:bg-muted",
                success:
                    "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100",
                warning:
                    "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100",
                destructive:
                    "bg-destructive/10 text-destructive border-destructive/20 hover:bg-destructive/15",
            },
            size: {
                sm: "px-2 py-0.5 text-xs",
                md: "px-3 py-1.5 text-xs",
                lg: "px-4 py-2 text-sm",
            },
        },
        defaultVariants: {
            variant: "default",
            size: "md",
        },
    }
)

function Badge({
                   className,
                   variant,
                   size,
                   asChild = false,
                   ...props
               }: React.ComponentProps<"span"> &
    VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
    const Comp = asChild ? Slot : "span"

    return (
        <Comp
            className={cn(badgeVariants({ variant, size }), className)}
            {...props}
        />
    )
}

export { Badge, badgeVariants }
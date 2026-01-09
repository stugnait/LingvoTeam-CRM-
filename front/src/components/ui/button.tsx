import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/src/lib/utils"

const buttonVariants = cva(
    "inline-flex items-center justify-center rounded-xl text-sm font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98]",
    {
        variants: {
            variant: {
                default:
                    "bg-primary text-primary-foreground shadow-sm hover:bg-primary-dark hover:shadow-md",
                secondary:
                    "bg-secondary text-secondary-foreground border border-border hover:bg-secondary/80 hover:shadow-sm",
                outline:
                    "border-2 border-input-border bg-transparent text-foreground hover:bg-muted hover:border-primary/50",
                ghost:
                    "text-foreground hover:bg-muted hover:text-primary",
                destructive:
                    "bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90",
                success:
                    "bg-emerald-600 text-white shadow-sm hover:bg-emerald-700",
                link:
                    "text-primary underline-offset-4 hover:underline hover:bg-transparent",
            },
            size: {
                sm: "h-8 rounded-lg px-3 text-xs",
                default: "h-10 px-5 py-2.5",
                lg: "h-12 rounded-xl px-8 text-base",
                icon: "h-10 w-10",
            },
        },
        defaultVariants: {
            variant: "default",
            size: "default",
        },
    }
)

export interface ButtonProps
    extends React.ButtonHTMLAttributes<HTMLButtonElement>,
        VariantProps<typeof buttonVariants> {
    asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, variant, size, asChild = false, ...props }, ref) => {
        const Comp = asChild ? Slot : "button"
        return (
            <Comp
                ref={ref}
                className={cn(buttonVariants({ variant, size }), className)}
                {...props}
            />
        )
    }
)
Button.displayName = "Button"

export { Button, buttonVariants }
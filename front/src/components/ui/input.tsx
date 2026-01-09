"use client"

import * as React from "react"
import { cn } from "@/src/lib/utils"

export interface InputProps
    extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
    ({ className, type, ...props }, ref) => (
        <input
            ref={ref}
            type={type}
            className={cn(
                "form-input flex h-12 w-full rounded-xl border border-input-border bg-input px-4 py-3 text-base",
                "text-foreground placeholder:text-muted-foreground/70",
                "file:border-0 file:bg-transparent file:text-sm file:font-medium",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:border-primary",
                "disabled:cursor-not-allowed disabled:opacity-50",
                "transition-all duration-200",
                className
            )}
            {...props}
        />
    )
)

Input.displayName = "Input"

export { Input }
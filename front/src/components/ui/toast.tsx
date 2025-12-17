"use client"

import * as React from "react"
import * as ToastPrimitives from "@radix-ui/react-toast"
import { cva, type VariantProps } from "class-variance-authority"
import {AlertTriangle, CheckCircle, Info, X} from "lucide-react"

import { cn } from "@/src/lib/utils"

const ToastProvider = ToastPrimitives.Provider

const ToastViewport = React.forwardRef<
    React.ElementRef<typeof ToastPrimitives.Viewport>,
    React.ComponentPropsWithoutRef<typeof ToastPrimitives.Viewport>
>(({ className, ...props }, ref) => (
    <ToastPrimitives.Viewport
        ref={ref}
        className={cn(
            "fixed top-0 z-[9999] flex max-h-screen w-full flex-col-reverse p-4 sm:bottom-0 sm:right-0 sm:top-auto sm:flex-col md:max-w-[420px]",
            className
        )}
        {...props}
    />
))
ToastViewport.displayName = ToastPrimitives.Viewport.displayName

const toastVariants = cva(
    "group pointer-events-auto relative z-[9000] flex w-full items-start gap-3 overflow-hidden rounded-md border-2 p-2 pr-8 shadow-md transition-all duration-300 bg-opacity-70 data-[swipe=cancel]:translate-x-0 data-[swipe=end]:translate-x-[var(--radix-toast-swipe-end-x)] data-[swipe=move]:translate-x-[var(--radix-toast-swipe-move-x)] data-[swipe=move]:transition-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[swipe=end]:animate-out data-[state=closed]:fade-out-80 data-[state=closed]:slide-out-to-right-full data-[state=open]:slide-in-from-top-full data-[state=open]:sm:slide-in-from-bottom-full",
    {
        variants: {
            variant: {
                default:
                    "border-blue-200 bg-blue-50 text-gray-800",
                error:
                    "border-red-200 bg-red-50 text-red-900",
                success:
                    "border-green-200 bg-green-50 text-green-900",
                warning:
                    "border-yellow-200 bg-yellow-50 text-yellow-900",
            },
        },
        defaultVariants: {
            variant: "default",
        },
    }
)

type ToastVariant = "default" | "success" | "error" | "warning"

const closeIconColorMap: Record<ToastVariant, string> = {
    default: "text-blue-500 hover:text-blue-600 focus:ring-blue-300",
    success: "text-green-600 hover:text-green-700 focus:ring-green-400",
    error: "text-red-500 hover:text-red-600 focus:ring-red-400",
    warning: "text-yellow-500 hover:text-yellow-600 focus:ring-yellow-400",
}

interface ToastCloseProps
    extends React.ComponentPropsWithoutRef<typeof ToastPrimitives.Close> {
    variant?: ToastVariant
}

const ToastClose = React.forwardRef<
    React.ElementRef<typeof ToastPrimitives.Close>,
    ToastCloseProps
>(({ className, variant = "default", ...props }, ref) => (
    <ToastPrimitives.Close
        ref={ref}
        className={cn(
            "absolute right-2 top-2 rounded-md p-1 opacity-0 transition-opacity focus:outline-none focus:ring-2 group-hover:opacity-100",
            closeIconColorMap[variant],
            className
        )}
        toast-close=""
        {...props}
    >
        <X className="h-4 w-4" />
    </ToastPrimitives.Close>
))
ToastClose.displayName = ToastPrimitives.Close.displayName

const Toast = React.forwardRef<
    React.ElementRef<typeof ToastPrimitives.Root>,
    React.ComponentPropsWithoutRef<typeof ToastPrimitives.Root> &
    VariantProps<typeof toastVariants>
>(({ className, variant, children, ...props }, ref) => {
    return (
        <ToastPrimitives.Root
            ref={ref}
            className={cn(toastVariants({ variant }), className, 'z-[9000]')}
            {...props}
        >
            <div className="flex items-start gap-3">
                {/* Іконка залежно від variant */}
                {variant === "error" && (
                    <X className="mt-1 h-5 w-5 text-red-600 shrink-0" />
                )}
                {variant === "success" && (
                    <CheckCircle className="mt-1 h-5 w-5 text-green-600 shrink-0" />
                )}
                {variant === "warning" && (
                    <AlertTriangle className="mt-1 h-5 w-5 text-yellow-600 shrink-0" />
                )}
                {variant === "default" && (
                    <Info className="mt-1 h-5 w-5 text-blue-500 shrink-0" />
                )}

                <div className="flex flex-col">{children}</div>
                <ToastClose variant={variant || undefined} />
            </div>
        </ToastPrimitives.Root>
    )
})
Toast.displayName = ToastPrimitives.Root.displayName


const ToastAction = React.forwardRef<
    React.ElementRef<typeof ToastPrimitives.Action>,
    React.ComponentPropsWithoutRef<typeof ToastPrimitives.Action>
>(({ className, ...props }, ref) => (
    <ToastPrimitives.Action
        ref={ref}
        className={cn(
            "inline-flex h-8 shrink-0 items-center justify-center rounded-md border bg-transparent px-3 text-sm font-medium ring-offset-background transition-colors hover:bg-secondary focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 group-[.destructive]:border-muted/40 group-[.destructive]:hover:border-destructive/30 group-[.destructive]:hover:bg-destructive group-[.destructive]:hover:text-destructive-foreground group-[.destructive]:focus:ring-destructive",
            className
        )}
        {...props}
    />
))
ToastAction.displayName = ToastPrimitives.Action.displayName



const ToastTitle = React.forwardRef<
    React.ElementRef<typeof ToastPrimitives.Title>,
    React.ComponentPropsWithoutRef<typeof ToastPrimitives.Title>
>(({ className, ...props }, ref) => (
    <ToastPrimitives.Title
        ref={ref}
        className={cn("text-base font-bold", className)}
        {...props}
    />
))


const ToastDescription = React.forwardRef<
    React.ElementRef<typeof ToastPrimitives.Description>,
    React.ComponentPropsWithoutRef<typeof ToastPrimitives.Description>
>(({ className, ...props }, ref) => (
    <ToastPrimitives.Description
        ref={ref}
        className={cn("text-sm text-gray-600", className)}
        {...props}
    />
))


type ToastProps = React.ComponentPropsWithoutRef<typeof Toast>

type ToastActionElement = React.ReactElement<typeof ToastAction>

export {
    type ToastProps,
    type ToastActionElement,
    ToastProvider,
    ToastViewport,
    Toast,
    ToastTitle,
    ToastDescription,
    ToastClose,
    ToastAction,
}
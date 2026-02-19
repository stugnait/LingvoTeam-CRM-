"use client"

import * as React from "react"
import * as SelectPrimitive from "@radix-ui/react-select"
import { Check, ChevronDown, ChevronUp, ChevronsUpDown } from "lucide-react"
import { cn } from "@/src/lib/utils"

const Select = SelectPrimitive.Root
const SelectGroup = SelectPrimitive.Group
const SelectValue = SelectPrimitive.Value

const SelectTrigger = React.forwardRef<
    React.ElementRef<typeof SelectPrimitive.Trigger>,
    React.ComponentPropsWithoutRef<typeof SelectPrimitive.Trigger>
>(({ className, children, ...props }, ref) => (
    <SelectPrimitive.Trigger
        ref={ref}
        className={cn(
            "flex h-10 w-full items-center justify-between rounded-xl border border-border/50 bg-background/50 px-4 py-2 text-sm",
            "backdrop-blur-sm transition-all duration-300",
            "placeholder:text-muted-foreground/70",
            "focus:outline-none focus:ring-2 focus:ring-ring/50 focus:border-ring",
            "disabled:cursor-not-allowed disabled:opacity-50",
            "hover:bg-accent/10 hover:border-accent/30",
            "shadow-sm hover:shadow-md",
            className
        )}
        {...props}
    >
        {children}
        <SelectPrimitive.Icon asChild>
            <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50 transition-all duration-300 group-hover:opacity-70 group-hover:scale-110" />
        </SelectPrimitive.Icon>
    </SelectPrimitive.Trigger>
))
SelectTrigger.displayName = SelectPrimitive.Trigger.displayName

const SelectContent = React.forwardRef<
    React.ElementRef<typeof SelectPrimitive.Content>,
    React.ComponentPropsWithoutRef<typeof SelectPrimitive.Content> & {
    searchable?: boolean
    searchPlaceholder?: string
}
>(({
       className,
       children,
       position = "popper",
       searchable = false,
       searchPlaceholder = "Search...",
       sideOffset = 5,
       align = "start",
       ...props
   }, ref) => {

    const [search, setSearch] = React.useState("")
    const contentRef = React.useRef<HTMLDivElement>(null)

    const filteredChildren = React.useMemo(() => {
        if (!searchable || !search) return children

        return React.Children.map(children, (child: any) => {
            if (!child?.props?.children) return child

            const text = String(child.props.children).toLowerCase()

            if (text.includes(search.toLowerCase())) {
                return child
            }

            return null
        })
    }, [children, search, searchable])

    // Функція для визначення оптимальної позиції
    // const updatePosition = React.useCallback(() => {
    //     if (contentRef.current) {
    //         const trigger = document.querySelector('[data-radix-select-trigger]')
    //         if (trigger) {
    //             const triggerRect = trigger.getBoundingClientRect()
    //             const contentRect = contentRef.current.getBoundingClientRect()
    //             const viewportHeight = window.innerHeight
    //
    //             // Перевіряємо чи випадає список за межі екрану
    //             const spaceBelow = viewportHeight - triggerRect.bottom
    //             const spaceAbove = triggerRect.top
    //
    //             if (spaceBelow < contentRect.height && spaceAbove > spaceBelow) {
    //                 // Якщо знизу мало місця, а зверху більше - показуємо зверху
    //                 contentRef.current.style.top = 'auto'
    //                 contentRef.current.style.bottom = '100%'
    //             } else {
    //                 // Інакше показуємо знизу
    //                 contentRef.current.style.top = '100%'
    //                 contentRef.current.style.bottom = 'auto'
    //             }
    //         }
    //     }
    // }, [])
    //
    // React.useEffect(() => {
    //     updatePosition()
    //     window.addEventListener('resize', updatePosition)
    //     return () => window.removeEventListener('resize', updatePosition)
    // }, [updatePosition])

    return (
        <SelectPrimitive.Portal>
            <SelectPrimitive.Content
                ref={ref}
                position="popper"
                sideOffset={8}
                align="start"
                avoidCollisions
                collisionPadding={12}
                className={cn(
                    "z-[1000] min-w-[var(--radix-select-trigger-width)]",
                    "max-h-72 overflow-hidden",
                    "rounded-2xl border bg-white shadow-2xl",
                    "data-[side=bottom]:animate-in data-[side=bottom]:fade-in-0 data-[side=bottom]:zoom-in-95",
                    "data-[side=top]:animate-in data-[side=top]:fade-in-0 data-[side=top]:zoom-in-95",
                    className
                )}
                {...props}
            >
            {searchable && (
                    <div className="p-2 border-b sticky top-0 bg-popover/95 backdrop-blur-xl z-10">
                        <input
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder={searchPlaceholder}
                            className="w-full rounded-md border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                            onClick={(e) => e.stopPropagation()}
                        />
                    </div>
                )}

                <SelectPrimitive.Viewport className="p-2 max-h-72">
                {filteredChildren}
                </SelectPrimitive.Viewport>
            </SelectPrimitive.Content>
        </SelectPrimitive.Portal>
    )
})
SelectContent.displayName = SelectPrimitive.Content.displayName

const SelectLabel = React.forwardRef<
    React.ElementRef<typeof SelectPrimitive.Label>,
    React.ComponentPropsWithoutRef<typeof SelectPrimitive.Label>
>(({ className, ...props }, ref) => (
    <SelectPrimitive.Label
        ref={ref}
        className={cn(
            "px-3 py-1.5 text-xs font-medium text-muted-foreground/70 uppercase tracking-wider",
            className
        )}
        {...props}
    />
))
SelectLabel.displayName = SelectPrimitive.Label.displayName

const SelectItem = React.forwardRef<
    React.ElementRef<typeof SelectPrimitive.Item>,
    React.ComponentPropsWithoutRef<typeof SelectPrimitive.Item>
>(({ className, children, ...props }, ref) => (
    <SelectPrimitive.Item
        ref={ref}
        className={cn(
            "relative flex w-full cursor-default select-none items-center rounded-lg py-2.5 pl-10 pr-4 text-sm",
            "outline-none transition-all duration-200",
            "focus:bg-accent/20 focus:text-accent-foreground",
            "data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
            "hover:bg-accent/10 hover:pl-12",
            "data-[state=checked]:bg-accent/20 data-[state=checked]:font-medium",
            "active:scale-[0.98]",
            className
        )}
        {...props}
    >
        <span className="absolute left-3 flex h-4 w-4 items-center justify-center">
            <SelectPrimitive.ItemIndicator>
                <Check className="h-4 w-4 animate-in zoom-in-50 fade-in-0 duration-200 text-primary" />
            </SelectPrimitive.ItemIndicator>
        </span>
        <SelectPrimitive.ItemText className="flex-1">{children}</SelectPrimitive.ItemText>
    </SelectPrimitive.Item>
))
SelectItem.displayName = SelectPrimitive.Item.displayName

const SelectSeparator = React.forwardRef<
    React.ElementRef<typeof SelectPrimitive.Separator>,
    React.ComponentPropsWithoutRef<typeof SelectPrimitive.Separator>
>(({ className, ...props }, ref) => (
    <SelectPrimitive.Separator
        ref={ref}
        className={cn(
            "-mx-1 my-1 h-px bg-border/50",
            className
        )}
        {...props}
    />
))
SelectSeparator.displayName = SelectPrimitive.Separator.displayName

const SelectScrollUpButton = React.forwardRef<
    React.ElementRef<typeof SelectPrimitive.ScrollUpButton>,
    React.ComponentPropsWithoutRef<typeof SelectPrimitive.ScrollUpButton>
>(({ className, ...props }, ref) => (
    <SelectPrimitive.ScrollUpButton
        ref={ref}
        className={cn(
            "flex cursor-default items-center justify-center py-2 transition-all duration-200",
            "hover:bg-accent/20 hover:scale-105",
            "text-muted-foreground/70 hover:text-foreground",
            className
        )}
        {...props}
    >
        <ChevronUp className="h-4 w-4" />
    </SelectPrimitive.ScrollUpButton>
))
SelectScrollUpButton.displayName = SelectPrimitive.ScrollUpButton.displayName

const SelectScrollDownButton = React.forwardRef<
    React.ElementRef<typeof SelectPrimitive.ScrollDownButton>,
    React.ComponentPropsWithoutRef<typeof SelectPrimitive.ScrollDownButton>
>(({ className, ...props }, ref) => (
    <SelectPrimitive.ScrollDownButton
        ref={ref}
        className={cn(
            "flex cursor-default items-center justify-center py-2 transition-all duration-200",
            "hover:bg-accent/20 hover:scale-105",
            "text-muted-foreground/70 hover:text-foreground",
            className
        )}
        {...props}
    >
        <ChevronDown className="h-4 w-4" />
    </SelectPrimitive.ScrollDownButton>
))
SelectScrollDownButton.displayName = SelectPrimitive.ScrollDownButton.displayName

export {
    Select,
    SelectGroup,
    SelectValue,
    SelectTrigger,
    SelectContent,
    SelectLabel,
    SelectItem,
    SelectSeparator,
    SelectScrollUpButton,
    SelectScrollDownButton,
}
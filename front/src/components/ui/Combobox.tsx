"use client"

import * as React from "react"
import * as Popover from "@radix-ui/react-popover"
import * as ScrollArea from "@radix-ui/react-scroll-area"
import { Check, ChevronsUpDown, Search } from "lucide-react"
import { cn } from "@/src/lib/utils"

interface ComboboxOption {
    value: string
    label: string
    searchText?: string
    meta?: any
}

interface ComboboxProps {
    options?: ComboboxOption[] | null  // Дозволяємо null та undefined
    value?: string
    onChange: (value: string) => void
    placeholder?: string
    searchPlaceholder?: string
    emptyMessage?: string
    searchable?: boolean
    renderOption?: (
        option: ComboboxOption,
        isSelected: boolean
    ) => React.ReactNode
}

export function Combobox({
                             options = [],  // Значення за замовчуванням
                             value,
                             onChange,
                             placeholder = "Select option",
                             searchPlaceholder = "Search...",
                             emptyMessage = "No results found.",
                             searchable = true,
                             renderOption
                         }: ComboboxProps) {

    const [open, setOpen] = React.useState(false)
    const [searchQuery, setSearchQuery] = React.useState("")

    // Безпечний пошук вибраної опції
    const selected = React.useMemo(() => {
        if (!options || !Array.isArray(options)) return undefined
        return options.find(o => o.value === value)
    }, [options, value])

    // Фільтрація опцій
    const filteredOptions = React.useMemo(() => {
        if (!options || !Array.isArray(options)) return []
        if (!searchQuery) return options

        return options.filter(option => {
            const searchText = (option.searchText || option.label).toLowerCase()
            return searchText.includes(searchQuery.toLowerCase())
        })
    }, [options, searchQuery])

    return (
        <Popover.Root open={open} onOpenChange={setOpen}>
            <Popover.Trigger asChild>
                <button
                    type="button"
                    className={cn(
                        "flex h-10 w-full items-center justify-between rounded-xl border border-border/50 bg-background/50 px-4 py-2 text-sm",
                        "backdrop-blur-sm transition-all duration-300",
                        "placeholder:text-muted-foreground/70",
                        "focus:outline-none focus:ring-2 focus:ring-ring/50 focus:border-ring",
                        "disabled:cursor-not-allowed disabled:opacity-50",
                        "hover:bg-accent/10 hover:border-accent/30",
                        "shadow-sm hover:shadow-md",
                        !selected && "text-muted-foreground/70",
                        open && "border-ring ring-2 ring-ring/50"
                    )}
                >
                    <span className="truncate">
                        {selected?.label ?? placeholder}
                    </span>
                    <ChevronsUpDown className={cn(
                        "ml-2 h-4 w-4 shrink-0 opacity-50 transition-all duration-300",
                        "group-hover:opacity-70 group-hover:scale-110",
                        open && "opacity-70 scale-110"
                    )} />
                </button>
            </Popover.Trigger>

            <Popover.Portal>
                <Popover.Content
                    align="start"
                    sideOffset={8}
                    className={cn(
                        "z-[1000] w-[var(--radix-popover-trigger-width)] min-w-[200px]",
                        "rounded-2xl border bg-white shadow-2xl overflow-hidden",
                        "data-[side=bottom]:animate-in data-[side=bottom]:fade-in-0 data-[side=bottom]:zoom-in-95",
                        "data-[side=top]:animate-in data-[side=top]:fade-in-0 data-[side=top]:zoom-in-95",
                        "data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95",
                        "data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95",
                        "data-[side=bottom]:slide-in-from-top-2",
                        "data-[side=top]:slide-in-from-bottom-2"
                    )}
                >
                    {/* Пошук */}
                    {searchable && (
                        <div className="p-2 border-b bg-white">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground/50" />
                                <input
                                    type="text"
                                    placeholder={searchPlaceholder}
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full h-9 rounded-md border border-border/50 bg-background/50 pl-9 pr-3 text-sm outline-none transition-all placeholder:text-muted-foreground/50 focus:border-ring focus:ring-2 focus:ring-ring/50"
                                    onClick={(e) => e.stopPropagation()}
                                />
                            </div>
                        </div>
                    )}

                    {/* Список опцій з скролом */}
                    <ScrollArea.Root className="w-full" type="auto">
                        <ScrollArea.Viewport className="w-full max-h-[280px]">
                            <div className="p-2">
                                {!options || options.length === 0 ? (
                                    <div className="py-8 text-center">
                                        <div className="text-sm text-muted-foreground/70">
                                            {emptyMessage}
                                        </div>
                                    </div>
                                ) : filteredOptions.length === 0 ? (
                                    <div className="py-8 text-center">
                                        <div className="text-sm text-muted-foreground/70">
                                            No matches found
                                        </div>
                                    </div>
                                ) : (
                                    <div className="space-y-1">
                                        {filteredOptions.map((option) => {
                                            const isSelected = value === option.value

                                            return (
                                                <div
                                                    key={option.value}
                                                    onClick={() => {
                                                        onChange(option.value)
                                                        setOpen(false)
                                                        setSearchQuery("")
                                                    }}
                                                    className={cn(
                                                        "relative flex w-full cursor-default select-none items-center rounded-lg py-2.5 pl-10 pr-4 text-sm",
                                                        "outline-none transition-all duration-200",
                                                        "focus:bg-accent/20 focus:text-accent-foreground",
                                                        "hover:bg-accent/10 hover:pl-12",
                                                        "data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
                                                        isSelected && "bg-accent/20 font-medium",
                                                        "active:scale-[0.98]"
                                                    )}
                                                >
                                                    <span className="absolute left-3 flex h-4 w-4 items-center justify-center">
                                                        {isSelected && (
                                                            <Check className="h-4 w-4 animate-in zoom-in-50 fade-in-0 duration-200 text-primary" />
                                                        )}
                                                    </span>
                                                    <span className="flex-1 truncate">
                                                        {option.label}
                                                    </span>
                                                    {renderOption && renderOption(option, isSelected)}
                                                </div>
                                            )
                                        })}
                                    </div>
                                )}
                            </div>
                        </ScrollArea.Viewport>

                        <ScrollArea.Scrollbar
                            className="flex w-2.5 touch-none select-none bg-transparent p-0.5 transition-colors hover:bg-accent/5"
                            orientation="vertical"
                        >
                            <ScrollArea.Thumb className="relative flex-1 rounded-full bg-border/60 hover:bg-border transition-colors" />
                        </ScrollArea.Scrollbar>

                        <ScrollArea.Corner />
                    </ScrollArea.Root>
                </Popover.Content>
            </Popover.Portal>
        </Popover.Root>
    )
}
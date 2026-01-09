"use client"

import * as React from "react"
import * as SelectPrimitive from "@radix-ui/react-select"
import { Check, ChevronDown, Search, Globe } from "lucide-react"
import { cn } from "@/src/lib/utils"

const COUNTRY_CODES = [
    { code: "+1", name: "United States", flag: "🇺🇸" },
    { code: "+44", name: "United Kingdom", flag: "🇬🇧" },
    { code: "+380", name: "Ukraine", flag: "🇺🇦" },
    { code: "+48", name: "Poland", flag: "🇵🇱" },
    { code: "+49", name: "Germany", flag: "🇩🇪" },
    { code: "+33", name: "France", flag: "🇫🇷" },
    { code: "+39", name: "Italy", flag: "🇮🇹" },
    { code: "+34", name: "Spain", flag: "🇪🇸" },
    { code: "+90", name: "Turkey", flag: "🇹🇷" },
    { code: "+7", name: "Russia", flag: "🇷🇺" },
    { code: "+86", name: "China", flag: "🇨🇳" },
    { code: "+81", name: "Japan", flag: "🇯🇵" },
    { code: "+82", name: "South Korea", flag: "🇰🇷" },
    { code: "+91", name: "India", flag: "🇮🇳" },
    { code: "+55", name: "Brazil", flag: "🇧🇷" },
    { code: "+61", name: "Australia", flag: "🇦🇺" },
    { code: "+27", name: "South Africa", flag: "🇿🇦" },
    { code: "+52", name: "Mexico", flag: "🇲🇽" },
    { code: "+31", name: "Netherlands", flag: "🇳🇱" },
    { code: "+46", name: "Sweden", flag: "🇸🇪" },
]

interface CountrySelectProps {
    value: string
    onValueChange: (value: string) => void
    disabled?: boolean
    className?: string
}

export function CountrySelect({
                                  value,
                                  onValueChange,
                                  disabled,
                                  className,
                              }: CountrySelectProps) {
    const [search, setSearch] = React.useState("")
    const [open, setOpen] = React.useState(false)

    // DEBUG: Логування пропсів
    React.useEffect(() => {
        console.log("CountrySelect props:", { value, disabled })
    }, [value, disabled])

    // Скидаємо пошук при закритті
    React.useEffect(() => {
        if (!open) {
            setSearch("")
        }
    }, [open])

    const filteredCountries = React.useMemo(
        () =>
            COUNTRY_CODES.filter(
                (country) =>
                    country.name.toLowerCase().includes(search.toLowerCase()) ||
                    country.code.includes(search)
            ),
        [search]
    )

    const selectedCountry = COUNTRY_CODES.find(
        (country) => country.code === value
    )

    const handleValueChange = (newValue: string) => {
        console.log("CountrySelect: Selected value:", newValue)
        onValueChange(newValue)
    }

    return (
        <SelectPrimitive.Root
            value={value}
            onValueChange={handleValueChange}
            disabled={disabled}
            open={open}
            onOpenChange={(isOpen) => {
                console.log("CountrySelect: Open state changed:", isOpen)
                setOpen(isOpen)
            }}
        >
            <SelectPrimitive.Trigger
                className={cn(
                    "flex h-12 w-full items-center justify-between rounded-xl border border-input-border bg-input px-4",
                    "text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-primary/30",
                    "disabled:cursor-not-allowed disabled:opacity-50 transition-all",
                    className
                )}
            >
                {selectedCountry ? (
                    <div className="flex items-center gap-2">
                        <span className="text-lg">{selectedCountry.flag}</span>
                        <span className="font-medium">
                            {selectedCountry.code}
                        </span>
                    </div>
                ) : (
                    <div className="flex items-center gap-2 text-muted-foreground">
                        <Globe className="h-4 w-4" />
                        <span>Code</span>
                    </div>
                )}

                <SelectPrimitive.Icon>
                    <ChevronDown className="h-4 w-4 opacity-50" />
                </SelectPrimitive.Icon>
            </SelectPrimitive.Trigger>

            <SelectPrimitive.Portal>
                <SelectPrimitive.Content
                    position="popper"
                    align="start"
                    sideOffset={4}
                    className={cn(
                        "relative z-50 max-h-96 min-w-[16rem] overflow-hidden rounded-xl border border-border bg-popover shadow-lg",
                        "data-[state=open]:animate-in data-[state=closed]:animate-out",
                        "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
                        "data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95"
                    )}
                >
                    {/* Search Input */}
                    <div className="border-b border-border p-2">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                            <input
                                type="text"
                                placeholder="Search country..."
                                value={search}
                                onChange={(e) => {
                                    console.log("Search changed:", e.target.value)
                                    setSearch(e.target.value)
                                }}
                                onClick={(e) => e.stopPropagation()}
                                onPointerDown={(e) => e.stopPropagation()}
                                onMouseDown={(e) => e.stopPropagation()}
                                onKeyDown={(e) => {
                                    e.stopPropagation()
                                    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
                                        e.preventDefault()
                                    }
                                }}
                                autoComplete="off"
                                autoFocus={false}
                                className={cn(
                                    "h-9 w-full rounded-lg border border-input bg-background pl-9 pr-3 text-sm",
                                    "placeholder:text-muted-foreground",
                                    "focus:outline-none focus:ring-2 focus:ring-primary/30"
                                )}
                            />
                        </div>
                    </div>

                    {/* Countries List */}
                    <SelectPrimitive.Viewport className="p-1 max-h-[300px] overflow-y-auto">
                        {filteredCountries.length > 0 ? (
                            filteredCountries.map((country) => (
                                <SelectPrimitive.Item
                                    key={country.code}
                                    value={country.code}
                                    onSelect={() => {
                                        console.log("Item selected (onSelect):", country.code)
                                    }}
                                    className={cn(
                                        "relative flex cursor-pointer select-none items-center rounded-lg py-2.5 pl-8 pr-2 text-sm",
                                        "outline-none",
                                        "focus:bg-accent focus:text-accent-foreground",
                                        "hover:bg-accent/50",
                                        "data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
                                        "transition-colors"
                                    )}
                                >
                                    <span className="absolute left-2 flex h-4 w-4 items-center justify-center">
                                        <SelectPrimitive.ItemIndicator>
                                            <Check className="h-4 w-4 text-primary" />
                                        </SelectPrimitive.ItemIndicator>
                                    </span>

                                    <SelectPrimitive.ItemText>
                                        <div className="flex items-center gap-3">
                                            <span className="text-lg">
                                                {country.flag}
                                            </span>
                                            <div className="leading-tight">
                                                <div className="font-medium">
                                                    {country.name}
                                                </div>
                                                <div className="text-xs text-muted-foreground">
                                                    {country.code}
                                                </div>
                                            </div>
                                        </div>
                                    </SelectPrimitive.ItemText>
                                </SelectPrimitive.Item>
                            ))
                        ) : (
                            <div className="py-8 text-center text-sm text-muted-foreground">
                                No countries found
                            </div>
                        )}
                    </SelectPrimitive.Viewport>
                </SelectPrimitive.Content>
            </SelectPrimitive.Portal>
        </SelectPrimitive.Root>
    )
}
// Додайте цей новий компонент як CountrySelect.tsx
"use client"

import * as React from "react"
import * as SelectPrimitive from "@radix-ui/react-select"
import { Check, ChevronDown, Search, Globe } from "lucide-react"
import { cn } from "@/src/lib/utils"
import { Input } from "@/src/components/ui/input"

// Хардкоджені коди країн
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
]

interface CountrySelectProps {
    value: string
    onValueChange: (value: string) => void
    disabled?: boolean
}

export function CountrySelect({ value, onValueChange, disabled }: CountrySelectProps) {
    const [search, setSearch] = React.useState("")

    const filteredCountries = COUNTRY_CODES.filter(country =>
        country.name.toLowerCase().includes(search.toLowerCase()) ||
        country.code.includes(search)
    )

    const selectedCountry = COUNTRY_CODES.find(c => c.code === value)

    return (
        <SelectPrimitive.Root value={value} onValueChange={onValueChange} disabled={disabled}>
            <SelectPrimitive.Trigger
                className={cn(
                    "flex h-12 w-full items-center justify-between rounded-xl border border-input-border bg-input px-4",
                    "text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-primary/30",
                    "disabled:cursor-not-allowed disabled:opacity-50",
                    "transition-all duration-200"
                )}
            >
                <SelectPrimitive.Value placeholder="Select country">
                    {selectedCountry ? (
                        <div className="flex items-center gap-2">
                            <span className="text-lg">{selectedCountry.flag}</span>
                            <span className="font-medium">{selectedCountry.code}</span>
                        </div>
                    ) : (
                        <div className="flex items-center gap-2 text-muted-foreground">
                            <Globe className="h-4 w-4" />
                            <span>Country code</span>
                        </div>
                    )}
                </SelectPrimitive.Value>
                <SelectPrimitive.Icon>
                    <ChevronDown className="h-4 w-4 opacity-50" />
                </SelectPrimitive.Icon>
            </SelectPrimitive.Trigger>

            <SelectPrimitive.Portal>
                <SelectPrimitive.Content
                    className="relative z-50 max-h-96 min-w-[12rem] overflow-hidden rounded-xl border border-border bg-popover text-popover-foreground shadow-lg"
                    position="popper"
                    align="start"
                >
                    <div className="p-2 border-b border-border">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            <Input
                                type="text"
                                placeholder="Search country..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="pl-9 h-9 text-sm"
                                onClick={(e) => e.stopPropagation()}
                            />
                        </div>
                    </div>

                    <SelectPrimitive.Viewport className="p-1">
                        {filteredCountries.length > 0 ? (
                            filteredCountries.map((country) => (
                                <SelectPrimitive.Item
                                    key={country.code}
                                    value={country.code}
                                    className={cn(
                                        "relative flex cursor-default select-none items-center rounded-lg py-3 pl-8 pr-2 text-sm",
                                        "outline-none focus:bg-accent focus:text-accent-foreground",
                                        "data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
                                        "transition-colors duration-150"
                                    )}
                                >
                  <span className="absolute left-2 flex h-4 w-4 items-center justify-center">
                    <SelectPrimitive.ItemIndicator>
                      <Check className="h-4 w-4" />
                    </SelectPrimitive.ItemIndicator>
                  </span>
                                    <div className="flex items-center gap-3">
                                        <span className="text-lg">{country.flag}</span>
                                        <div>
                                            <div className="font-medium">{country.name}</div>
                                            <div className="text-xs text-muted-foreground">{country.code}</div>
                                        </div>
                                    </div>
                                </SelectPrimitive.Item>
                            ))
                        ) : (
                            <div className="py-6 text-center text-sm text-muted-foreground">
                                No countries found
                            </div>
                        )}
                    </SelectPrimitive.Viewport>
                </SelectPrimitive.Content>
            </SelectPrimitive.Portal>
        </SelectPrimitive.Root>
    )
}
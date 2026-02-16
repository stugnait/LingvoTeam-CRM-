"use client"

import * as React from "react"
import * as Popover from "@radix-ui/react-popover"
import { Check, ChevronsUpDown } from "lucide-react"
import { Command } from "cmdk"
import { cn } from "@/src/lib/utils"
import * as ScrollArea from "@radix-ui/react-scroll-area"


interface ComboboxOption {
    value: string
    label: string
    searchText?: string
    meta?: any
}


interface ComboboxProps {
    options: ComboboxOption[]
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
                             options,
                             value,
                             onChange,
                             placeholder = "Select option",
                             searchPlaceholder = "Search...",
                             emptyMessage = "No results found.",
                             searchable = true,
                             renderOption
                         }: ComboboxProps) {

    const [open, setOpen] = React.useState(false)

    const selected = options.find(o => o.value === value)

    return (
        <Popover.Root open={open} onOpenChange={setOpen}>
            <Popover.Trigger asChild>
                <button
                    type="button"
                    className="flex h-10 w-full items-center justify-between rounded-xl border px-4 py-2 text-sm shadow-sm hover:shadow-md transition"
                >
                    {selected?.label ?? placeholder}
                    <ChevronsUpDown className="ml-2 h-4 w-4 opacity-50" />
                </button>
            </Popover.Trigger>

            <Popover.Portal>
                <Popover.Content
                    align="start"
                    className="z-50 w-[var(--radix-popover-trigger-width)] rounded-xl border bg-popover p-0 shadow-xl"
                >
                    <Command shouldFilter={searchable}>
                        {searchable && (
                            <Command.Input
                                placeholder={searchPlaceholder}
                                className="h-9 w-full border-b px-3 text-sm outline-none"
                            />
                        )}

                        <Command.List className="max-h-[240px] overflow-y-auto">
                            <Command.Empty className="p-3 text-sm text-muted-foreground">
                                {emptyMessage}
                            </Command.Empty>

                            {options.map((option) => {
                                const isSelected = value === option.value

                                return (
                                    <Command.Item
                                        key={option.value}
                                        value={option.searchText ?? option.label}
                                        onSelect={() => {
                                            onChange(option.value)
                                            setOpen(false)
                                        }}
                                        className="px-3 py-2 text-sm cursor-pointer"
                                    >
                                        {option.label}
                                    </Command.Item>
                                )
                            })}
                        </Command.List>
                    </Command>
                </Popover.Content>
            </Popover.Portal>
        </Popover.Root>
    )
}

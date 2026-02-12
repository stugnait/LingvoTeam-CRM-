"use client"

import { useState } from "react"
import { Input } from "@/src/components/ui/input"
import { ChevronDown, CheckCircle } from "lucide-react"
import { cn } from "@/src/lib/utils"

export interface SelectOption {
    id: number | string
    name: string
    [key: string]: any
}

interface CustomSelectProps {
    label: string
    icon: any
    options: SelectOption[]
    value: string | number | null
    onChange: (value: string) => void
    placeholder?: string
    disabled?: boolean
    showId?: boolean
    searchable?: boolean
    renderOption?: (option: any) => React.ReactNode
    renderValue?: (option: any) => React.ReactNode
}

export function CustomSelect({
                                 label,
                                 icon: Icon,
                                 options,
                                 value,
                                 onChange,
                                 placeholder = "Select option",
                                 disabled = false,
                                 showId = true,
                                 searchable = false,
                                 renderOption,
                                 renderValue
                             }: CustomSelectProps) {
    const [isOpen, setIsOpen] = useState(false)
    const [search, setSearch] = useState("")

    // Перевірка, чи options є масивом
    const optionsArray = Array.isArray(options) ? options : []

    const selectedOption = optionsArray.find(opt => opt.id === Number(value) || opt.id === value)

    const filteredOptions = searchable
        ? optionsArray.filter(opt =>
            opt.name?.toLowerCase().includes(search.toLowerCase()) ||
            (opt.code && opt.code.toLowerCase().includes(search.toLowerCase())) ||
            (opt.id?.toString().includes(search))
        )
        : optionsArray

    return (
        <div className="space-y-1.5 relative">
            <label className="flex items-center gap-1.5 text-xs font-medium text-gray-700 dark:text-gray-300">
                <Icon className="h-3.5 w-3.5 text-blue-600" />
                <span>{label}</span>
            </label>

            <div className="relative">
                <button
                    type="button"
                    onClick={() => !disabled && setIsOpen(!isOpen)}
                    disabled={disabled}
                    className={cn(
                        "w-full px-3 py-2 bg-white dark:bg-gray-900 border rounded-lg",
                        "flex items-center justify-between",
                        "transition-all duration-200",
                        "text-sm",
                        disabled && "bg-gray-50 dark:bg-gray-800/50 cursor-not-allowed opacity-75",
                        isOpen
                            ? "border-blue-600 ring-2 ring-blue-600/20"
                            : "border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700"
                    )}
                >
                    {selectedOption ? (
                        renderValue ? (
                            renderValue(selectedOption)
                        ) : (
                            <span className="flex items-center gap-2">
                                {selectedOption.flag && <span>{selectedOption.flag}</span>}
                                <span className="text-gray-900 dark:text-gray-100">{selectedOption.full_name}</span>
                                {showId && (
                                    <span className="text-xs text-gray-500">(ID: {selectedOption.id})</span>
                                )}
                            </span>
                        )
                    ) : (
                        <span className="text-gray-500 dark:text-gray-400 text-sm">{placeholder}</span>
                    )}
                    <ChevronDown className={cn(
                        "h-4 w-4 text-gray-400 transition-transform duration-200",
                        isOpen && "rotate-180"
                    )} />
                </button>

                {isOpen && (
                    <>
                        <div
                            className="fixed inset-0 z-40"
                            onClick={() => setIsOpen(false)}
                        />
                        <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg shadow-lg py-1 max-h-64 overflow-y-auto">
                            {searchable && (
                                <div className="px-2 py-1.5 border-b border-gray-100 dark:border-gray-800">
                                    <Input
                                        placeholder="Search..."
                                        value={search}
                                        onChange={(e) => setSearch(e.target.value)}
                                        className="h-8 text-xs px-2"
                                        onClick={(e) => e.stopPropagation()}
                                    />
                                </div>
                            )}
                            {filteredOptions.length > 0 ? (
                                filteredOptions.map((option) => (
                                    <button
                                        key={option.id}
                                        type="button"
                                        onClick={() => {
                                            onChange(String(option.id))
                                            setIsOpen(false)
                                            setSearch("")
                                        }}
                                        className={cn(
                                            "w-full px-3 py-2 flex items-center justify-between",
                                            "hover:bg-gray-50 dark:hover:bg-gray-800",
                                            "transition-colors duration-150",
                                            "text-left",
                                            value === option.id && "bg-blue-50 dark:bg-blue-950/30"
                                        )}
                                    >
                                        {renderOption ? (
                                            renderOption(option)
                                        ) : (
                                            <span className="flex items-center gap-2">
                                                {option.flag && <span>{option.flag}</span>}
                                                <span className="text-sm text-gray-900 dark:text-gray-100">{option.name}</span>
                                                {showId && (
                                                    <span className="text-xs text-gray-500">(ID: {option.id})</span>
                                                )}
                                            </span>
                                        )}
                                        {value === option.id && (
                                            <CheckCircle className="h-4 w-4 text-blue-600" />
                                        )}
                                    </button>
                                ))
                            ) : (
                                <div className="px-3 py-2 text-sm text-gray-500 text-center">
                                    No options found
                                </div>
                            )}
                        </div>
                    </>
                )}
            </div>
        </div>
    )
}
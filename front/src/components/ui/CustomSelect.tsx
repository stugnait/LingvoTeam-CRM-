"use client"

import { Input } from "@/src/components/ui/input"
import { cn } from "@/src/lib/utils"

interface CustomSelectProps {
    label: string
    icon: any
    value: string
    onChange: (value: string) => void
    placeholder?: string
    disabled?: boolean
}

export function CustomSelect({
                                 label,
                                 icon: Icon,
                                 value,
                                 onChange,
                                 placeholder = "",
                                 disabled = false,
                             }: CustomSelectProps) {
    return (
        <div className="space-y-1.5">
            <label className="flex items-center gap-1.5 text-xs font-medium text-gray-700 dark:text-gray-300">
                <Icon className="h-3.5 w-3.5 text-blue-600" />
                <span>{label}</span>
            </label>

            <Input
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                disabled={disabled}
                className={cn("h-10")}
            />
        </div>
    )
}

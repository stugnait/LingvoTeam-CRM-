// src/components/ui/PrioritySelector.tsx
"use client"

import * as React from "react"
import { cn } from "@/src/lib/utils"
import {
    ArrowDown,
    Circle,
    ArrowUp,
    Flame,
    Check
} from "lucide-react"
import { useI18n } from "@/src/shared/i18n/I18nProvider"

export type Priority = 'low' | 'medium' | 'high' | 'critical'

interface PriorityOption {
    value: Priority
    label: string
    color: string
    bgColor: string
    hoverColor: string
    borderColor: string
    icon: React.ReactNode
}

const priorityOptions: PriorityOption[] = [
    {
        value: 'low',
        label: 'Low',
        color: 'text-blue-600',
        bgColor: 'bg-blue-50',
        hoverColor: 'hover:bg-blue-100',
        borderColor: 'border-blue-200',
        icon: <ArrowDown className="h-4 w-4" />
    },
    {
        value: 'medium',
        label: 'Medium',
        color: 'text-green-600',
        bgColor: 'bg-green-50',
        hoverColor: 'hover:bg-green-100',
        borderColor: 'border-green-200',
        icon: <Circle className="h-4 w-4" />
    },
    {
        value: 'high',
        label: 'High',
        color: 'text-orange-600',
        bgColor: 'bg-orange-50',
        hoverColor: 'hover:bg-orange-100',
        borderColor: 'border-orange-200',
        icon: <ArrowUp className="h-4 w-4" />
    },
    {
        value: 'critical',
        label: 'Critical',
        color: 'text-red-600',
        bgColor: 'bg-red-50',
        hoverColor: 'hover:bg-red-100',
        borderColor: 'border-red-200',
        icon: <Flame className="h-4 w-4" />
    }
]

interface PrioritySelectorProps {
    value?: Priority
    onChange?: (value: Priority) => void  // onChange опціональний
    className?: string
    label?: string
    required?: boolean
}

export function PrioritySelector({
                                     value,
                                     onChange,
                                     className,
                                     label,
                                     required = false
                                 }: PrioritySelectorProps) {
    const { t } = useI18n()
    const visibleLabel = label ?? t("common.priority")

    const handleChange = (newValue: Priority) => {
        // Перевіряємо чи onChange є функцією перед викликом
        if (typeof onChange === 'function') {
            onChange(newValue)
        }
    }

    return (
        <div className={cn("space-y-3", className)}>
            {visibleLabel && (
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                    <span className="text-gray-700">{visibleLabel}</span>
                    {required && <span className="text-red-500">*</span>}
                </label>
            )}

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {priorityOptions.map((option) => {
                    const isSelected = value === option.value

                    return (
                        <button
                            key={option.value}
                            type="button"
                            onClick={() => handleChange(option.value)}
                            className={cn(
                                "relative flex flex-col items-center gap-2 p-4 rounded-xl",
                                "border-2 transition-all duration-200",
                                "focus:outline-none focus:ring-2 focus:ring-offset-2",
                                isSelected
                                    ? [
                                        option.borderColor,
                                        option.bgColor,
                                        "scale-105 shadow-lg",
                                        `focus:ring-${option.value === 'critical' ? 'red' : option.value === 'high' ? 'orange' : option.value === 'medium' ? 'green' : 'blue'}-500`
                                    ]
                                    : [
                                        "border-gray-200 bg-white",
                                        "hover:border-gray-300 hover:bg-gray-50",
                                        "focus:ring-gray-400"
                                    ],
                                "active:scale-95"
                            )}
                        >
                            {/* Іконка */}
                            <div className={cn(
                                "p-2 rounded-full transition-colors",
                                isSelected ? option.bgColor : "bg-gray-100"
                            )}>
                                <div className={cn(
                                    isSelected ? option.color : "text-gray-500"
                                )}>
                                    {option.icon}
                                </div>
                            </div>

                            {/* Лейбл */}
                            <span className={cn(
                                "text-sm font-medium",
                                isSelected ? option.color : "text-gray-700"
                            )}>
                                {t(`priority.${option.value}`)}
                            </span>

                            {/* Індикатор вибору */}
                            {isSelected && (
                                <div className={cn(
                                    "absolute -top-2 -right-2 w-6 h-6 rounded-full",
                                    "flex items-center justify-center",
                                    option.bgColor,
                                    "border-2 border-white shadow-md"
                                )}>
                                    <Check className={cn("h-3 w-3", option.color)} />
                                </div>
                            )}
                        </button>
                    )
                })}
            </div>

            {/* Підказка */}
            {value && (
                <p className="text-xs text-gray-500 mt-2">
                    {value === 'critical' && `⚠️ ${t("priority.criticalHint")}`}
                    {value === 'high' && `⚡ ${t("priority.highHint")}`}
                    {value === 'medium' && `📋 ${t("priority.mediumHint")}`}
                    {value === 'low' && `⏳ ${t("priority.lowHint")}`}
                </p>
            )}
        </div>
    )
}

// Альтернативний горизонтальний варіант
export function PrioritySelectorHorizontal({
                                               value,
                                               onChange,
                                               className,
                                               label,
                                               required
                                           }: PrioritySelectorProps) {
    const { t } = useI18n()

    const handleChange = (newValue: Priority) => {
        // Перевіряємо чи onChange є функцією перед викликом
        if (typeof onChange === 'function') {
            onChange(newValue)
        }
    }

    return (
        <div className={cn("space-y-3", className)}>
            {label && (
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                    <span>{label}</span>
                    {required && <span className="text-red-500">*</span>}
                </label>
            )}

            <div className="flex flex-wrap gap-2">
                {priorityOptions.map((option) => {
                    const isSelected = value === option.value

                    return (
                        <button
                            key={option.value}
                            type="button"
                            onClick={() => handleChange(option.value)}
                            className={cn(
                                "flex items-center gap-2 px-3 py-2 rounded-xl",
                                "border-2 transition-all duration-200",
                                "focus:outline-none focus:ring-2 focus:ring-offset-2",
                                "min-w-0 flex-shrink-0",
                                isSelected
                                    ? [
                                        option.borderColor,
                                        option.bgColor,
                                        "shadow-md",
                                        `focus:ring-${option.value === 'critical' ? 'red' : option.value === 'high' ? 'orange' : option.value === 'medium' ? 'green' : 'blue'}-500`
                                    ]
                                    : [
                                        "border-gray-200 bg-white",
                                        "hover:border-gray-300 hover:bg-gray-50",
                                        "focus:ring-gray-400"
                                    ],
                                "active:scale-95"
                            )}
                        >
                            <div className={cn(
                                isSelected ? option.color : "text-gray-500"
                            )}>
                                {option.icon}
                            </div>
                            <span className={cn(
                                "text-sm font-medium",
                                isSelected ? option.color : "text-gray-700"
                            )}>
                                {t(`priority.${option.value}`)}
                            </span>
                            {isSelected && (
                                <Check className={cn("h-3.5 w-3.5 ml-1", option.color)} />
                            )}
                        </button>
                    )
                })}
            </div>
        </div>
    )
}

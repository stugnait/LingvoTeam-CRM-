// src/components/ui/DeadlineSelector.tsx
"use client"

import * as React from "react"
import { Button } from "@/src/components/ui/button"
import { CalendarIcon, Clock } from "lucide-react"
import { cn } from "@/src/lib/utils"
import { useI18n } from "@/src/shared/i18n/I18nProvider"

interface DeadlineSelectorProps {
    value?: Date
    onChange?: (date?: Date) => void  // зробимо onChange опціональним
    minDate?: Date
    className?: string
}

export function DeadlineSelector({
                                     value,
                                     onChange,
                                     minDate,
                                     className
                                 }: DeadlineSelectorProps) {
    const { locale, t } = useI18n()
    const dateLocale = locale === "uk" ? "uk-UA" : "en-US"

    const [dateString, setDateString] = React.useState("")
    const [timeString, setTimeString] = React.useState("12:00")

    React.useEffect(() => {
        if (value) {
            const year = value.getFullYear()
            const month = String(value.getMonth() + 1).padStart(2, '0')
            const day = String(value.getDate()).padStart(2, '0')
            setDateString(`${year}-${month}-${day}`)

            const hours = String(value.getHours()).padStart(2, '0')
            const minutes = String(value.getMinutes()).padStart(2, '0')
            setTimeString(`${hours}:${minutes}`)
        }
    }, [value])

    const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newDateString = e.target.value
        setDateString(newDateString)

        if (newDateString && timeString) {
            const [year, month, day] = newDateString.split('-').map(Number)
            const [hours, minutes] = timeString.split(':').map(Number)
            const newDate = new Date(year, month - 1, day, hours, minutes)

            // Перевіряємо чи onChange є функцією перед викликом
            if (typeof onChange === 'function') {
                onChange(newDate)
            }
        }
    }

    const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newTimeString = e.target.value
        setTimeString(newTimeString)

        if (dateString && newTimeString) {
            const [year, month, day] = dateString.split('-').map(Number)
            const [hours, minutes] = newTimeString.split(':').map(Number)
            const newDate = new Date(year, month - 1, day, hours, minutes)

            // Перевіряємо чи onChange є функцією перед викликом
            if (typeof onChange === 'function') {
                onChange(newDate)
            }
        }
    }

    const quickOptions = [
        { label: t("common.tomorrow"), days: 1 },
        { label: t("common.threeDays"), days: 3 },
        { label: t("common.oneWeek"), days: 7 },
        { label: t("common.twoWeeks"), days: 14 },
    ]

    const setQuickDeadline = (days: number) => {
        const date = new Date()
        date.setDate(date.getDate() + days)
        date.setHours(17, 0, 0, 0)

        const year = date.getFullYear()
        const month = String(date.getMonth() + 1).padStart(2, '0')
        const day = String(date.getDate()).padStart(2, '0')
        setDateString(`${year}-${month}-${day}`)

        const hours = String(date.getHours()).padStart(2, '0')
        const minutes = String(date.getMinutes()).padStart(2, '0')
        setTimeString(`${hours}:${minutes}`)

        // Перевіряємо чи onChange є функцією перед викликом
        if (typeof onChange === 'function') {
            onChange(date)
        }
    }

    const minDateString = minDate ?
        `${minDate.getFullYear()}-${String(minDate.getMonth() + 1).padStart(2, '0')}-${String(minDate.getDate()).padStart(2, '0')}`
        : undefined

    return (
        <div className={cn("space-y-3", className)}>
            <div className="flex flex-col sm:flex-row gap-2">
                <div className="flex-1">
                    <input
                        type="date"
                        value={dateString}
                        onChange={handleDateChange}
                        min={minDateString}
                        className="w-full px-3 py-2 border rounded-md"
                    />
                </div>
                <div className="w-full sm:w-32">
                    <input
                        type="time"
                        value={timeString}
                        onChange={handleTimeChange}
                        className="w-full px-3 py-2 border rounded-md"
                    />
                </div>
            </div>

            <div className="flex flex-wrap gap-2">
                {quickOptions.map((option) => (
                    <Button
                        key={option.label}
                        variant="outline"
                        size="sm"
                        onClick={() => setQuickDeadline(option.days)}
                        className="text-xs"
                    >
                        {option.label}
                    </Button>
                ))}
            </div>

            {value && (
                <div className="text-sm text-blue-600 bg-blue-50 p-2 rounded-md">
                    {t("common.deadlineAt", {
                        date: value.toLocaleDateString(dateLocale),
                        time: value.toLocaleTimeString(dateLocale),
                    })}
                </div>
            )}
        </div>
    )
}

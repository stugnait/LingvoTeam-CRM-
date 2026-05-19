"use client"

import { useState, useEffect, useRef } from "react"
import { format } from "date-fns"
import { enUS } from "date-fns/locale"
import { Calendar } from "@/src/components/ui/calendar"
import { DateRange } from "react-day-picker"

const PERIOD_MAP: Record<string, string> = {
    'Daily': 'daily',
    'Weekly': 'weekly',
    'Monthly': 'monthly',
    'Quarterly': 'quarterly',
    'Yearly': 'yearly'
}

interface PeriodSelectorProps {
    onPeriodChange: (periodValue: string) => void;
}

export function PeriodSelector({ onPeriodChange }: PeriodSelectorProps) {
    const [isOpen, setIsOpen] = useState(false)
    const [displayLabel, setDisplayLabel] = useState("")
    const [dateRange, setDateRange] = useState<DateRange | undefined>()

    const containerRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        const savedEng = localStorage.getItem('globalSavedPeriodEng')
        const savedLabel = localStorage.getItem('globalSavedPeriodLabel')

        if (savedEng && savedLabel) {
            setDisplayLabel(savedLabel)
            onPeriodChange(savedEng)

            if (savedEng.includes(' - ')) {
                const [startStr, endStr] = savedEng.split(' - ')
                const parseDate = (str: string) => {
                    const [d, m, y] = str.split('-')
                    return new Date(Number(y), Number(m) - 1, Number(d))
                }
                setDateRange({ from: parseDate(startStr), to: parseDate(endStr) })
            }
        } else {
            setDisplayLabel("Weekly")
            onPeriodChange("weekly")
        }
    }, [])

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false)
            }
        }

        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Escape") setIsOpen(false)
        }

        document.addEventListener("mousedown", handleClickOutside)
        document.addEventListener("keydown", handleKeyDown)
        return () => {
            document.removeEventListener("mousedown", handleClickOutside)
            document.removeEventListener("keydown", handleKeyDown)
        }
    }, [])

    const handlePresetClick = (label: string) => {
        const engValue = PERIOD_MAP[label] || ''

        setDateRange(undefined)

        setDisplayLabel(label)
        localStorage.setItem('globalSavedPeriodEng', engValue)
        localStorage.setItem('globalSavedPeriodLabel', label)

        setIsOpen(false)
        onPeriodChange(engValue)
    }

    const handleDateSelect = (range: DateRange | undefined, selectedDay: Date) => {

        if (dateRange?.from && dateRange?.to) {
            setDateRange({ from: selectedDay, to: undefined })
            setDisplayLabel(`Start: ${format(selectedDay, 'dd-MM-yyyy')}`)
            return
        }

        setDateRange(range)

        if (!range) {
            setDisplayLabel("Select period...")
            return
        }

        if (range?.from && range?.to) {
            const startStr = format(range.from, 'dd-MM-yyyy')
            const endStr = format(range.to, 'dd-MM-yyyy')
            const rangeString = `${startStr} - ${endStr}`

            setDisplayLabel(rangeString)
            localStorage.setItem('globalSavedPeriodEng', rangeString)
            localStorage.setItem('globalSavedPeriodLabel', rangeString)

            setIsOpen(false)
            onPeriodChange(rangeString)
        } else if (range?.from) {
            setDisplayLabel(`Start: ${format(range.from, 'dd-MM-yyyy')}`)
        }
    }

    return (
        <div className="period-container" ref={containerRef}>
            <input
                type="text"
                readOnly
                className={`period-display ${isOpen ? 'active' : ''}`}
                value={displayLabel}
                onClick={() => setIsOpen(!isOpen)}
                placeholder="Select period..."
            />

            <div className={`period-menu ${isOpen ? 'open' : ''}`}>
                <div className="menu-left">
                    <ul>
                        {Object.keys(PERIOD_MAP).map(label => (
                            <li key={label} onClick={() => handlePresetClick(label)}>
                                {label}
                            </li>
                        ))}
                    </ul>
                </div>

                <div className="menu-right">
                    <Calendar
                        mode="range"
                        defaultMonth={dateRange?.from}
                        selected={dateRange}
                        onSelect={handleDateSelect}
                        numberOfMonths={2}
                        locale={enUS}
                        className="mx-auto"
                        disabled={{ after: new Date() }}
                    />

                </div>
            </div>
        </div>
    )
}
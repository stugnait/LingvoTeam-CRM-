"use client"

import { useState, useEffect, useRef } from "react"
import { format } from "date-fns"
import { enUS } from "date-fns/locale"
import { Calendar } from "@/src/components/ui/calendar"
import { DateRange } from "react-day-picker"
import { Calendar as CalendarIcon, ChevronDown } from "lucide-react"

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
    const [isMobile, setIsMobile] = useState(false)

    const containerRef = useRef<HTMLDivElement>(null)

    // Визначення мобільного екрана для кількості місяців
    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth < 768)
        }
        handleResize()
        window.addEventListener("resize", handleResize)
        return () => window.removeEventListener("resize", handleResize)
    }, [])

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
        <div className="relative inline-block w-full sm:w-auto" ref={containerRef}>
            {/* Кнопка вибору періоду */}
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className={`
                    flex w-full sm:w-auto items-center justify-between gap-2 h-10 px-4 py-2 
                    text-sm bg-card border border-border rounded-xl shadow-sm text-left
                    hover:bg-accent/50 focus:outline-none focus:ring-2 focus:ring-primary/20 
                    transition-all duration-200 cursor-pointer font-medium
                    ${isOpen ? 'border-primary ring-2 ring-primary/20' : ''}
                `}
            >
                <div className="flex items-center gap-2 truncate">
                    <CalendarIcon className="h-4 w-4 text-muted-foreground shrink-0" />
                    <span className="truncate">{displayLabel || "Select period..."}</span>
                </div>
                <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform duration-200 shrink-0 ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Випадаюче меню */}
            {isOpen && (
                <div
                    className={`
                        fixed md:absolute left-1/2 md:left-0 -translate-x-1/2 md:translate-x-0
                        top-[calc(15%+40px)] md:top-auto md:mt-2 z-50 
                        bg-white border border-border rounded-xl shadow-xl 
                        flex flex-col md:flex-row divide-y md:divide-y-0 md:divide-x divide-border
                        w-[calc(100vw-2rem)] sm:w-[360px] md:w-auto max-w-[95vw] md:max-w-none
                        max-h-[80vh] md:max-h-none overflow-y-auto md:overflow-visible
                        animate-in fade-in slide-in-from-top-2 duration-150
                    `}
                >
                    {/* Ліва панель: Швидкі пресети */}
                    <div className="p-2 min-w-[140px] shrink-0 bg-slate-50/50 md:bg-transparent">
                        <ul className="flex flex-row md:flex-col gap-1 overflow-x-auto md:overflow-visible py-1 md:py-0 no-scrollbar">
                            {Object.keys(PERIOD_MAP).map(label => (
                                <li
                                    key={label}
                                    onClick={() => handlePresetClick(label)}
                                    className={`
                                        px-3 py-1.5 text-xs md:text-sm rounded-lg cursor-pointer whitespace-nowrap
                                        transition-colors text-muted-foreground hover:text-foreground hover:bg-accent
                                        ${displayLabel === label ? 'bg-primary/10 text-primary font-medium hover:bg-primary/15' : ''}
                                    `}
                                >
                                    {label}
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Права панель: Календар */}
                    <div className="p-3 flex justify-center items-center bg-white overflow-x-auto">
                        <Calendar
                            mode="range"
                            defaultMonth={dateRange?.from}
                            selected={dateRange}
                            onSelect={handleDateSelect}
                            numberOfMonths={isMobile ? 1 : 2}
                            locale={enUS}
                            className="p-0"
                            disabled={{ after: new Date() }}

                            modifiersClassNames={{
                                range_start: "bg-primary text-primary-foreground rounded-l-full rounded-r-none font-bold",
                                range_end: "bg-primary text-primary-foreground rounded-r-full rounded-l-none font-bold",
                                range_middle: "bg-primary/10 text-primary rounded-none font-normal hover:bg-primary/20",
                                selected: "bg-primary text-primary-foreground rounded-full"
                            }}
                        />
                    </div>
                </div>
            )}
        </div>
    )
}
"use client"

import * as React from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { DayPicker } from "react-day-picker"

import { cn } from "@/src/lib/utils"

export type CalendarProps = React.ComponentProps<typeof DayPicker>

function Calendar({
                      className,
                      classNames,
                      showOutsideDays = true,
                      ...props
                  }: CalendarProps) {
    return (
        <DayPicker
            showOutsideDays={showOutsideDays}
            // Додали 'relative' сюди, щоб абсолютне позиціювання стрілок працювало відносно цього блоку
            className={cn("p-4 bg-background relative", className)}
            classNames={{
                months: "flex flex-col sm:flex-row gap-4",
                month: "flex flex-col gap-3",
                month_caption: "flex justify-center pt-1 relative items-center h-9 mb-2",
                caption_label: "text-sm font-semibold tracking-tight",
                nav: "flex items-center",
                // Забрали кружечки (border-none, bg-transparent) і жорстко зафіксували зверху (top-5)
                button_previous: cn(
                    "absolute left-4 top-5 z-20 flex h-7 w-7 items-center justify-center bg-transparent border-none outline-none p-0 opacity-50 hover:opacity-100 transition-opacity cursor-pointer"
                ),
                button_next: cn(
                    "absolute right-4 top-5 z-20 flex h-7 w-7 items-center justify-center bg-transparent border-none outline-none p-0 opacity-50 hover:opacity-100 transition-opacity cursor-pointer"
                ),
                month_grid: "w-full border-collapse",
                weekdays: "flex justify-between",
                weekday: "text-muted-foreground rounded-md w-9 font-normal text-[0.75rem] flex-1 text-center",
                week: "flex w-full mt-2 justify-between",
                day: cn(
                    "h-8 w-8 p-0 font-normal text-[0.85rem] aria-selected:opacity-100 flex-1 text-center flex items-center justify-center rounded-md hover:bg-accent hover:text-accent-foreground transition-colors cursor-pointer"
                ),
                selected: "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
                today: "bg-accent text-accent-foreground font-bold",
                outside: "day-outside text-muted-foreground opacity-30",
                disabled: "text-muted-foreground opacity-50",
                hidden: "invisible",
                ...classNames,
            }}
            components={{
                Chevron: ({ orientation }) => {
                    return orientation === "left" ? (
                        <ChevronLeft className="h-5 w-5 stroke-[2px]" />
                    ) : (
                        <ChevronRight className="h-5 w-5 stroke-[2px]" />
                    )
                },
            }}
            {...props}
        />
    )
}
Calendar.displayName = "Calendar"

export { Calendar }
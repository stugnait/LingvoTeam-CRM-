"use client"

import { Bell, Search } from "lucide-react"
import { Button } from "@/src/components/ui/button"
import { Input } from "@/src/components/ui/input"

interface CrmHeaderProps {
    title: string
}

export function CrmHeader({ title }: CrmHeaderProps) {
    return (
        <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b border-border bg-white/80 backdrop-blur-xl px-6 animate-slide-down">
            {/* Page Title з градієнтом */}
            <h1 className="text-xl font-bold bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
                {title}
            </h1>

            {/* Spacer */}
            <div className="flex-1" />

            {/* Search з покращеним дизайном */}
            <div className="relative w-72 group">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-primary" />
                <Input
                    type="search"
                    placeholder="Пошук..."
                    className="w-full pl-10 pr-4 border-border focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-200"
                />
            </div>

            {/* Notifications з анімацією */}
            <Button
                variant="ghost"
                size="icon"
                className="relative hover:bg-accent hover:scale-105 transition-all duration-200 rounded-xl"
            >
                <Bell className="h-5 w-5" />
                <span className="absolute right-2 top-2 flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75"></span>
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-primary"></span>
                </span>
            </Button>

            {/* User Avatar з hover ефектом */}
            <Button
                variant="ghost"
                size="icon"
                className="rounded-full hover:scale-105 transition-all duration-200"
            >
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-primary to-blue-600 shadow-soft">
                    <span className="text-xs font-bold text-white">AD</span>
                </div>
            </Button>
        </header>
    )
}
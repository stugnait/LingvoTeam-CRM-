"use client"

import { Bell, Search } from "lucide-react"
import { Button } from "@/src/components/ui/button"
import { Input } from "@/src/components/ui/input"

interface CrmHeaderProps {
    title: string
}

export function CrmHeader({ title }: CrmHeaderProps) {
    return (
        <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b border-border bg-background px-6">
            {/* Page Title */}
            <h1 className="text-xl font-semibold text-foreground">{title}</h1>

            {/* Spacer */}
            <div className="flex-1" />

            {/* Search */}
            <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input type="search" placeholder="Search..." className="w-full pl-9 pr-4" />
            </div>

            {/* Notifications */}
            <Button variant="ghost" size="icon" className="relative">
                <Bell className="h-5 w-5" />
                <span className="absolute right-1 top-1 flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-destructive opacity-75"></span>
          <span className="relative inline-flex h-2 w-2 rounded-full bg-destructive"></span>
        </span>
            </Button>

            {/* User Avatar */}
            <Button variant="ghost" size="icon" className="rounded-full">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground">
                    <span className="text-xs font-medium">AD</span>
                </div>
            </Button>
        </header>
    )
}

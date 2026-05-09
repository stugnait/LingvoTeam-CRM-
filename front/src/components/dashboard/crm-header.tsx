"use client";

import { Bell, Search } from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { cn } from "@/src/lib/utils";

interface CrmHeaderProps {
    title: string;
    collapsed: boolean; // Залишаємо, щоб у вас не світилися помилки в інших файлах
}

export function CrmHeader({ title, collapsed }: CrmHeaderProps) {
    return (
        <header
            className={cn(
                // 1. ЗАМІНИЛИ fixed на sticky
                // 2. ДОДАЛИ w-full та shrink-0
                // 3. ПРИБРАЛИ left-20 та left-64 (вони більше не потрібні)
                "sticky top-0 z-40 flex w-full shrink-0 h-16 items-center gap-4 border-b border-border bg-white/80 backdrop-blur-xl px-6 transition-all duration-300 ease-in-out"
            )}
        >
            <h1 className="text-xl font-bold bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent overflow-hidden whitespace-nowrap">
                {title}
            </h1>

            {/* Spacer */}
            <div className="flex-1" />

            <div className="relative w-72 group hidden md:block">
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
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-primary to-blue-600 shadow-sm">
                    <span className="text-xs font-bold text-white">AD</span>
                </div>
            </Button>
        </header>
    );
}
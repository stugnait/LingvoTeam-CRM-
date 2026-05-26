"use client";

import { Bell, Search } from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { cn } from "@/src/lib/utils";

interface CrmHeaderProps {
    title: string;
    collapsed: boolean;
}

export function CrmHeader({ title, collapsed }: CrmHeaderProps) {
    return (
        <header
            className={cn(
                "sticky top-0 z-40 flex w-full shrink-0 flex-wrap h-auto min-h-14 sm:h-16 items-center gap-2 sm:gap-4 border-b border-border bg-white/80 backdrop-blur-xl px-3 sm:px-6 py-2 sm:py-0 transition-all duration-300 ease-in-out"
            )}
        >
            {/* Заголовок — додано pl-12 для мобілок, щоб уникнути накладання плаваючої кнопки */}
            <h1 className="text-base sm:text-xl font-bold bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent overflow-hidden whitespace-nowrap pl-12 lg:pl-0">
                {title}
            </h1>

            {/* Spacer */}
            <div className="flex-1" />

            {/* Пошук на десктопі */}
            <div className="relative w-56 sm:w-72 group hidden md:block">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-primary" />
                <Input
                    type="search"
                    placeholder="Пошук..."
                    className="w-full pl-10 pr-4 border-border focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-200"
                />
            </div>

            {/* Мобільна іконка пошуку */}
            <Button
                variant="ghost"
                size="icon"
                className="md:hidden relative hover:bg-accent hover:scale-105 transition-all duration-200 rounded-xl h-8 w-8 sm:h-9 sm:w-9"
                onClick={() => {
                    const el = document.getElementById('crm-mobile-search');
                    el?.classList.toggle('hidden');
                    el?.querySelector('input')?.focus();
                }}
            >
                <Search className="h-4 w-4" />
            </Button>

            {/* Notifications з анімацією */}
            <Button
                variant="ghost"
                size="icon"
                className="relative hover:bg-accent hover:scale-105 transition-all duration-200 rounded-xl h-8 w-8 sm:h-9 sm:w-9"
            >
                <Bell className="h-4 w-4 sm:h-5 sm:w-5" />
                <span className="absolute right-1.5 top-1.5 sm:right-2 sm:top-2 flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75"></span>
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-primary"></span>
                </span>
            </Button>

            {/* User Avatar з hover ефектом */}
            <Button
                variant="ghost"
                size="icon"
                className="rounded-full hover:scale-105 transition-all duration-200 h-8 w-8 sm:h-9 sm:w-9"
            >
                <div className="flex h-7 w-7 sm:h-9 sm:w-9 items-center justify-center rounded-full bg-gradient-to-br from-primary to-blue-600 shadow-sm">
                    <span className="text-[10px] sm:text-xs font-bold text-white">AD</span>
                </div>
            </Button>

            {/* Мобільний пошук — розгортається під хедером */}
            <div id="crm-mobile-search" className="hidden w-full pb-2 md:hidden">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                        type="search"
                        placeholder="Пошук..."
                        className="w-full pl-10 pr-4 border-border focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-200"
                    />
                </div>
            </div>
        </header>
    );
}
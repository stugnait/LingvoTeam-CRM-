'use client';

import React from 'react';
import { Search, RefreshCw, User, LogOut } from 'lucide-react';
import { useRouter } from "next/navigation";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger
} from "@/src/components/ui/dropdown-menu";
import { Button } from "@/src/components/ui/button";
import { useToast } from "@/src/hooks/use-toast";
import { NotificationsDropdown } from "@/src/features/notifications/components/NotificationsDropdown";
import { KanbanDeadlineFilter, type DeadlineFilter } from './KanbanDeadlineFilter';

interface KanbanHeaderProps {
    searchQuery: string;
    onSearchChange: (value: string) => void;
    isLoading: boolean;
    error: string | null;
    onRefresh: () => void;

    // Фільтр по дедлайну
    deadlineFilter: DeadlineFilter;
    onDeadlineFilterChange: (filter: DeadlineFilter) => void;
    allTasks: { deadline?: string }[];
}

const KanbanHeader: React.FC<KanbanHeaderProps> = ({
                                                       searchQuery,
                                                       onSearchChange,
                                                       isLoading,
                                                       error,
                                                       onRefresh,
                                                       deadlineFilter,
                                                       onDeadlineFilterChange,
                                                       allTasks,
                                                   }) => {
    const router = useRouter();
    const { toast } = useToast();

    const handleLogout = () => {
        toast({
            title: "Signed out",
            description: "You have been successfully signed out.",
        });
        router.push("/login");
    };

    const handleProfile = () => {
        router.push("/dashboard/profile");
    };

    return (
        <header className="sticky top-0 z-40 w-full bg-white/95 dark:bg-gray-950/95 backdrop-blur border-b border-gray-200 dark:border-gray-800">
            {/* Верхній рядок: заголовок + дії */}
            <div className="px-3 sm:px-6 py-2 sm:py-3">
                <div className="flex items-center justify-between gap-2 sm:gap-4">
                    {/* Ліва частина: Заголовок */}
                    <div className="min-w-0 flex-1">
                        <h1 className="text-base sm:text-xl font-bold text-gray-900 dark:text-white truncate">
                            Translation Orders
                        </h1>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 hidden sm:block">
                            Drag and drop to update status
                        </p>
                    </div>

                    {/* Права частина: Пошук + Дії + Акаунт */}
                    <div className="flex items-center gap-1.5 sm:gap-3">
                        {/* Пошук */}
                        <div className="relative hidden md:block">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                type="search"
                                placeholder="Search orders..."
                                value={searchQuery}
                                onChange={(e) => onSearchChange(e.target.value)}
                                className="pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg text-sm w-48 focus:w-64 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>

                        {/* Мобільний пошук — іконка */}
                        <div className="relative md:hidden">
                            <button
                                onClick={() => {
                                    const el = document.getElementById('mobile-search');
                                    el?.classList.toggle('hidden');
                                    el?.focus();
                                }}
                                className="w-8 h-8 flex items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-500"
                            >
                                <Search className="w-4 h-4" />
                            </button>
                        </div>

                        {/* Помилка (якщо є) */}
                        {error && (
                            <div className="hidden lg:block text-red-500 text-xs bg-red-50 dark:bg-red-900/20 px-3 py-1.5 rounded-md border border-red-100 dark:border-red-800">
                                {error}
                            </div>
                        )}

                        {/* Кнопка оновлення */}
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={onRefresh}
                            disabled={isLoading}
                            className="hidden sm:flex items-center gap-2"
                        >
                            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                            <span className="hidden lg:inline">
                                {isLoading ? 'Refreshing...' : 'Refresh'}
                            </span>
                        </Button>

                        {/* Мобільна кнопка refresh — тільки іконка */}
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={onRefresh}
                            disabled={isLoading}
                            className="sm:hidden w-8 h-8"
                        >
                            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                        </Button>

                        {/* Розділювач */}
                        <div className="h-6 w-[1px] bg-gray-200 dark:bg-gray-800 mx-0.5 sm:mx-1 hidden sm:block" />

                        {/* Повідомлення */}
                        <NotificationsDropdown />

                        {/* Акаунт */}
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="rounded-full hover:scale-105 transition-all duration-200"
                                >
                                    <div className="flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 shadow-sm">
                                        <span className="text-[10px] font-bold text-white">AD</span>
                                    </div>
                                </Button>
                            </DropdownMenuTrigger>

                            <DropdownMenuContent align="end" className="w-56 mt-2">
                                <DropdownMenuItem onClick={handleProfile} className="cursor-pointer">
                                    <User className="h-4 w-4 mr-2" />
                                    Profile
                                </DropdownMenuItem>

                                <DropdownMenuSeparator />

                                <DropdownMenuItem
                                    onClick={handleLogout}
                                    className="text-destructive cursor-pointer"
                                >
                                    <LogOut className="h-4 w-4 mr-2" />
                                    Sign Out
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>

                {/* Мобільний пошук — розгортається під рядком */}
                <div id="mobile-search" className="hidden mt-2 md:hidden">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            type="search"
                            placeholder="Search orders..."
                            value={searchQuery}
                            onChange={(e) => onSearchChange(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                    {error && (
                        <div className="mt-1.5 text-red-500 text-xs bg-red-50 dark:bg-red-900/20 px-3 py-1.5 rounded-md border border-red-100 dark:border-red-800">
                            {error}
                        </div>
                    )}
                </div>
            </div>

            {/* Нижній рядок: фільтр по дедлайну */}
            <KanbanDeadlineFilter
                active={deadlineFilter}
                onChange={onDeadlineFilterChange}
                tasks={allTasks}
            />
        </header>
    );
};

export default KanbanHeader;
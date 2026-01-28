// /components/kanban/KanbanHeader.tsx
'use client';

import React from 'react';
import { Search } from 'lucide-react';

interface KanbanHeaderProps {
    searchQuery: string;
    onSearchChange: (value: string) => void;
}

const KanbanHeader: React.FC<KanbanHeaderProps> = ({
                                                       searchQuery,
                                                       onSearchChange
                                                   }) => {
    return (
        <div className="sticky top-0 z-50 bg-white/95 dark:bg-gray-950/95 backdrop-blur border-b border-gray-200 dark:border-gray-800">
            <div className="px-6 py-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                            Kanban Board
                        </h1>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                            Drag and drop to organize your tasks
                        </p>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                type="search"
                                placeholder="Search tasks..."
                                value={searchQuery}
                                onChange={(e) => onSearchChange(e.target.value)}
                                className="pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg text-sm w-64 focus:w-80 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default KanbanHeader;
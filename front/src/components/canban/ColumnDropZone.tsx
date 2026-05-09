// /components/kanban/ColumnDropZone.tsx
'use client';

import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { Plus } from 'lucide-react';
import { cn } from '@/src/lib/utils';

interface ColumnDropZoneProps {
    columnId: string;
}

const ColumnDropZone: React.FC<ColumnDropZoneProps> = ({ columnId }) => {
    const { setNodeRef, isOver } = useDroppable({
        id: `dropzone-${columnId}`,
        data: {
            type: 'column',
            columnId
        }
    });

    return (
        <div
            ref={setNodeRef}
            className={cn(
                "min-h-[80px] rounded-lg border-2 border-dashed transition-all duration-200 my-2",
                isOver
                    ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                    : "border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-500"
            )}
        >
            <div className="flex flex-col items-center justify-center h-full text-center p-4">
                <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-2">
                    <Plus className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Drop tasks here</p>
            </div>
        </div>
    );
};

export default ColumnDropZone;
// /components/kanban/ColumnDropZone.tsx
'use client';

import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { Plus } from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { useI18n } from '@/src/shared/i18n/I18nProvider';

interface ColumnDropZoneProps {
    columnId: string;
}

const ColumnDropZone: React.FC<ColumnDropZoneProps> = ({ columnId }) => {
    const { t } = useI18n()
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
                "min-h-[80px] sm:min-h-[80px] min-h-[64px] rounded-lg border-2 border-dashed transition-all duration-200 my-2",
                isOver
                    ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                    : "border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-500"
            )}
        >
            <div className="flex flex-col items-center justify-center h-full text-center p-3 sm:p-4">
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-1.5 sm:mb-2">
                    <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-500 dark:text-gray-400" />
                </div>
                <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">{t("common.dropTasksHere")}</p>
            </div>
        </div>
    );
};

export default ColumnDropZone;

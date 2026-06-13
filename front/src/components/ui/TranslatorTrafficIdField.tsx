"use client"

import { Input } from "@/src/components/ui/input"
import { UserCheck, CheckCircle } from "lucide-react"
import { useI18n } from "@/src/shared/i18n/I18nProvider"

interface TranslatorTrafficIdFieldProps {
    value: string
}

export function TranslatorTrafficIdField({ value }: TranslatorTrafficIdFieldProps) {
    const { t } = useI18n()

    return (
        <div className="space-y-1.5">
            <label className="flex items-center gap-1.5 text-xs font-medium text-gray-700 dark:text-gray-300">
                <UserCheck className="h-3.5 w-3.5 text-blue-600" />
                <span>{t("translators.trafficId")}</span>
            </label>
            <div className="relative">
                <Input
                    placeholder={t("common.willBeSetAutomatically")}
                    value={value}
                    readOnly
                    className="h-9 text-sm px-3 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-800 rounded-lg text-gray-600 dark:text-gray-400 cursor-not-allowed pr-9"
                />
                {value && (
                    <CheckCircle className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-blue-600" />
                )}
            </div>
        </div>
    )
}

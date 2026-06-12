"use client"

import { useI18n } from "./I18nProvider"

interface LoadingFallbackProps {
    messageKey?: string
    className?: string
}

export function LoadingFallback({
    messageKey = "common.loading",
    className,
}: LoadingFallbackProps) {
    const { t } = useI18n()

    return <div className={className}>{t(messageKey)}</div>
}

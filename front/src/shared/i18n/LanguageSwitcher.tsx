"use client"

import { Languages } from "lucide-react"
import { Button } from "@/src/components/ui/button"
import { cn } from "@/src/lib/utils"
import { localeLabels, locales, type Locale } from "./messages"
import { useI18n } from "./I18nProvider"

const shortLabels: Record<Locale, string> = {
    uk: "UA",
    en: "EN",
}

export function LanguageSwitcher() {
    const { locale, setLocale, t } = useI18n()

    return (
        <div
            className="inline-flex h-9 items-center gap-1 rounded-xl border border-border bg-background/70 p-1 shadow-sm"
            role="group"
            aria-label={t("common.language")}
        >
            <Languages className="ml-2 h-4 w-4 text-muted-foreground" aria-hidden="true" />
            {locales.map((item) => {
                const active = item === locale

                return (
                    <Button
                        key={item}
                        type="button"
                        variant="ghost"
                        size="sm"
                        aria-label={localeLabels[item]}
                        aria-pressed={active}
                        title={localeLabels[item]}
                        onClick={() => setLocale(item)}
                        className={cn(
                            "h-7 min-w-9 rounded-lg px-2 text-xs font-bold",
                            active
                                ? "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground"
                                : "text-muted-foreground hover:text-foreground"
                        )}
                    >
                        {shortLabels[item]}
                    </Button>
                )
            })}
        </div>
    )
}

"use client"

import { Input } from "@/src/components/ui/input"
import { Search } from "lucide-react"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/src/components/ui/select"
import { useI18n } from "@/src/shared/i18n/I18nProvider"

interface Props {
    search: string
    setSearch: (value: string) => void

    ordering: string | null
    setOrdering: (value: "orders_count" | "-orders_count" | null) => void

    sourceLanguage: number | null
    setSourceLanguage: (value: number | null) => void

    targetLanguage: number | null
    setTargetLanguage: (value: number | null) => void

    // можна передати з API
    languages: { id: number; name: string }[]
}

export function TranslatorsFilters({
                                       search,
                                       setSearch,
                                       ordering,
                                       setOrdering,
                                       sourceLanguage,
                                       setSourceLanguage,
                                   targetLanguage,
                                   setTargetLanguage,
                                   languages,
                                   }: Props) {
    const { t } = useI18n()

    return (
        <div className="flex flex-col lg:flex-row gap-4">

            {/* 🔍 Search */}
            <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />

                <Input
                    placeholder={t("translators.searchPlaceholder")}
                    value={search}
                    onChange={(e) => {
                        setSearch(e.target.value)
                        // Скидаємо мовні фільтри при введенні імені
                        if (e.target.value) {
                            setSourceLanguage(null)
                            setTargetLanguage(null)
                        }
                    }}
                    className="pl-9"
                />
            </div>

            {/* 📊 Sorting */}
            <Select
                value={ordering ?? "default"}
                onValueChange={(val) => {
                    if (val === "-orders_count" || val === "orders_count") {
                        setOrdering(val)
                        return
                    }

                    setOrdering(null)
                }}
            >
                <SelectTrigger className="w-full lg:w-[200px]">
                    <SelectValue placeholder={t("common.sortBy")} />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="default">{t("common.default")}</SelectItem>
                    <SelectItem value="-orders_count">
                        {t("common.mostOrders")}
                    </SelectItem>
                    <SelectItem value="orders_count">
                        {t("common.leastOrders")}
                    </SelectItem>
                </SelectContent>
            </Select>

            {/* 🌐 Source Language */}
            <Select
                value={sourceLanguage?.toString() ?? "all"}
                onValueChange={(val) => {
                    setSourceLanguage(val === "all" ? null : Number(val))
                    setSearch("")  // скидаємо пошук
                }}
            >
                <SelectTrigger className="w-full lg:w-[200px]">
                    <SelectValue placeholder={t("common.sourceLanguage")} />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">{t("common.all")}</SelectItem>
                    {languages.map((lang) => (
                        <SelectItem key={lang.id} value={String(lang.id)}>
                            {lang.name}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>

            {/* 🌐 Target Language */}
            <Select
                value={targetLanguage?.toString() ?? "all"}
                onValueChange={(val) => {
                    setTargetLanguage(val === "all" ? null : Number(val))
                    setSearch("")
                }}
            >
                <SelectTrigger className="w-full lg:w-[200px]">
                    <SelectValue placeholder={t("common.targetLanguage")} />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">{t("common.all")}</SelectItem>
                    {languages.map((lang) => (
                        <SelectItem key={lang.id} value={String(lang.id)}>
                            {lang.name}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
    )
}

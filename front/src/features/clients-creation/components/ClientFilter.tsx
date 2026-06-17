"use client"

import { Input } from "@/src/components/ui/input"
import { Search } from "lucide-react"
import { useI18n } from "@/src/shared/i18n/I18nProvider"
import type { ClientCategory } from "../types"

interface Props {
    search: string
    setSearch: (value: string) => void
    categoryFilter: string
    setCategoryFilter: (value: string) => void
    categories: ClientCategory[]
}

export function ClientFilters({ search, setSearch, categoryFilter, setCategoryFilter, categories }: Props) {
    const { t } = useI18n()

    return (
        <div className="flex flex-col sm:flex-row gap-4 items-center">

            {/* Поле пошуку */}
            <div className="relative flex-1 w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                    placeholder={t("clients.searchPlaceholder") || "Пошук..."}
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-9 w-full"
                />
            </div>

            {/* Фільтр по категоріям */}
            <div className="w-full sm:w-[220px] shrink-0">
                <select
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    className="w-full h-10 px-3 py-2 rounded-md border border-input bg-background text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                    <option value="all">Всі категорії</option>
                    {categories?.map(cat => (
                        <option key={cat.id} value={String(cat.id)}>
                            {cat.name}
                        </option>
                    ))}
                </select>
            </div>

        </div>
    )
}
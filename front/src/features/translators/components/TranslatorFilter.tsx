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
    return (
        <div className="flex flex-col lg:flex-row gap-4">

            {/* 🔍 Search */}
            <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />

                <Input
                    placeholder="Search translators..."
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
                onValueChange={(val) =>
                    setOrdering(val === "default" ? null : (val as any))
                }
            >
                <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="default">Default</SelectItem>
                    <SelectItem value="-orders_count">
                        Most orders
                    </SelectItem>
                    <SelectItem value="orders_count">
                        Least orders
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
                <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Source language" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">All</SelectItem>
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
                <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Target language" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">All</SelectItem>
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
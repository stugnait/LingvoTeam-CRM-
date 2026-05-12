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
    setOrdering: (value: "orders_count" | "-orders_count" | "created_at" | "-created_at" | null) => void

    sourceLanguage: number | null
    setSourceLanguage: (value: number | null) => void

    targetLanguage: number | null
    setTargetLanguage: (value: number | null) => void

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

    const handleSearchChange = (value: string) => {
        setSearch(value)

        if (value.trim().length > 0) {
            setOrdering(null)
            setSourceLanguage(null)
            setTargetLanguage(null)
        }
    }

    return (
        <div className="flex flex-col lg:flex-row gap-4">

            {/* 🔍 Search */}
            <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />

                <Input
                    placeholder="Search translators..."
                    value={search}
                    onChange={(e) => handleSearchChange(e.target.value)}
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
                value={sourceLanguage !== null ? String(sourceLanguage) : "all"}
                onValueChange={(val) =>
                    setSourceLanguage(val === "all" ? null : Number(val))
                }
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
                value={targetLanguage !== null ? String(targetLanguage) : "all"}
                onValueChange={(val) =>
                    setTargetLanguage(val === "all" ? null : Number(val))
                }
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
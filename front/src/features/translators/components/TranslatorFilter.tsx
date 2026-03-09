"use client"

import { Input } from "@/src/components/ui/input"
import { Search } from "lucide-react"

interface Props {
    search: string
    setSearch: (value: string) => void
}

export function TranslatorsFilters({ search, setSearch }: Props) {
    return (
        <div className="flex flex-col sm:flex-row gap-4">

            <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />

                <Input
                    placeholder="Search translators..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-9"
                />
            </div>

        </div>
    )
}
"use client"

import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/src/components/ui/select"

import { Globe, Languages } from "lucide-react"

interface Language {
    id: number | string
    name: string
}

interface Props {
    label?: string
    value?: string
    onChange: (value: string) => void
    languages: Language[]
    searchable?: boolean
}

export function LanguageSelectorCompact({
                                            label,
                                            value,
                                            onChange,
                                            languages,
                                            searchable = true,
                                        }: Props) {

    return (
        <div className="space-y-3">
            {label && (
                <div className="flex items-center gap-2 text-base font-semibold text-muted-foreground">
                    <Languages className="w-5 h-5" />
                    <span>{label}</span>
                </div>
            )}

            <Select value={value} onValueChange={onChange}>
                <SelectTrigger className="h-14 text-base px-5 rounded-2xl">
                    <div className="flex items-center gap-3">
                        <SelectValue placeholder="Оберіть мову" />
                    </div>
                </SelectTrigger>

                <SelectContent
                    searchable={searchable}
                    searchPlaceholder="Пошук мови..."
                >
                    {languages.map((lang) => (
                        <SelectItem
                            key={lang.id}
                            value={String(lang.id)}
                            className="text-base"
                        >
                            <div className="flex items-center justify-between w-full h-14">
                                <div className="flex items-center gap-3">
                                    <Globe className="w-5 h-5 opacity-60" />
                                    <span className="font-medium">
                                        {lang.name}
                                    </span>
                                </div>
                            </div>
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
    )
}

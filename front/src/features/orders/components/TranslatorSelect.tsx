"use client"

import * as React from "react"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/src/components/ui/select"
import type { Translator } from "@/src/features/translators/types"

interface TranslatorSelectProps {
    translators: Translator[]
    value: number | null
    onChange: (value: number | null) => void
    disabled?: boolean
}

export function TranslatorSelect({
                                     translators,
                                     value,
                                     onChange,
                                     disabled,
                                 }: TranslatorSelectProps) {
    return (
        <Select
            value={value !== null ? value.toString() : undefined}
            onValueChange={(v) => onChange(Number(v))}
            disabled={disabled}
        >
            <SelectTrigger>
                <SelectValue placeholder="Select translator" />
            </SelectTrigger>

            <SelectContent>
                {translators.map((translator) => (
                    <SelectItem
                        key={translator.id}
                        value={translator.id.toString()}
                    >
                        {translator.full_name}
                    </SelectItem>
                ))}
            </SelectContent>
        </Select>
    )
}

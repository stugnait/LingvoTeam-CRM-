"use client"

import { Input } from "@/src/components/ui/input"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/src/components/ui/select"
import { Search } from "lucide-react"
import type { UsersFilters, RoleFilter } from "../types"
import { useI18n } from "@/src/shared/i18n/I18nProvider"

interface UserFiltersProps {
    filters: UsersFilters
    setFilters: (filters: UsersFilters) => void
}

export function UserFilters({ filters, setFilters }: UserFiltersProps) {
    const { t } = useI18n()

    return (
        <div className="flex flex-col sm:flex-row gap-4">

            {/* SEARCH */}
            <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />

                <Input
                    placeholder={t("users.searchPlaceholder")}
                    value={filters.search}
                    onChange={(e) =>
                        setFilters({
                            ...filters,
                            search: e.target.value
                        })
                    }
                    className="pl-9"
                />
            </div>

            {/* ROLE FILTER */}
            <Select
                value={filters.role}
                onValueChange={(value: RoleFilter) =>
                    setFilters({
                        ...filters,
                        role: value
                    })
                }
            >
                <SelectTrigger className="w-full sm:w-[180px]">
                    <SelectValue placeholder={t("users.allRoles")} />
                </SelectTrigger>

                <SelectContent>
                    <SelectItem value="all">{t("users.allRoles")}</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="manager">{t("common.manager")}</SelectItem>
                    <SelectItem value="editor">{t("common.editor")}</SelectItem>
                    <SelectItem value="financier">{t("common.finance")}</SelectItem>
                </SelectContent>
            </Select>

            {/* STATUS FILTER */}
            <Select
                value={
                    filters.status === null
                        ? "all"
                        : filters.status
                            ? "active"
                            : "inactive"
                }
                onValueChange={(value) =>
                    setFilters({
                        ...filters,
                        status:
                            value === "all"
                                ? null
                                : value === "active"
                    })
                }
            >
                <SelectTrigger className="w-full sm:w-[180px]">
                    <SelectValue placeholder={t("users.allStatuses")} />
                </SelectTrigger>

                <SelectContent>
                    <SelectItem value="all">{t("users.allStatuses")}</SelectItem>
                    <SelectItem value="active">{t("common.active")}</SelectItem>
                    <SelectItem value="inactive">{t("common.inactive")}</SelectItem>
                </SelectContent>
            </Select>

        </div>
    )
}

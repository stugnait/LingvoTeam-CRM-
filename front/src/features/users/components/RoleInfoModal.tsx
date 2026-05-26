"use client"

import { useState, useMemo, useEffect } from "react"
import { Shield, Check } from "lucide-react"
import { Dialog, DialogContent, DialogTitle } from "@/src/components/ui/dialog"
import { Button } from "@/src/components/ui/button"
import { cn } from "@/src/lib/utils"
import type { Permission, Role } from "../types"

// Спільний словник залишаємо тут, щоб не створювати зайвих файлів
export const GROUP_LABELS: Record<string, string> = {
    user:       "👤 Користувачі",
    role:       "🔐 Ролі та Доступи",
    order:      "📦 Замовлення",
    client:     "🤝 Клієнти",
    language:   "🌐 Мови",
    currency:   "💱 Валюти",
    translator: "✍️ Перекладачі",
    statistic:  "📊 Статистика",
    salary:     "💰 Зарплати",
}

interface RoleInfoModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    roleData: Role | null
}

export function RoleInfoModal({ open, onOpenChange, roleData }: RoleInfoModalProps) {
    const [roleInfoTab, setRoleInfoTab] = useState<string>("")

    const rolePermissionGroups = useMemo(() => {
        if (!roleData) {return {}}
        const perms = roleData.permissions || []
        return perms.reduce<Record<string, Permission[]>>((acc, perm) => {
            const group = perm.slug.split(".")[0]
            if (!acc[group]) { acc[group] = [] }
            acc[group].push(perm)
            return acc
        }, {})
    }, [roleData])

    useEffect(() => {
        if (open) {
            const groups = Object.keys(rolePermissionGroups)
            if (groups.length > 0) setRoleInfoTab(groups[0])
        }
    }, [open, rolePermissionGroups])

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="p-0 gap-0 max-w-2xl w-[95vw] sm:w-full h-[90vh] sm:h-[500px] flex flex-col overflow-hidden">
                <div className="px-6 pt-5 pb-4 border-b shrink-0">
                    <div className="flex items-center gap-2">
                        <Shield className="h-5 w-5 text-primary" />
                        <DialogTitle className="text-base">
                            {roleData?.name ?? "Роль"}
                        </DialogTitle>
                    </div>
                    <p className="text-sm text-muted-foreground mt-0.5">
                        {roleData?.permissions?.length ?? 0} прав доступу
                    </p>
                </div>

                <div className="flex flex-1 overflow-hidden">
                    <div className="w-36 sm:w-48 shrink-0 border-r bg-muted/30 overflow-y-auto py-3">
                        <p className="px-4 pb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                            Категорії
                        </p>
                        {Object.keys(rolePermissionGroups).length === 0 && (
                            <p className="px-4 text-sm text-muted-foreground">Немає прав</p>
                        )}
                        {Object.keys(rolePermissionGroups).map(group => (
                            <button
                                key={group}
                                onClick={() => setRoleInfoTab(group)}
                                className={cn(
                                    "w-full flex items-center justify-between px-3 sm:px-4 py-2 text-xs sm:text-sm transition-colors",
                                    roleInfoTab === group
                                        ? "bg-primary/10 text-primary font-medium"
                                        : "hover:bg-muted text-foreground"
                                )}
                            >
                                <span>{GROUP_LABELS[group] ?? group}</span>
                                <span className="text-xs bg-primary text-primary-foreground rounded-full px-1.5 py-0.5 leading-none">
                                    {rolePermissionGroups[group].length}
                                </span>
                            </button>
                        ))}
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 space-y-1.5">
                        <p className="text-sm font-semibold mb-3">
                            {GROUP_LABELS[roleInfoTab] ?? roleInfoTab}
                        </p>
                        {(rolePermissionGroups[roleInfoTab] ?? []).map((perm: Permission) => (
                            <div
                                key={perm.id}
                                className="flex items-center gap-3 px-4 py-2.5 rounded-lg border border-primary/20 bg-primary/5"
                            >
                                <span className="h-5 w-5 rounded bg-primary flex items-center justify-center shrink-0">
                                    <Check className="h-3 w-3 text-primary-foreground" />
                                </span>
                                <span className="text-sm">{perm.name}</span>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="px-6 py-3 border-t shrink-0 flex justify-end bg-background">
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        Закрити
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    )
}
"use client"

import { Button } from "@/src/components/ui/button"
import { Input } from "@/src/components/ui/input"
import { Dialog, DialogContent } from "@/src/components/ui/dialog"
import { Plus, Trash2, ChevronRight, Shield, Check } from "lucide-react"
import { useRoles } from "../hooks/useRoles"
import type { Permission } from "../types"
import { cn } from "@/src/lib/utils"

// Імпортуємо словник, щоб він був спільним
import { GROUP_LABELS } from "./RoleInfoModal"

export function RolesPage() {
    const {
        roles,
        permissionGroups,
        loading,
        isModalOpen,
        selectedRole,
        form,
        setForm,
        activeTab,
        setActiveTab,
        openCreate,
        openEdit,
        closeModal,
        togglePermission,
        toggleGroup,
        submitRole,
        removeRole,
    } = useRoles()

    return (
        <div className="mx-auto max-w-4xl space-y-6 p-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Ролі</h2>
                    <p className="text-muted-foreground">Керування ролями та їх правами доступу</p>
                </div>
                <Button onClick={openCreate}>
                    <Plus className="h-4 w-4 mr-2" />
                    Створити роль
                </Button>
            </div>

            <div className="rounded-lg border divide-y">
                {loading && (
                    <div className="p-6 text-center text-muted-foreground">Завантаження...</div>
                )}
                {!loading && roles.length === 0 && (
                    <div className="p-6 text-center text-muted-foreground">Ролей ще немає</div>
                )}
                {roles.map(role => (
                    <div
                        key={role.id}
                        className="flex items-center justify-between px-5 py-4 hover:bg-muted/40 transition-colors"
                    >
                        <div className="flex items-center gap-3">
                            <Shield className="h-5 w-5 text-primary" />
                            <div>
                                <p className="font-medium">{role.name}</p>
                                <p className="text-xs text-muted-foreground">
                                    {role.permissions.length} прав
                                    {role.permissions.length > 0 && (
                                        <span className="ml-2 opacity-60">
                                            {role.permissions.slice(0, 3).map(p => p.name).join(", ")}
                                            {role.permissions.length > 3 && "..."}
                                        </span>
                                    )}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => openEdit(role)}
                            >
                                Редагувати
                                <ChevronRight className="h-4 w-4 ml-1" />
                            </Button>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                onClick={() => removeRole(role.id)}
                            >
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                ))}
            </div>

            <Dialog open={isModalOpen} onOpenChange={open => !open && closeModal()}>
                <DialogContent className="p-0 gap-0 max-w-3xl h-[580px] flex flex-col overflow-hidden">
                    <div className="px-6 pt-6 pb-4 border-b shrink-0">
                        <h2 className="text-lg font-semibold">
                            {selectedRole ? `Редагувати роль — ${selectedRole.name}` : "Нова роль"}
                        </h2>
                        <p className="text-sm text-muted-foreground mt-0.5">
                            Налаштуй назву та права доступу
                        </p>
                    </div>

                    <div className="flex flex-1 overflow-hidden">
                        <div className="w-52 shrink-0 border-r bg-muted/30 overflow-y-auto py-3">
                            <p className="px-4 pb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                Категорії
                            </p>
                            {Object.keys(permissionGroups).map(group => {
                                const groupPerms = permissionGroups[group]
                                const selectedCount = groupPerms.filter(p =>
                                    form.permission_ids.includes(p.id)
                                ).length

                                return (
                                    <button
                                        key={group}
                                        onClick={() => setActiveTab(group)}
                                        className={cn(
                                            "w-full flex items-center justify-between px-4 py-2 text-sm rounded-none transition-colors",
                                            activeTab === group
                                                ? "bg-primary/10 text-primary font-medium"
                                                : "hover:bg-muted text-foreground"
                                        )}
                                    >
                                        <span>{GROUP_LABELS[group] ?? group}</span>
                                        {selectedCount > 0 && (
                                            <span className="text-xs bg-primary text-primary-foreground rounded-full px-1.5 py-0.5 leading-none">
                                                {selectedCount}
                                            </span>
                                        )}
                                    </button>
                                )
                            })}
                        </div>

                        <div className="flex-1 overflow-y-auto p-5 space-y-5">
                            {activeTab === Object.keys(permissionGroups)[0] && (
                                <div className="space-y-3 pb-4 border-b">
                                    <div>
                                        <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-1.5">
                                            Назва ролі
                                        </label>
                                        <Input
                                            placeholder="Наприклад: Старший менеджер"
                                            value={form.name}
                                            onChange={e => setForm(prev => ({ ...prev, name: e.target.value }))}
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-1.5">
                                            Slug <span className="normal-case font-normal">(необов'язково)</span>
                                        </label>
                                        <Input
                                            placeholder="senior_manager"
                                            value={form.slug}
                                            onChange={e => setForm(prev => ({ ...prev, slug: e.target.value }))}
                                        />
                                    </div>
                                </div>
                            )}

                            {activeTab && permissionGroups[activeTab] && (
                                <div className="space-y-1">
                                    <div className="flex items-center justify-between mb-3">
                                        <p className="text-sm font-semibold">
                                            {GROUP_LABELS[activeTab] ?? activeTab}
                                        </p>
                                        <button
                                            onClick={() => toggleGroup(permissionGroups[activeTab])}
                                            className="text-xs text-primary hover:underline"
                                        >
                                            {permissionGroups[activeTab].every(p =>
                                                form.permission_ids.includes(p.id)
                                            ) ? "Зняти всі" : "Вибрати всі"}
                                        </button>
                                    </div>
                                    {permissionGroups[activeTab].map((perm: Permission) => {
                                        const checked = form.permission_ids.includes(perm.id)
                                        return (
                                            <button
                                                key={perm.id}
                                                onClick={() => togglePermission(perm.id)}
                                                className={cn(
                                                    "w-full flex items-center justify-between px-4 py-3 rounded-lg border text-sm transition-all",
                                                    checked
                                                        ? "border-primary/40 bg-primary/5 text-foreground"
                                                        : "border-transparent hover:bg-muted text-muted-foreground"
                                                )}
                                            >
                                                <span>{perm.name}</span>
                                                <span className={cn(
                                                    "h-5 w-5 rounded border-2 flex items-center justify-center shrink-0 transition-colors",
                                                    checked
                                                        ? "bg-primary border-primary text-primary-foreground"
                                                        : "border-muted-foreground/40"
                                                )}>
                                                    {checked && <Check className="h-3 w-3" />}
                                                </span>
                                            </button>
                                        )
                                    })}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="px-6 py-4 border-t shrink-0 flex items-center justify-between bg-background">
                        <p className="text-sm text-muted-foreground">
                            Вибрано прав: <span className="font-medium text-foreground">{form.permission_ids.length}</span>
                        </p>
                        <div className="flex gap-2">
                            <Button variant="outline" onClick={closeModal}>Скасувати</Button>
                            <Button onClick={submitRole}>
                                {selectedRole ? "Зберегти зміни" : "Створити роль"}
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    )
}
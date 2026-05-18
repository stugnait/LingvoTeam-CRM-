"use client"

import { useMemo, useState } from "react"
import { Button } from "@/src/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/src/components/ui/card"
import { Plus, Upload, User as UserIcon, Info, Users, Shield, ChevronRight, Trash2, Check } from "lucide-react"
import { PatternFormat } from 'react-number-format'
import { cn } from "@/src/lib/utils"

import { UserTable } from "./UserTable"
import { UserFilters } from "./UserFilter"
import { useUsers } from "../hooks/useUsers"
import { TAB_PRESETS, useRoles } from "../hooks/useRoles"

import { BaseFormModal } from "@/src/components/modals/BaseFormModal"
import { ConfirmModal } from "@/src/components/modals/ConfirmModal"
import { Input } from "@/src/components/ui/input"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/src/components/ui/select"
import { DashboardHeader } from "@/src/shared/components/layout/DashboardHeader"
import { Dialog, DialogContent } from "@/src/components/ui/dialog"

// Імпорт модалки для перегляду прав (read-only)
import { RoleInfoModal } from "./RoleInfoModal"
import type { Permission } from "../types"

export function UsersPage() {
    // === СТАН ДЛЯ ПЕРЕМИКАННЯ РЕЖИМІВ ===
    const [viewMode, setViewMode] = useState<"users" | "roles">("users")

    // === КОРИСТУВАЧІ ===
    const {
        users, page, totalPages, onPageChange, filters, setFilters,
        roles: dropdownRoles,
        isFormOpen, isDeleteOpen, selectedUser, form, setForm, errors,
        openAddUser, openEditUser, openDeleteUser, openDeactivateUser,
        submitUser, handleConfirm, confirmAction, closeModals, resetPassword,
    } = useUsers()

    // === РОЛІ ===
    const {
        roles, permissions, loading: rolesLoading,
        isModalOpen: isRoleModalOpen, selectedRole,
        form: roleForm, setForm: setRoleForm,
        openCreate: openCreateRole, openEdit: openEditRole,
        closeModal: closeRoleModal, toggleGroup,
        submitRole, removeRole
    } = useRoles()

    // --- Допоміжні стани для користувачів ---
    const avatarPreview = useMemo(() => {
        if (!form.avatar) { return null }
        if (typeof form.avatar === 'string') { return form.avatar }
        if (form.avatar instanceof File) { return URL.createObjectURL(form.avatar) }
        return null
    }, [form.avatar])

    const [roleInfoOpen, setRoleInfoOpen] = useState(false)
    const selectedRoleDataForView = (dropdownRoles || []).find(r => r.id === form.role) ?? null

    return (
        <>
            <DashboardHeader />

            <main className="flex-1 overflow-y-auto p-6">
                <div className="mx-auto max-w-6xl space-y-6">

                    {/* Page Header */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div>
                            <h2 className="text-2xl font-bold tracking-tight">
                                {viewMode === "users" ? "Користувачі" : "Ролі"}
                            </h2>
                            <p className="text-muted-foreground">
                                {viewMode === "users"
                                    ? "Управління обліковими записами користувачів"
                                    : "Керування ролями та модулями доступу"}
                            </p>
                        </div>

                        {/* Перемикач та Кнопка додавання */}
                        <div className="flex items-center gap-4">
                            {/* СВІТЧ */}
                            <div className="flex bg-gray-100 dark:bg-gray-800 p-1 rounded-lg">
                                <button
                                    onClick={() => setViewMode("users")}
                                    className={cn(
                                        "flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all",
                                        viewMode === "users"
                                            ? "bg-white dark:bg-gray-700 shadow-sm text-blue-600 dark:text-blue-400"
                                            : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                                    )}
                                >
                                    <Users className="w-4 h-4" />
                                    Користувачі
                                </button>
                                <button
                                    onClick={() => setViewMode("roles")}
                                    className={cn(
                                        "flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all",
                                        viewMode === "roles"
                                            ? "bg-white dark:bg-gray-700 shadow-sm text-blue-600 dark:text-blue-400"
                                            : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                                    )}
                                >
                                    <Shield className="w-4 h-4" />
                                    Ролі
                                </button>
                            </div>

                            {/* Динамічна кнопка */}
                            <Button onClick={viewMode === "users" ? openAddUser : openCreateRole}>
                                <Plus className="h-4 w-4 mr-2" />
                                {viewMode === "users" ? "Додати юзера" : "Створити роль"}
                            </Button>
                        </div>
                    </div>

                    {/* Фільтри показуємо тільки для юзерів */}
                    {viewMode === "users" && (
                        <Card>
                            <CardHeader>
                                <CardTitle>Фільтри</CardTitle>
                                <CardDescription>Пошук та фільтрація користувачів</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <UserFilters filters={filters} setFilters={setFilters} />
                            </CardContent>
                        </Card>
                    )}

                    {/* Table Card */}
                    <Card>
                        <CardHeader>
                            <CardTitle>
                                {viewMode === "users" ? "Список користувачів" : "Список ролей"}
                            </CardTitle>
                            <CardDescription>
                                Всі зареєстровані {viewMode === "users" ? "користувачі" : "ролі"} в системі
                            </CardDescription>
                        </CardHeader>

                        <CardContent className="p-0">
                            {viewMode === "users" ? (
                                <UserTable
                                    users={users}
                                    onEdit={openEditUser}
                                    onDelete={(id) => {
                                        const user = users.find(u => u.id === id)
                                        if (user) { openDeleteUser(user) }
                                    }}
                                    onDeactivate={openDeactivateUser}
                                    page={page}
                                    totalPages={totalPages}
                                    onPageChange={onPageChange}
                                    onResetPassword={resetPassword}
                                />
                            ) : (
                                <div className="divide-y border-t">
                                    {rolesLoading && (
                                        <div className="p-6 text-center text-muted-foreground">Завантаження...</div>
                                    )}
                                    {!rolesLoading && roles.length === 0 && (
                                        <div className="p-6 text-center text-muted-foreground">Ролей ще немає</div>
                                    )}
                                    {roles.map(role => (
                                        <div
                                            key={role.id}
                                            className="flex items-center justify-between px-6 py-4 hover:bg-muted/40 transition-colors"
                                        >
                                            <div className="flex items-center gap-3">
                                                <Shield className="h-5 w-5 text-primary" />
                                                <div>
                                                    <p className="font-medium">{role.name}</p>
                                                    <p className="text-xs text-muted-foreground">
                                                        {role.permissions.length} прав
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Button variant="ghost" size="sm" onClick={() => openEditRole(role)}>
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
                            )}
                        </CardContent>
                    </Card>
                </div>
            </main>

            {/* =============================
                МОДАЛКИ ДЛЯ КОРИСТУВАЧІВ
            ============================= */}
            <BaseFormModal
                open={isFormOpen}
                onOpenChange={(open) => !open && closeModals()}
                title={selectedUser ? "Edit User" : "Add User"}
                submitLabel={selectedUser ? "Update" : "Create"}
                onSubmit={() => submitUser(form)}
            >
                <div className="space-y-6">
                    <div className="flex flex-col items-center gap-4">
                        <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-full border bg-muted flex items-center justify-center">
                            {avatarPreview ? (
                                <img src={avatarPreview} alt="Avatar preview" className="h-full w-full object-cover" />
                            ) : (
                                <UserIcon className="h-10 w-10 text-muted-foreground" />
                            )}
                        </div>
                        <div className="flex items-center gap-2">
                            <Input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                id="avatar-upload"
                                onChange={(e) => {
                                    const file = e.target.files?.[0]
                                    if (file) { setForm(prev => ({ ...prev, avatar: file })) }
                                    e.target.value = ""
                                }}
                            />
                            <Button asChild variant="outline" size="sm">
                                <label htmlFor="avatar-upload" className="cursor-pointer">
                                    <Upload className="h-4 w-4 mr-2" />
                                    Upload Avatar
                                </label>
                            </Button>
                            {form.avatar && (
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                    onClick={() => setForm(prev => ({ ...prev, avatar: null }))}
                                >
                                    Remove
                                </Button>
                            )}
                        </div>
                    </div>

                    <Input
                        placeholder="Full name"
                        value={form.full_name}
                        onChange={(e) => setForm(prev => ({ ...prev, full_name: e.target.value }))}
                    />
                    {errors.full_name && <p className="text-xs text-destructive -mt-4">{errors.full_name}</p>}

                    <Input
                        placeholder="Email"
                        value={form.email}
                        onChange={(e) => setForm(prev => ({ ...prev, email: e.target.value }))}
                    />
                    {errors.email && <p className="text-xs text-destructive -mt-4">{errors.email}</p>}

                    <PatternFormat
                        format="+38 (###) ###-##-##"
                        allowEmptyFormatting
                        mask="_"
                        value={form.phone}
                        customInput={Input}
                        type="tel"
                        onValueChange={(values) => setForm(prev => ({ ...prev, phone: values.formattedValue }))}
                    />
                    {errors.phone && <p className="text-xs text-destructive -mt-4">{errors.phone}</p>}

                    <div className="flex items-center gap-2">
                        <Select
                            value={String(form.role || "")}
                            onValueChange={(value) => setForm(prev => ({ ...prev, role: Number(value) }))}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Select role" />
                            </SelectTrigger>
                            <SelectContent>
                                {(dropdownRoles || []).map(role => (
                                    <SelectItem key={role.id} value={String(role.id)}>
                                        {role.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            disabled={!form.role || !selectedRoleDataForView}
                            onClick={() => setRoleInfoOpen(true)}
                            title="Переглянути права ролі"
                        >
                            <Info className="h-4 w-4" />
                        </Button>
                    </div>
                    {errors.role && <p className="text-xs text-destructive -mt-4">{errors.role}</p>}
                </div>
            </BaseFormModal>

            {/* Read-only модалка для перегляду прав (зі словником) */}
            <RoleInfoModal
                open={roleInfoOpen}
                onOpenChange={setRoleInfoOpen}
                roleData={selectedRoleDataForView as any}
            />

            <ConfirmModal
                open={isDeleteOpen}
                onOpenChange={(open) => !open && closeModals()}
                title={confirmAction === "delete" ? "Delete user" : "Deactivate user"}
                description={
                    confirmAction === "delete"
                        ? `Are you sure you want to delete ${selectedUser?.full_name}? This action cannot be undone.`
                        : `Are you sure you want to deactivate ${selectedUser?.full_name}? The user will lose access to the system.`
                }
                confirmLabel={confirmAction === "delete" ? "Delete" : "Deactivate"}
                onConfirm={handleConfirm}
            />

            {/* =============================
                НОВА СПРОЩЕНА МОДАЛКА ДЛЯ РОЛЕЙ
            ============================= */}
            <Dialog open={isRoleModalOpen} onOpenChange={open => !open && closeRoleModal()}>
                <DialogContent className="p-0 gap-0 max-w-3xl h-[650px] flex flex-col overflow-hidden bg-background">

                    {/* Хедер та Загальна інформація */}
                    <div className="px-6 pt-6 pb-5 border-b shrink-0 bg-background z-10 space-y-5">
                        <div>
                            <h2 className="text-xl font-semibold">
                                {selectedRole ? `Редагування ролі: ${selectedRole.name}` : "Створення нової ролі"}
                            </h2>
                            <p className="text-sm text-muted-foreground mt-1">
                                Вкажіть назву ролі та оберіть модулі, до яких ця роль матиме доступ.
                            </p>
                        </div>

                        <div className="grid grid-cols-2 gap-6">
                            <div>
                                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-2">
                                    Назва ролі <span className="text-destructive">*</span>
                                </label>
                                <Input
                                    placeholder="Наприклад: Старший менеджер"
                                    value={roleForm.name}
                                    onChange={e => setRoleForm(prev => ({ ...prev, name: e.target.value }))}
                                    className="bg-muted/30"
                                />
                            </div>
                            <div>
                                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-2">
                                    Slug <span className="normal-case font-normal">(опціонально)</span>
                                </label>
                                <Input
                                    placeholder="senior_manager"
                                    value={roleForm.slug}
                                    onChange={e => setRoleForm(prev => ({ ...prev, slug: e.target.value }))}
                                    className="bg-muted/30"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Робоча область - Сітка модулів */}
                    <div className="flex-1 overflow-y-auto p-6 bg-muted/10">
                        <div className="mb-4 flex items-center justify-between">
                            <h3 className="text-sm font-semibold text-foreground">Доступні модулі</h3>
                            <span className="text-xs text-muted-foreground">Виберіть потрібні для підключення</span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {Object.entries(TAB_PRESETS).map(([tabKey, preset]) => {
                                // Знаходимо пермішини, які відповідають цьому модулю
                                const tabPerms = permissions.filter(p => preset.slugs.includes(p.slug))
                                const totalCount = tabPerms.length

                                // Перевіряємо, чи всі доступні пермішини цього модуля вже вибрані
                                const isSelected = totalCount > 0 && tabPerms.every(p => roleForm.permission_ids.includes(p.id))

                                return (
                                    <button
                                        key={tabKey}
                                        type="button"
                                        onClick={() => toggleGroup(tabPerms)}
                                        disabled={totalCount === 0}
                                        className={cn(
                                            "flex items-center justify-between p-4 rounded-xl border text-left transition-all",
                                            isSelected
                                                ? "border-primary bg-primary/5 shadow-sm"
                                                : "border-border bg-background hover:border-primary/40",
                                            totalCount === 0 && "opacity-50 cursor-not-allowed grayscale"
                                        )}
                                    >
                                        <div className="flex items-center gap-3">
                                            <span className="text-2xl">{preset.icon}</span>
                                            <div>
                                                <h4 className={cn("font-medium", isSelected ? "text-primary" : "text-foreground")}>
                                                    {preset.label}
                                                </h4>
                                                <p className="text-xs text-muted-foreground mt-0.5">
                                                    {totalCount > 0 ? `${totalCount} внутрішніх прав` : "Немає прав в базі"}
                                                </p>
                                            </div>
                                        </div>
                                        <div className={cn(
                                            "h-5 w-5 rounded border flex items-center justify-center shrink-0 transition-all",
                                            isSelected
                                                ? "bg-primary border-primary text-primary-foreground"
                                                : "border-input bg-muted/50"
                                        )}>
                                            {isSelected && <Check className="h-3.5 w-3.5" />}
                                        </div>
                                    </button>
                                )
                            })}
                        </div>
                    </div>

                    {/* Футер */}
                    <div className="px-6 py-4 border-t shrink-0 flex items-center justify-between bg-background">
                        <p className="text-sm text-muted-foreground">
                            Загалом приховано прав у вибраних модулях: <span className="font-semibold text-foreground px-1">{roleForm.permission_ids.length}</span>
                        </p>
                        <div className="flex gap-3">
                            <Button variant="outline" onClick={closeRoleModal}>Скасувати</Button>
                            <Button onClick={submitRole}>
                                {selectedRole ? "Зберегти зміни" : "Створити роль"}
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    )
}
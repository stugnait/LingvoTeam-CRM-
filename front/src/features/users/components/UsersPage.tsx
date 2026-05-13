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
import { useRoles } from "../hooks/useRoles"

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
import { RoleInfoModal, GROUP_LABELS } from "./RoleInfoModal"
import type { Permission } from "../types"

export function UsersPage() {
    // === СТАН ДЛЯ ПЕРЕМИКАННЯ РЕЖИМІВ ===
    const [viewMode, setViewMode] = useState<"users" | "roles">("users")

    // === КОРИСТУВАЧІ ===
    const {
        users, page, totalPages, onPageChange, filters, setFilters,
        roles: dropdownRoles, // Аліас для ролей з хука користувачів (для селекта)
        isFormOpen, isDeleteOpen, selectedUser, form, setForm, errors,
        openAddUser, openEditUser, openDeleteUser, openDeactivateUser,
        submitUser, handleConfirm, confirmAction, closeModals, resetPassword,
    } = useUsers()

    // === РОЛІ (використовуємо аліаси) ===
    const {
        roles, permissionGroups, loading: rolesLoading,
        isModalOpen: isRoleModalOpen, selectedRole,
        form: roleForm, setForm: setRoleForm,
        activeTab: roleActiveTab, setActiveTab: setRoleActiveTab,
        openCreate: openCreateRole, openEdit: openEditRole,
        closeModal: closeRoleModal, togglePermission, toggleGroup,
        submitRole, removeRole,
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
                                    : "Керування ролями та їх правами доступу"}
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
                МОДАЛКА ДЛЯ РОЛЕЙ (Редагування/Створення)
            ============================= */}
            <Dialog open={isRoleModalOpen} onOpenChange={open => !open && closeRoleModal()}>
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
                                    roleForm.permission_ids.includes(p.id)
                                ).length

                                return (
                                    <button
                                        key={group}
                                        onClick={() => setRoleActiveTab(group)}
                                        className={cn(
                                            "w-full flex items-center justify-between px-4 py-2 text-sm rounded-none transition-colors",
                                            roleActiveTab === group
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
                            {roleActiveTab === Object.keys(permissionGroups)[0] && (
                                <div className="space-y-3 pb-4 border-b">
                                    <div>
                                        <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-1.5">
                                            Назва ролі
                                        </label>
                                        <Input
                                            placeholder="Наприклад: Старший менеджер"
                                            value={roleForm.name}
                                            onChange={e => setRoleForm(prev => ({ ...prev, name: e.target.value }))}
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-1.5">
                                            Slug <span className="normal-case font-normal">(необов&#39;язково)</span>
                                        </label>
                                        <Input
                                            placeholder="senior_manager"
                                            value={roleForm.slug}
                                            onChange={e => setRoleForm(prev => ({ ...prev, slug: e.target.value }))}
                                        />
                                    </div>
                                </div>
                            )}

                            {roleActiveTab && permissionGroups[roleActiveTab] && (
                                <div className="space-y-1">
                                    <div className="flex items-center justify-between mb-3">
                                        <p className="text-sm font-semibold">
                                            {GROUP_LABELS[roleActiveTab] ?? roleActiveTab}
                                        </p>
                                        <button
                                            onClick={() => toggleGroup(permissionGroups[roleActiveTab])}
                                            className="text-xs text-primary hover:underline"
                                        >
                                            {permissionGroups[roleActiveTab].every(p =>
                                                roleForm.permission_ids.includes(p.id)
                                            ) ? "Зняти всі" : "Вибрати всі"}
                                        </button>
                                    </div>
                                    {permissionGroups[roleActiveTab].map((perm: Permission) => {
                                        const checked = roleForm.permission_ids.includes(perm.id)
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
                            Вибрано прав: <span className="font-medium text-foreground">{roleForm.permission_ids.length}</span>
                        </p>
                        <div className="flex gap-2">
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
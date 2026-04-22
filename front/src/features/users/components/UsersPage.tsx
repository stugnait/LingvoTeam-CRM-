"use client"

import { useMemo } from "react"
import { Button } from "@/src/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/src/components/ui/card"
import { Plus, Upload, User as UserIcon } from "lucide-react"

import { UserTable } from "./UserTable"
import { UserFilters } from "./UserFilter"
import { useUsers } from "../hooks/useUsers"

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

export function UsersPage() {
    const {
        users,
        page,
        totalPages,
        onPageChange,
        filters,
        setFilters,

        isFormOpen,
        isDeleteOpen,
        selectedUser,
        form,
        setForm,
        errors,

        openAddUser,
        openEditUser,
        openDeleteUser,
        openDeactivateUser,

        submitUser,
        handleConfirm,
        confirmAction,
        closeModals,
    } = useUsers()

    // 👇 Генеруємо посилання для прев'ю аватарки (щоб бачити картинку до відправки на сервер)
    const avatarPreview = useMemo(() => {
        if (!form.avatar) {return null}
        if (typeof form.avatar === 'string') {return form.avatar}
        if (form.avatar instanceof File) {return URL.createObjectURL(form.avatar)}
        return null
    }, [form.avatar])

    return (
        <>
            <DashboardHeader />

            <main className="flex-1 overflow-y-auto p-6">
                <div className="mx-auto max-w-6xl space-y-6">
                    {/* Page Header */}
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-2xl font-bold tracking-tight">
                                Users
                            </h2>
                            <p className="text-muted-foreground">
                                Manage user accounts and permissions
                            </p>
                        </div>

                        <Button onClick={openAddUser}>
                            <Plus className="h-4 w-4 mr-2" />
                            Add User
                        </Button>
                    </div>

                    {/* Filters */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Filters</CardTitle>
                            <CardDescription>
                                Search and filter users by role or status
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <UserFilters
                                filters={filters}
                                setFilters={setFilters}
                            />
                        </CardContent>
                    </Card>

                    {/* Users Table */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Users List</CardTitle>
                            <CardDescription>
                                All registered users in the system
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="p-0">
                            <UserTable
                                users={users}
                                onEdit={openEditUser}
                                onDelete={(id) => {
                                    const user = users.find(u => u.id === id)
                                    if (user) {openDeleteUser(user)}
                                }}
                                onDeactivate={openDeactivateUser}
                                page={page}
                                totalPages={totalPages}
                                onPageChange={onPageChange}
                            />
                        </CardContent>
                    </Card>
                </div>
            </main>

            {/* Add / Edit Modal */}
            <BaseFormModal
                open={isFormOpen}
                onOpenChange={(open) => !open && closeModals()}
                title={selectedUser ? "Edit User" : "Add User"}
                submitLabel={selectedUser ? "Update" : "Create"}
                onSubmit={() => submitUser(form)}
            >
                <div className="space-y-6">
                    {/* 👇 Блок завантаження аватарки */}
                    <div className="flex flex-col items-center gap-4">
                        <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-full border bg-muted flex items-center justify-center">
                            {avatarPreview ? (
                                <img
                                    src={avatarPreview}
                                    alt="Avatar preview"
                                    className="h-full w-full object-cover"
                                />
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
                                    if (file) {
                                        setForm(prev => ({ ...prev, avatar: file }))
                                    }
                                    // Очищаємо input, щоб можна було вибрати той самий файл ще раз
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
                    {/* ☝️ Кінець блоку завантаження аватарки */}

                    <Input
                        placeholder="Full name"
                        value={form.full_name}
                        onChange={(e) =>
                            setForm(prev => ({
                                ...prev,
                                full_name: e.target.value,
                            }))
                        }
                    />

                    <Input
                        placeholder="Email"
                        value={form.email}
                        onChange={(e) =>
                            setForm(prev => ({
                                ...prev,
                                email: e.target.value,
                            }))
                        }
                    />

                    <Input
                        placeholder="Phone"
                        value={form.phone}
                        onChange={(e) =>
                            setForm(prev => ({
                                ...prev,
                                phone: e.target.value,
                            }))
                        }
                    />

                    <Select
                        value={String(form.role || "")}
                        onValueChange={(value) =>
                            setForm(prev => ({
                                ...prev,
                                role: Number(value),
                            }))
                        }
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="Select role" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="1">Admin</SelectItem>
                            <SelectItem value="2">Manager</SelectItem>
                            <SelectItem value="3">Editor</SelectItem>
                            <SelectItem value="4">Finance</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </BaseFormModal>

            {/* Confirm Modal (Delete / Deactivate) */}
            <ConfirmModal
                open={isDeleteOpen}
                onOpenChange={(open) => !open && closeModals()}
                title={
                    confirmAction === "delete"
                        ? "Delete user"
                        : "Deactivate user"
                }
                description={
                    confirmAction === "delete"
                        ? `Are you sure you want to delete ${selectedUser?.full_name}? This action cannot be undone.`
                        : `Are you sure you want to deactivate ${selectedUser?.full_name}? The user will lose access to the system.`
                }
                confirmLabel={
                    confirmAction === "delete"
                        ? "Delete"
                        : "Deactivate"
                }
                onConfirm={handleConfirm}
            />
        </>
    )
}
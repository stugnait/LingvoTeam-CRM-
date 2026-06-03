"use client"

import { Button } from "@/src/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/src/components/ui/card"
import { Plus } from "lucide-react"

import { UserTable } from "./UserTable"
import { UserFilters } from "./UserFilter"
import { useUsers } from "../hooks/useUsers"
import { useRoles } from "../hooks/useRoles"

import { UserWizardModal } from "./UserWizardModal"
import { ConfirmModal } from "@/src/components/modals/ConfirmModal"
import { DashboardHeader } from "@/src/shared/components/layout/DashboardHeader"

export function UsersPage() {
    const {
        users, page, totalPages, onPageChange, filters, setFilters,
        roles: dropdownRoles,
        isFormOpen, isDeleteOpen, selectedUser, form, setForm, errors,
        wizardStep, goToStep1, goToStep2,
        openAddUser, openEditUser, openDeleteUser, openDeactivateUser,
        submitUser, handleConfirm, confirmAction, closeModals, resetPassword,
    } = useUsers()

    const { permissions } = useRoles()

    return (
        <>
            <DashboardHeader />

            <main className="flex-1 overflow-y-auto p-3 sm:p-6">
                <div className="w-full min-w-0 space-y-4 sm:space-y-6">

                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div>
                            <h2 className="text-2xl font-bold tracking-tight">
                                Користувачі
                            </h2>
                            <p className="text-muted-foreground">
                                Управління обліковими записами користувачів
                            </p>
                        </div>

                        <div className="flex items-center gap-4">
                            <Button onClick={openAddUser}>
                                <Plus className="h-4 w-4 mr-2" />
                                Додати юзера
                            </Button>
                        </div>
                    </div>

                    <Card>
                        <CardHeader>
                            <CardTitle>Фільтри</CardTitle>
                            <CardDescription>Пошук та фільтрація користувачів</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <UserFilters filters={filters} setFilters={setFilters} />
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Список користувачів</CardTitle>
                            <CardDescription>
                                Всі зареєстровані користувачі в системі
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
                                onResetPassword={resetPassword}
                            />
                        </CardContent>
                    </Card>
                </div>
            </main>

            <UserWizardModal
                open={isFormOpen}
                onOpenChange={(open) => !open && closeModals()}
                isEdit={!!selectedUser}
                step={wizardStep}
                onNextStep={goToStep2}
                onPrevStep={goToStep1}
                form={form}
                setForm={setForm}
                errors={errors}
                roles={dropdownRoles || []}
                permissions={permissions}
                onSubmit={() => submitUser(form)}
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
        </>
    )
}
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
import { useI18n } from "@/src/shared/i18n/I18nProvider"

export function UsersPage() {
    const { t } = useI18n()

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
                                {t("users.title")}
                            </h2>
                            <p className="text-muted-foreground">
                                {t("users.description")}
                            </p>
                        </div>

                        <div className="flex items-center gap-4">
                            <Button onClick={openAddUser}>
                                <Plus className="h-4 w-4 mr-2" />
                                {t("users.add")}
                            </Button>
                        </div>
                    </div>

                    <Card>
                        <CardHeader>
                            <CardTitle>{t("users.filtersTitle")}</CardTitle>
                            <CardDescription>{t("users.filtersDescription")}</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <UserFilters filters={filters} setFilters={setFilters} />
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>{t("users.listTitle")}</CardTitle>
                            <CardDescription>
                                {t("users.listDescription")}
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
                title={confirmAction === "delete" ? t("users.deleteTitle") : t("users.deactivateTitle")}
                description={
                    confirmAction === "delete"
                        ? t("users.deleteDescription", { name: selectedUser?.full_name ?? "" })
                        : t("users.deactivateDescription", { name: selectedUser?.full_name ?? "" })
                }
                confirmLabel={confirmAction === "delete" ? t("common.delete") : t("common.deactivate")}
                onConfirm={handleConfirm}
            />
        </>
    )
}

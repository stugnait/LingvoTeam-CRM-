"use client"

import { useCallback, useEffect, useState } from "react"
import { useToast } from "@/src/hooks/use-toast"
import { usersApi, rolesApi } from "../api"
import type { User, UserFormData, UsersFilters, Role } from "../types"
import { useDebounce } from "@/src/shared/hooks/useDebounce"

export function useUsers() {
    const { toast } = useToast()

    // -------------------------
    // State
    // -------------------------
    const [users, setUsers] = useState<User[]>([])
    const [loading, setLoading] = useState(false)
    const [roles, setRoles] = useState<Role[]>([])

    const [page, setPage] = useState(1)
    const [totalPages, setTotalPages] = useState(1)

    const [confirmAction, setConfirmAction] = useState<"delete" | "deactivate" | null>(null)

    const [filters, setFilters] = useState<UsersFilters>({
        search: "",
        role: "all",
        status: null,
    })

    // Wizard step: 1 = основні дані, 2 = роль + доступи
    const [wizardStep, setWizardStep] = useState<1 | 2>(1)

    const [form, setForm] = useState<UserFormData>({
        full_name: "",
        phone: "",
        email: "",
        role: 0,
        is_active: false,
        avatar: null,
        extra_permission_ids: [],
    })

    const [errors, setErrors] = useState<Partial<Record<keyof UserFormData, string>>>({})

    const debouncedSearch = useDebounce(filters.search, 400)

    // modals
    const [isFormOpen, setIsFormOpen] = useState(false)
    const [isDeleteOpen, setIsDeleteOpen] = useState(false)
    const [selectedUser, setSelectedUser] = useState<User | null>(null)

    // -------------------------
    // Load roles
    // -------------------------
    const loadRoles = useCallback(async () => {
        try {
            const res = await rolesApi.list()
            const rolesArray = Array.isArray(res) ? res : ((res as any)?.results || [])
            setRoles(rolesArray)
        } catch (error) {
            console.error("Failed to load roles", error)
        }
    }, [])

    // -------------------------
    // Load users
    // -------------------------
    const loadUsers = useCallback(async (pageNumber: number = 1) => {
        try {
            setLoading(true)
            const response = await usersApi.list({
                search: debouncedSearch,
                role: filters.role,
                status: filters.status,
                page: pageNumber,
            })
            setUsers(response.results)
            setTotalPages(Math.ceil((response.count || 0) / 10))
            setPage(pageNumber)
        } catch {
            toast({ title: "Error", description: "Failed to load users", variant: "error" })
        } finally {
            setLoading(false)
        }
    }, [debouncedSearch, filters.role, filters.status, toast])

    useEffect(() => { loadUsers(1) }, [loadUsers])
    useEffect(() => { loadRoles() }, [loadRoles])

    const onPageChange = (newPage: number) => loadUsers(newPage)

    // -------------------------
    // Modal handlers
    // -------------------------
    const openAddUser = () => {
        setSelectedUser(null)
        setForm({
            full_name: "",
            phone: "",
            email: "",
            role: 0,
            is_active: true,
            avatar: null,
            extra_permission_ids: [],
        })
        setErrors({})
        setWizardStep(1)
        setIsFormOpen(true)
    }

    const openEditUser = (user: User) => {
        setSelectedUser(user)
        setForm({
            full_name: user.full_name,
            email: user.email,
            phone: user.phone,
            role: user.role.id,
            is_active: user.is_active,
            avatar: null,
            // Підтягуємо існуючі індивідуальні права юзера
            extra_permission_ids: user.extra_permission_ids ?? [],
        })
        setErrors({})
        setWizardStep(1)
        setIsFormOpen(true)
    }

    const openDeleteUser = (user: User) => {
        setSelectedUser(user)
        setConfirmAction("delete")
        setIsDeleteOpen(true)
    }

    const openDeactivateUser = (user: User) => {
        setSelectedUser(user)
        setConfirmAction("deactivate")
        setIsDeleteOpen(true)
    }

    const closeModals = () => {
        setIsFormOpen(false)
        setIsDeleteOpen(false)
        setSelectedUser(null)
        setConfirmAction(null)
        setErrors({})
        setWizardStep(1)
    }

    // -------------------------
    // Wizard navigation
    // -------------------------

    // Валідація першого кроку — повертає true якщо все ок
    const validateStep1 = (): boolean => {
        const newErrors: Partial<Record<keyof UserFormData, string>> = {}

        if (!form.full_name.trim()) {newErrors.full_name = "Full name is required"}

        if (!form.email.trim()) {
            newErrors.email = "Email is required"
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
            newErrors.email = "Invalid email format"
        }

        if (!form.phone.trim()) {newErrors.phone = "Phone is required"}

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors)
            return false
        }

        setErrors({})
        return true
    }

    const goToStep2 = () => {
        if (validateStep1()) {setWizardStep(2)}
    }

    const goToStep1 = () => {
        setWizardStep(1)
        setErrors({})
    }

    // -------------------------
    // Submit
    // -------------------------
    const submitUser = async (data: UserFormData) => {
        // Фінальна валідація другого кроку
        if (!data.role || Number(data.role) <= 0) {
            setErrors({ role: "Role is required" })
            toast({ title: "Validation error", description: "Please select a role", variant: "error" })
            return
        }

        try {
            setErrors({})

            if (selectedUser) {
                await usersApi.update(selectedUser.id, data)
                toast({ title: "User updated", description: `${data.full_name} updated successfully` })
            } else {
                await usersApi.register(data)
                toast({ title: "User created", description: `${data.full_name} created successfully` })
            }

            closeModals()
            await loadUsers(page)
        } catch {
            toast({ title: "Error", description: "Failed to save user", variant: "error" })
        }
    }

    const resetPassword = async (userId: string) => {
        try {
            await usersApi.resetPass(userId)
            toast({ title: "Пароль скинуто", description: "Новий пароль надіслано на пошту користувача" })
        } catch {
            toast({ title: "Error", description: "Failed to reset password", variant: "error" })
        }
    }

    // -------------------------
    // Confirm handlers
    // -------------------------
    const confirmDelete = async () => {
        if (!selectedUser) {return}
        try {
            await usersApi.remove(selectedUser.id)
            toast({ title: "User deleted", description: `${selectedUser.full_name} removed` })
            closeModals()
            await loadUsers(page)
        } catch {
            toast({ title: "Error", description: "Failed to delete user", variant: "error" })
        }
    }

    const confirmDeactivation = async () => {
        if (!selectedUser) {return}
        try {
            await usersApi.deactivate(selectedUser.id)
            toast({ title: "User deactivated", description: `${selectedUser.full_name} deactivated` })
            closeModals()
            await loadUsers(page)
        } catch {
            toast({ title: "Error", description: "Failed to deactivate user", variant: "error" })
        }
    }

    const handleConfirm = async () => {
        if (!selectedUser || !confirmAction) {return}
        if (confirmAction === "delete") {await confirmDelete()}
        if (confirmAction === "deactivate") {await confirmDeactivation()}
    }

    // -------------------------
    // Public API
    // -------------------------
    return {
        users,
        loading,
        page,
        totalPages,
        onPageChange,

        roles,

        filters,
        setFilters,

        // Wizard
        wizardStep,
        goToStep1,
        goToStep2,

        isFormOpen,
        isDeleteOpen,
        selectedUser,
        confirmAction,

        form,
        setForm,
        errors,

        openAddUser,
        openEditUser,
        openDeleteUser,
        openDeactivateUser,

        submitUser,
        confirmDelete,
        confirmDeactivation,
        handleConfirm,
        closeModals,
        resetPassword,
    }
}
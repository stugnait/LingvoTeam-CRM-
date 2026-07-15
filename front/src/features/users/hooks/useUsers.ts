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
            toast({ title: "Помилка", description: "Не вдалося завантажити користувачів", variant: "error" })
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
            is_translator: false,
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
            extra_permission_ids: user.extra_permission_ids ?? [],
            is_translator: !!user.translator_id,
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

    const validateStep1 = (): boolean => {
        const newErrors: Partial<Record<keyof UserFormData, string>> = {}

        if (!form.full_name.trim()) {newErrors.full_name = "Вкажіть повне ім'я"}

        if (!form.email.trim()) {
            newErrors.email = "Вкажіть Email"
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
            newErrors.email = "Невірний формат Email"
        }

        if (!form.phone.trim()) {newErrors.phone = "Вкажіть номер телефону"}

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
        if (!data.role || Number(data.role) <= 0) {
            setErrors({ role: "Оберіть роль" })
            toast({ title: "Помилка валідації", description: "Будь ласка, оберіть роль", variant: "error" })
            return
        }

        try {
            setErrors({})

            if (selectedUser) {
                await usersApi.update(selectedUser.id, data)
                toast({ title: "Успіх", description: `Дані ${data.full_name} успішно оновлено` })
            } else {
                await usersApi.register(data)
                toast({ title: "Успіх", description: `Користувача ${data.full_name} успішно створено` })
            }

            closeModals()
            await loadUsers(page)
        } catch (error: any) {
            const errorMsg = error?.response?.data?.error || error?.response?.data?.detail || "Не вдалося зберегти користувача";
            toast({ title: "Помилка", description: errorMsg, variant: "error" })
        }
    }

    const resetPassword = async (userId: string) => {
        try {
            await usersApi.resetPass(userId)
            toast({ title: "Пароль скинуто", description: "Новий пароль надіслано на пошту користувача" })
        } catch (error: any) {
            const errorMsg = error?.response?.data?.error || error?.response?.data?.detail || "Не вдалося скинути пароль";
            toast({ title: "Помилка", description: errorMsg, variant: "error" })
        }
    }

    // -------------------------
    // Confirm handlers
    // -------------------------
    const confirmDelete = async () => {
        if (!selectedUser) {return}
        try {
            await usersApi.remove(selectedUser.id)
            toast({ title: "Видалено", description: `Користувача ${selectedUser.full_name} видалено` })
            closeModals()
            await loadUsers(page)
        } catch (error: any) {
            // Дістаємо повідомлення про ProtectedError з бекенду
            const errorMsg = error?.error || error?.response?.data?.detail || "Не вдалося видалити користувача";
            toast({ title: "Помилка видалення", description: errorMsg, variant: "error" })
        }
    }

    const confirmDeactivation = async () => {
        if (!selectedUser) {return}
        try {
            await usersApi.deactivate(selectedUser.id)
            toast({ title: "Деактивовано", description: `Користувача ${selectedUser.full_name} деактивовано` })
            closeModals()
            await loadUsers(page)
        } catch (error: any) {
            const errorMsg = error?.response?.data?.error || error?.response?.data?.detail || "Не вдалося деактивувати користувача";
            toast({ title: "Помилка", description: errorMsg, variant: "error" })
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
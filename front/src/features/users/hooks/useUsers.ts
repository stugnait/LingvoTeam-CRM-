"use client"

import { useCallback, useEffect, useState, useMemo } from "react"
import { useToast } from "@/src/hooks/use-toast"
import { usersApi } from "../api"
import type { User, UserFormData, UsersFilters } from "../types"

export function useUsers() {
    const { toast } = useToast()

    // -------------------------
    // State
    // -------------------------
    const [allUsers, setAllUsers] = useState<User[]>([]) // Всі користувачі
    const [loading, setLoading] = useState(false)
    const [confirmAction, setConfirmAction] = useState<"delete" | "deactivate" | null>(null)


    const [filters, setFilters] = useState<UsersFilters>({
        search: "",
        role: "all",
        status: null,
    })

    const [form, setForm] = useState<UserFormData>({
        full_name: "",
        phone: "",
        email: "",
        role: 0,
        is_active: false
    })


    // modals
    const [isFormOpen, setIsFormOpen] = useState(false)
    const [isDeleteOpen, setIsDeleteOpen] = useState(false)
    const [selectedUser, setSelectedUser] = useState<User | null>(null)

    // -------------------------
    // Load users (БЕЗ фільтрів)
    // -------------------------
    const loadUsers = useCallback(async () => {
        try {
            setLoading(true)

            // Завантажуємо ВСІ користувачі без фільтрів
            const response = await usersApi.list()

            setAllUsers(response.results)
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to load users",
                variant: "error",
            })
        } finally {
            setLoading(false)
        }
    }, [toast])

    useEffect(() => {
        loadUsers()
    }, [loadUsers])

    // -------------------------
    // Фільтрація на фронтенді
    // -------------------------
    const users = useMemo(() => {
        let filtered = [...allUsers]

        // Фільтр за пошуком
        if (filters.search) {
            const searchLower = filters.search.toLowerCase()
            filtered = filtered.filter(user =>
                user.full_name?.toLowerCase().includes(searchLower) ||
                user.email?.toLowerCase().includes(searchLower)
            )
        }

        // Фільтр за роллю
        // Фільтр за роллю
        if (filters.role !== "all") {
            filtered = filtered.filter(user =>
                user.role && String(user.role.name).toLowerCase() === filters.role.toLowerCase()
            )
        }

// Фільтр за статусом
        // Фільтр за статусом
        if (filters.status !== null) {
            filtered = filtered.filter(
                user => user.is_active === filters.status
            )
        }


        return filtered
    }, [allUsers, filters])

    // -------------------------
    // Modal handlers
    // -------------------------
    const openAddUser = () => {
        setForm({ full_name: "", phone: "", email: "", role: 0, is_active: false })
        setIsFormOpen(true)
    }

    const openEditUser = (user: User) => {
        setSelectedUser(user)
        setForm({
            full_name: user.full_name,
            email: user.email,
            phone: user.phone,
            role: user.role.id,
            is_active: user.is_active
        })
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
    }

    // -------------------------
    // Submit handlers
    // -------------------------
    const submitUser = async (data: UserFormData) => {
        try {
            if (selectedUser) {
                await usersApi.update(selectedUser.id, data)

                toast({
                    title: "User updated",
                    description: `${data.full_name} updated successfully`,
                })
            } else {
                await usersApi.register(data)

                toast({
                    title: "User created",
                    description: `${data.full_name} created successfully`,
                })
            }

            closeModals()
            await loadUsers()
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to save user",
                variant: "error",
            })
        }
    }

    const confirmDelete = async () => {
        if (!selectedUser) {return}

        try {
            await usersApi.remove(selectedUser.id)

            toast({
                title: "User deleted",
                description: `${selectedUser.full_name} removed`,
            })

            closeModals()
            await loadUsers()
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to delete user",
                variant: "error",
            })
        }
    }
    
    

    const confirmDeactivation = async () => {
        if (!selectedUser) {return}

        try {
            await usersApi.deactivate(selectedUser.id)

            toast({
                title: "User deactivated",
                description: `${selectedUser.full_name} removed`,
            })

            closeModals()
            await loadUsers()
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to delete user",
                variant: "error",
            })
        }
    }

    const handleConfirm = async () => {
        if (!selectedUser || !confirmAction) {return}

        if (confirmAction === "delete") {
            await confirmDelete()
        }

        if (confirmAction === "deactivate") {
            await confirmDeactivation()
        }
    }

    // -------------------------
    // Public API
    // -------------------------
    return {
        users,
        filters,
        setFilters,

        isFormOpen,
        isDeleteOpen,
        selectedUser,
        form,
        setForm,
        confirmAction,

        openAddUser,
        openEditUser,
        openDeleteUser,
        openDeactivateUser,

        submitUser,
        confirmDelete,
        confirmDeactivation,
        closeModals,
        handleConfirm,
    }
}
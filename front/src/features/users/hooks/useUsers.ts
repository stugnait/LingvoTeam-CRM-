"use client"

import { useCallback, useEffect, useState } from "react"
import { useToast } from "@/src/hooks/use-toast"
import { usersApi } from "../api"
import type { User, UserFormData, UsersFilters } from "../types"
import { useDebounce } from "@/src/shared/hooks/useDebounce"

export function useUsers() {
    const { toast } = useToast()

    // -------------------------
    // State
    // -------------------------
    const [users, setUsers] = useState<User[]>([])
    const [loading, setLoading] = useState(false)

    const [page, setPage] = useState(1)
    const [totalPages, setTotalPages] = useState(1)

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
        is_active: false,
        is_translator: false
    })

    const debouncedSearch = useDebounce(filters.search, 400)

    // modals
    const [isFormOpen, setIsFormOpen] = useState(false)
    const [isDeleteOpen, setIsDeleteOpen] = useState(false)
    const [selectedUser, setSelectedUser] = useState<User | null>(null)

    // -------------------------
    // Load users (через API filters)
    // -------------------------
    const loadUsers = useCallback(async (pageNumber: number = 1) => {
        try {
            setLoading(true)

            const response = await usersApi.list({
                search: debouncedSearch,
                role: filters.role,
                status: filters.status,
                page: pageNumber
            })

            setUsers(response.results)
            setTotalPages(Math.ceil((response.count || 0) / 10))
            setPage(pageNumber)

        } catch {
            toast({
                title: "Error",
                description: "Failed to load users",
                variant: "error",
            })
        } finally {
            setLoading(false)
        }
    }, [debouncedSearch, filters.role, filters.status, toast])

    useEffect(() => {
        loadUsers(1)
    }, [loadUsers])

    const onPageChange = (newPage: number) => {
        loadUsers(newPage)
    }

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
            is_translator: false
        })

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
            is_translator: user.is_translator || false
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
        setConfirmAction(null)
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
            await loadUsers(page)

        } catch {
            toast({
                title: "Error",
                description: "Failed to save user",
                variant: "error",
            })
        }
    }

    const confirmDelete = async () => {
        if (!selectedUser) return

        try {
            await usersApi.remove(selectedUser.id)

            toast({
                title: "User deleted",
                description: `${selectedUser.full_name} removed`,
            })

            closeModals()
            await loadUsers(page)

        } catch {
            toast({
                title: "Error",
                description: "Failed to delete user",
                variant: "error",
            })
        }
    }

    const confirmDeactivation = async () => {
        if (!selectedUser) return

        try {
            await usersApi.deactivate(selectedUser.id)

            toast({
                title: "User deactivated",
                description: `${selectedUser.full_name} deactivated`,
            })

            closeModals()
            await loadUsers(page)

        } catch {
            toast({
                title: "Error",
                description: "Failed to deactivate user",
                variant: "error",
            })
        }
    }

    const handleConfirm = async () => {
        if (!selectedUser || !confirmAction) return

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
        loading,
        page,
        totalPages,
        onPageChange,

        filters,
        setFilters,

        isFormOpen,
        isDeleteOpen,
        selectedUser,
        confirmAction,

        form,
        setForm,

        openAddUser,
        openEditUser,
        openDeleteUser,
        openDeactivateUser,

        submitUser,
        confirmDelete,
        confirmDeactivation,
        handleConfirm,
        closeModals,
    }
}
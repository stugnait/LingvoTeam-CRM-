"use client"

import { useState, useEffect, useMemo } from "react"
import { useToast } from "@/hooks/use-toast"

interface User {
    id: string
    name: string
    email: string
    role: string
    status: string
    joinDate: string
}

interface Filters {
    search: string
    role: string
    status: string
}

export function useUsers() {
    const [users, setUsers] = useState<User[]>([])
    const [filters, setFilters] = useState<Filters>({
        search: "",
        role: "all",
        status: "all",
    })
    const { toast } = useToast()

    useEffect(() => {
        // Load users from localStorage
        const registeredUsers = JSON.parse(localStorage.getItem("registeredUsers") || "[]")
        if (registeredUsers.length === 0) {
            // Initialize with demo data
            const demoUsers: User[] = [
                {
                    id: "1",
                    name: "John Doe",
                    email: "john@example.com",
                    role: "Admin",
                    status: "Active",
                    joinDate: new Date(2024, 0, 15).toISOString(),
                },
                {
                    id: "2",
                    name: "Sarah Johnson",
                    email: "sarah@example.com",
                    role: "Manager",
                    status: "Active",
                    joinDate: new Date(2024, 1, 20).toISOString(),
                },
                {
                    id: "3",
                    name: "Mike Chen",
                    email: "mike@example.com",
                    role: "Editor",
                    status: "Active",
                    joinDate: new Date(2024, 2, 10).toISOString(),
                },
            ]
            localStorage.setItem("registeredUsers", JSON.stringify(demoUsers))
            setUsers(demoUsers)
        } else {
            setUsers(registeredUsers)
        }
    }, [])

    const filteredUsers = useMemo(() => {
        return users.filter((user) => {
            const matchesSearch =
                user.name.toLowerCase().includes(filters.search.toLowerCase()) ||
                user.email.toLowerCase().includes(filters.search.toLowerCase())
            const matchesRole = filters.role === "all" || user.role === filters.role
            const matchesStatus = filters.status === "all" || user.status === filters.status

            return matchesSearch && matchesRole && matchesStatus
        })
    }, [users, filters])

    const handleAddUser = () => {
        toast({
            title: "Feature coming soon",
            description: "User creation dialog will be available soon.",
        })
    }

    const handleEditUser = (user: User) => {
        toast({
            title: "Edit user",
            description: `Editing ${user.name}`,
        })
    }

    const handleDeleteUser = (userId: string) => {
        const updatedUsers = users.filter((u) => u.id !== userId)
        setUsers(updatedUsers)
        localStorage.setItem("registeredUsers", JSON.stringify(updatedUsers))
        toast({
            title: "User deleted",
            description: "The user has been removed.",
        })
    }

    return {
        users: filteredUsers,
        filters,
        setFilters,
        handleAddUser,
        handleEditUser,
        handleDeleteUser,
    }
}

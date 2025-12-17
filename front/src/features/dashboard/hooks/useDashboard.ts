"use client"

import { useEffect, useState } from "react"

interface User {
    id: string
    name: string
    email: string
    role: string
}

interface Stat {
    label: string
    value: string
    change: string
    icon: "users" | "projects" | "translations" | "pending"
}

export function useDashboard() {
    const [user, setUser] = useState<User | null>(null)
    const [stats] = useState<Stat[]>([
        { label: "Total Users", value: "2,847", change: "+12% from last month", icon: "users" },
        { label: "Active Projects", value: "156", change: "+8% from last month", icon: "projects" },
        { label: "Translations", value: "45,291", change: "+23% from last month", icon: "translations" },
        { label: "Pending Tasks", value: "37", change: "-15% from last week", icon: "pending" },
    ])

    useEffect(() => {
        const currentUser = localStorage.getItem("currentUser")
        if (currentUser) {
            setUser(JSON.parse(currentUser))
        }
    }, [])

    return {
        user,
        stats,
    }
}

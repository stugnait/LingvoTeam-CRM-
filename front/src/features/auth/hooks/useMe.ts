"use client"

import { useEffect, useState } from "react"
import { authApi } from "../api"

export type RoleSlug = "admin" | "manager" | "driver"

export function useMe() {
    const [user, setUser] = useState<any>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        authApi
            .me()
            .then((res) => setUser(res))
            .finally(() => setLoading(false))
    }, [])

    return {
        user,
        role: user?.role?.slug as RoleSlug | undefined,
        loading,
    }
}

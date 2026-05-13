"use client"

import { useCallback, useEffect, useState } from "react"
import { useToast } from "@/src/hooks/use-toast"
import { rolesApi, permissionsApi } from "../api"
import type { Role, Permission, RoleFormData } from "../types"

const EMPTY_FORM: RoleFormData = {
    name: "",
    slug: "",
    permission_ids: [],
}

export function useRoles() {
    const { toast } = useToast()

    const [roles, setRoles] = useState<Role[]>([])
    const [permissions, setPermissions] = useState<Permission[]>([])
    const [loading, setLoading] = useState(false)

    const [isModalOpen, setIsModalOpen] = useState(false)
    const [selectedRole, setSelectedRole] = useState<Role | null>(null)
    const [form, setForm] = useState<RoleFormData>(EMPTY_FORM)
    const [activeTab, setActiveTab] = useState<string>("") // slug активної групи permissions

    const loadData = useCallback(async () => {
        try {
            setLoading(true)
            const [rolesRes, permsRes] = await Promise.all([
                rolesApi.list(),
                permissionsApi.list(),
            ])

            const rolesArray = rolesRes.results || []
            const permsArray = permsRes.results || []

            setRoles(rolesArray)
            setPermissions(permsArray)

            // Перший таб = перша "група" по префіксу slug
            if (permsArray.length > 0) {
                const firstGroup = permsArray[0].slug.split(".")[0]
                setActiveTab(firstGroup)
            }
        } catch (error) {
            console.error(error)
            toast({ title: "Помилка", description: "Не вдалося завантажити ролі", variant: "error" })
        } finally {
            setLoading(false)
        }
    }, [toast])

    useEffect(() => { loadData() }, [loadData])

    // Групуємо permissions по префіксу slug (user, order, client, ...)
    const permissionGroups = permissions.reduce<Record<string, Permission[]>>((acc, perm) => {
        const group = perm.slug.split(".")[0]
        if (!acc[group]) acc[group] = []
        acc[group].push(perm)
        return acc
    }, {})

    const openCreate = () => {
        setSelectedRole(null)
        setForm(EMPTY_FORM)
        setIsModalOpen(true)
    }

    const openEdit = (role: Role) => {
        setSelectedRole(role)
        setForm({
            name: role.name,
            slug: role.slug,
            permission_ids: role.permissions.map(p => p.id),
        })
        setIsModalOpen(true)
    }

    const closeModal = () => {
        setIsModalOpen(false)
        setSelectedRole(null)
        setForm(EMPTY_FORM)
    }

    const togglePermission = (permId: number) => {
        setForm(prev => ({
            ...prev,
            permission_ids: prev.permission_ids.includes(permId)
                ? prev.permission_ids.filter(id => id !== permId)
                : [...prev.permission_ids, permId],
        }))
    }

    const toggleGroup = (groupPerms: Permission[]) => {
        const groupIds = groupPerms.map(p => p.id)
        const allSelected = groupIds.every(id => form.permission_ids.includes(id))

        setForm(prev => ({
            ...prev,
            permission_ids: allSelected
                ? prev.permission_ids.filter(id => !groupIds.includes(id))
                : [...new Set([...prev.permission_ids, ...groupIds])],
        }))
    }

    const submitRole = async () => {
        if (!form.name.trim()) {
            toast({ title: "Помилка", description: "Назва ролі обов'язкова", variant: "error" })
            return
        }

        // Автогенерація slug якщо порожній
        const payload: RoleFormData = {
            ...form,
            slug: form.slug.trim() || form.name.toLowerCase().replace(/\s+/g, "_"),
        }

        try {
            if (selectedRole) {
                await rolesApi.update(selectedRole.id, payload)
                toast({ title: "Роль оновлено" })
            } else {
                await rolesApi.create(payload)
                toast({ title: "Роль створено" })
            }
            closeModal()
            await loadData()
        } catch {
            toast({ title: "Помилка", description: "Не вдалося зберегти роль", variant: "error" })
        }
    }

    const removeRole = async (id: number) => {
        try {
            await rolesApi.remove(id)
            toast({ title: "Роль видалено" })
            await loadData()
        } catch {
            toast({ title: "Помилка", description: "Не вдалося видалити роль", variant: "error" })
        }
    }

    return {
        roles,
        permissions,
        permissionGroups,
        loading,
        isModalOpen,
        selectedRole,
        form,
        setForm,
        activeTab,
        setActiveTab,
        openCreate,
        openEdit,
        closeModal,
        togglePermission,
        toggleGroup,
        submitRole,
        removeRole,
    }
}
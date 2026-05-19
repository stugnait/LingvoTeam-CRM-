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

export const TAB_PRESETS: Record<string, { label: string; icon: string; slugs: string[] }> = {
    Orders: {
        label: "Замовлення",
        icon: "📦",
        slugs: [
            "ui.tab.orders",

            // Основні права для замовлень
            "order.view",
            "order.create",
            "order.update",
            "order.change.status",
            "order.assign",

            // Допоміжні права (щоб не було 403 помилок при завантаженні дропдаунів)
            "client.view",         // Для /api/clients/
            "language.manage",     // Для /api/core/languages/
            "currency.manage",       // Для /api/core/currencies/
            "order.traffic.manage" // Для /api/orders/order-traffic/ (як вказано у твоєму бекенді)
        ],
    },
    Tasks: {
        label: "Перевірка (Tasks)",
        icon: "✅",
        slugs: [
            "ui.tab.tasks",        // Додано
            "order.view",
            "order.reject_translation",
            "order.approve_translation"
        ],
    },
    Clients: {
        label: "Clients", icon: "🤝",
        slugs: ["ui.tab.clients", "client.view", "client.create", "client.category.manage"]
    },
    Tariffs: {
        label: "Tariffs", icon: "🏷️",
        slugs: ["ui.tab.tariffs", "order.traffic.manage", "translator.traffic.manage"]
    },
    Translators: {
        label: "Translators", icon: "✍️",
        slugs: ["ui.tab.translators", "translator.create"]
    },
    Users: {
        label: "Users", icon: "👤",
        slugs: ["ui.tab.users", "user.read", "user.write"]
    },
    Stats: {
        label: "Stats", icon: "📊",
        slugs: ["ui.tab.stats", "statistic.order.view", "statistic.volume.view"]
    },
    PnL: {
        label: "P&L", icon: "💹",
        slugs: ["ui.tab.pnl", "statistic.pnl.view"]
    },
    Salary: {
        label: "Salary", icon: "💰",
        slugs: ["ui.tab.salary", "user.read", "statistic.manager.view"]
    },
}

export function useRoles() {
    const { toast } = useToast()

    const [roles, setRoles] = useState<Role[]>([])
    const [permissions, setPermissions] = useState<Permission[]>([])
    const [loading, setLoading] = useState(false)

    const [isModalOpen, setIsModalOpen] = useState(false)
    const [selectedRole, setSelectedRole] = useState<Role | null>(null)
    const [form, setForm] = useState<RoleFormData>(EMPTY_FORM)
    const [activeTab, setActiveTab] = useState<string>("")

    // Хелпер: беремо перший ключ з наших пресетів (наприклад "Orders")
    const getFirstTab = () => Object.keys(TAB_PRESETS)[0]

    const loadData = useCallback(async () => {
        try {
            setLoading(true)
            const [rolesRes, permsRes] = await Promise.all([
                rolesApi.list(),
                permissionsApi.list(),
            ])

            const rolesArray = Array.isArray(rolesRes) ? rolesRes : (rolesRes || [])
            const permsArray = Array.isArray(permsRes) ? permsRes : (permsRes || [])

            setRoles(rolesArray)
            setPermissions(permsArray)

            setActiveTab(prev => prev || getFirstTab())
        } catch (error) {
            console.error(error)
            toast({ title: "Помилка", description: "Не вдалося завантажити ролі", variant: "error" })
        } finally {
            setLoading(false)
        }
    }, [toast])

    useEffect(() => { loadData() }, [loadData])

    const openCreate = () => {
        setSelectedRole(null)
        setForm(EMPTY_FORM)
        setActiveTab(getFirstTab())
        setIsModalOpen(true)
    }

    const openEdit = (role: Role) => {
        setSelectedRole(role)
        setForm({
            name: role.name,
            slug: role.slug,
            permission_ids: role.permissions.map(p => p.id),
        })
        setActiveTab(getFirstTab())
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

        const payload: RoleFormData = {
            ...form,
            slug: form.slug.trim() || form.name.toLowerCase().replace(/\s+/g, "_"),
        }

        try {
            if (selectedRole) {
                await rolesApi.update(selectedRole.id, payload)
                await rolesApi.setPermissions(selectedRole.id, form.permission_ids)
                toast({ title: "Роль оновлено" })
            } else {
                const created = await rolesApi.create(payload)
                if (created?.id && form.permission_ids.length > 0) {
                    await rolesApi.setPermissions(created.id, form.permission_ids)
                }
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
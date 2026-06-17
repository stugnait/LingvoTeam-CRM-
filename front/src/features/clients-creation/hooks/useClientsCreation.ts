"use client"

import { useState, useEffect, useCallback } from "react"
import { useToast } from "@/src/hooks/use-toast"

import { clientsCreationApi } from "../api"

import type { Client, ClientFormData } from "../types"

export function useClientsCreation() {

    const { toast } = useToast()
    const [clients, setClients] = useState<Client[]>([])
    const [loading, setLoading] = useState(false)
    const [search, setSearch] = useState("")
    const [debouncedSearch, setDebouncedSearch] = useState("")
    const [categoryFilter, setCategoryFilter] = useState<string>("all")

    const [page, setPage] = useState(1)
    const [totalPages, setTotalPages] = useState(1)

    const [form, setForm] = useState<ClientFormData>({
        full_name: "",
        email: "",
        phone_number: "",
        category: null
    })

    const [errors, setErrors] = useState<Partial<Record<keyof ClientFormData, string>>>({})
    const [isFormOpen, setIsFormOpen] = useState(false)
    const [isDeleteOpen, setIsDeleteOpen] = useState(false)

    const [selectedClient, setSelectedClient] = useState<Client | null>(null)

    const handleImportExcel = async (file: File) => {
        try {
            setLoading(true)
            const response = await clientsCreationApi.importExcel(file)

            toast({
                title: "Успіх",
                description: response.message || "Клієнтів успішно імпортовано",
            })

            // Перезавантажуємо першу сторінку після імпорту
            await loadClients(1)

        } catch (error: any) {
            toast({
                title: "Помилка імпорту",
                description: error?.response?.data?.error || "Не вдалося імпортувати клієнтів",
                variant: "error"
            })
        } finally {
            setLoading(false)
        }
    }


    const loadClients = useCallback(async (pageNumber: number = 1) => {
        try {
            setLoading(true)

            const response = await clientsCreationApi.list(
                pageNumber,
                debouncedSearch,
                categoryFilter === "all" ? undefined : categoryFilter
            )

            setClients(response.results)
            setTotalPages(Math.ceil((response.count || 0) / 10))
            setPage(pageNumber)

        } catch (error) {

            toast({
                title: "Error",
                description: "Failed to load clients",
                variant: "error",
            })

        } finally {
            setLoading(false)
        }
    }, [debouncedSearch, categoryFilter, toast])

    useEffect(() => {
        loadClients(1)
    }, [loadClients])

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(search)
        }, 400)

        return () => clearTimeout(timer)
    }, [search])

    const onPageChange = (newPage: number) => {
        loadClients(newPage)
    }

    const openAddClient = () => {
        setSelectedClient(null)
        setForm({
            full_name: "",
            email: "",
            phone_number: "",
            category: null
        })
        setErrors({})
        setIsFormOpen(true)
    }

    const openEditClient = (client: Client) => {
        setSelectedClient(client)
        setForm({
            full_name: client.full_name,
            email: client.email || "",
            phone_number: client.phone_number || "",
            category: client.category?.id || null
        })
        setErrors({})
        setIsFormOpen(true)
    }

    const openDeleteClient = (client: Client) => {
        setSelectedClient(client)
        setIsDeleteOpen(true)
    }

    const closeModals = () => {
        setIsFormOpen(false)
        setIsDeleteOpen(false)
        setSelectedClient(null)
        setErrors({})
    }

    const submitClient = async (data: ClientFormData) => {

        try {
            const newErrors: Partial<Record<keyof ClientFormData, string>> = {}

            if (!data.full_name.trim()) {
                newErrors.full_name = "Full name is required"
            }

            if (data.email && data.email.trim() !== "") {
                if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
                    newErrors.email = "Invalid email format"
                }
            }

            if (Object.keys(newErrors).length > 0) {
                setErrors(newErrors)
                return
            }

            setErrors({})

            const payload = {
                ...data,
                email: data.email?.trim() ? data.email.trim() : null,
                phone_number: data.phone_number?.trim() ? data.phone_number.trim() : null,
            }

            if (selectedClient) {
                await clientsCreationApi.update(selectedClient.id, payload)
                toast({
                    title: "Client updated",
                    description: `${data.full_name} updated successfully`
                })
            } else {
                await clientsCreationApi.create(payload)
                toast({
                    title: "Client created",
                    description: `${data.full_name} created successfully`
                })
            }

            closeModals()
            await loadClients(page)

        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to save client",
                variant: "error"
            })
        }
    }

    const confirmDelete = async () => {
        if (!selectedClient) {return}
        try {
            await clientsCreationApi.remove(selectedClient.id)
            toast({
                title: "Client deleted",
                description: `${selectedClient.full_name} removed`
            })
            closeModals()
            await loadClients(page)
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to delete client",
                variant: "error"
            })
        }
    }

    const handleConfirm = async () => {
        if (!selectedClient) {return}
        await confirmDelete()
    }

    return {
        clients,
        loading,
        page,
        totalPages,
        onPageChange,
        isFormOpen,
        isDeleteOpen,
        selectedClient,
        form,
        setForm,
        errors,
        search,
        setSearch,
        categoryFilter,
        setCategoryFilter,
        openAddClient,
        openEditClient,
        openDeleteClient,
        submitClient,
        confirmDelete,
        handleConfirm,
        closeModals,
        handleImportExcel
    }
}
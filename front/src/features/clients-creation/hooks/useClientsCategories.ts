"use client"

import { useState, useEffect, useCallback } from "react"
import { useToast } from "@/src/hooks/use-toast"

import { clientsCreationApi } from "../api"
import type { ClientCategory, ClientCategoryFormData } from "../types"

export function useClientsCategories() {

    const { toast } = useToast()

    const [categories, setCategories] = useState<ClientCategory[]>([])
    const [loading, setLoading] = useState(false)
    const [search, setSearch] = useState("")
    const [debouncedSearch, setDebouncedSearch] = useState("")

    const [page, setPage] = useState(1)
    const [totalPages, setTotalPages] = useState(1)

    const [form, setForm] = useState<ClientCategoryFormData>({
        name: "",
        discount_percent: 0
    })

    const [errors, setErrors] = useState<Partial<Record<keyof ClientCategoryFormData, string>>>({})

    // modals
    const [isFormOpen, setIsFormOpen] = useState(false)
    const [isDeleteOpen, setIsDeleteOpen] = useState(false)

    const [selectedCategory, setSelectedCategory] = useState<ClientCategory | null>(null)

    // -------------------------
    // Load categories
    // -------------------------

    const loadCategories = useCallback(async (pageNumber: number = 1) => {
        try {
            setLoading(true)

            // Якщо твоє API підтримує пагінацію і пошук для категорій:
            const response = await clientsCreationApi.listCategories(pageNumber, debouncedSearch)

            // Якщо API повертає об'єкт з count та results (як для клієнтів):
            setCategories(response.results || response)
            setTotalPages(Math.ceil((response.count || 0) / 10) || 1)
            setPage(pageNumber)

        } catch (error) {

            toast({
                title: "Error",
                description: "Failed to load categories",
                variant: "error", // Або "error", якщо у тебе налаштовано так
            })

        } finally {
            setLoading(false)
        }
    }, [debouncedSearch, toast])

    useEffect(() => {
        loadCategories(1)
    }, [loadCategories])

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(search)
        }, 400)

        return () => clearTimeout(timer)
    }, [search])

    const onPageChange = (newPage: number) => {
        loadCategories(newPage)
    }

    // -------------------------
    // Modal handlers
    // -------------------------

    const openAddCategory = () => {

        setSelectedCategory(null)

        setForm({
            name: "",
            discount_percent: 0
        })

        setErrors({})

        setIsFormOpen(true)
    }

    const openEditCategory = (category: ClientCategory) => {

        setSelectedCategory(category)

        setForm({
            name: category.name,
            discount_percent: category.discount_percent
        })

        setErrors({})

        setIsFormOpen(true)
    }

    const openDeleteCategory = (category: ClientCategory) => {
        console.log("OPEN DELETE MODAL", category)
        setSelectedCategory(category)
        setIsDeleteOpen(true)
    }

    const closeModals = () => {

        setIsFormOpen(false)
        setIsDeleteOpen(false)
        setSelectedCategory(null)
        setErrors({})

    }

    // -------------------------
    // Submit
    // -------------------------

    const submitCategory = async (data: ClientCategoryFormData) => {

        try {
            const newErrors: Partial<Record<keyof ClientCategoryFormData, string>> = {}

            if (!data.name.trim()) {
                newErrors.name = "Category name is required"
            }
            if (data.discount_percent < 0 || data.discount_percent > 100) {
                newErrors.discount_percent = "Discount must be between 0 and 100"
            }

            if (Object.keys(newErrors).length > 0) {
                setErrors(newErrors)
                return
            }

            setErrors({})
            if (selectedCategory) {

                await clientsCreationApi.updateCategory(selectedCategory.id, data)

                toast({
                    title: "Category updated",
                    description: `${data.name} updated successfully`
                })

            } else {

                await clientsCreationApi.createCategory(data)

                toast({
                    title: "Category created",
                    description: `${data.name} created successfully`
                })

            }

            closeModals()
            await loadCategories(page)

        } catch (error) {

            toast({
                title: "Error",
                description: "Failed to save category",
                variant: "error"
            })

        }

    }

    // -------------------------
    // Delete
    // -------------------------

    const confirmDelete = async () => {

        if (!selectedCategory) {return}

        try {

            await clientsCreationApi.deleteCategory(selectedCategory.id)

            toast({
                title: "Category deleted",
                description: `${selectedCategory.name} removed`
            })

            closeModals()
            await loadCategories(page)

        } catch (error) {

            toast({
                title: "Error",
                description: "Failed to delete category",
                variant: "error"
            })

        }

    }

    const handleConfirm = async () => {

        if (!selectedCategory) {return}

        await confirmDelete()

    }

    // -------------------------
    // Public API
    // -------------------------

    return {

        categories,
        loading,

        page,
        totalPages,
        onPageChange,

        isFormOpen,
        isDeleteOpen,
        selectedCategory,

        form,
        setForm,
        errors,

        search,
        setSearch,

        openAddCategory,
        openEditCategory,
        openDeleteCategory,

        submitCategory,
        confirmDelete,
        handleConfirm,
        closeModals,

    }
}
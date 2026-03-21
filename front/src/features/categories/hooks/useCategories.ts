"use client"

import { useCallback, useEffect, useState } from "react"
import { useToast } from "@/src/hooks/use-toast"
import { clientCategoriesApi } from "../api"
import type { ClientCategory } from "../types"

export function useClientCategories() {
    const { toast } = useToast()

    // -------------------------
    // State
    // -------------------------
    const [categories, setCategories] = useState<ClientCategory[]>([])
    const [loading, setLoading] = useState(false)

    const [form, setForm] = useState({
        name: "",
        discount: 0,
    })

    const [selectedCategory, setSelectedCategory] = useState<ClientCategory | null>(null)

    // modals
    const [isFormOpen, setIsFormOpen] = useState(false)
    const [isDeleteOpen, setIsDeleteOpen] = useState(false)

    // -------------------------
    // Load categories
    // -------------------------
    const loadCategories = useCallback(async () => {
        try {
            setLoading(true)

            const response = await clientCategoriesApi.list()
            setCategories(response.results)

        } catch {
            toast({
                title: "Error",
                description: "Failed to load categories",
                variant: "error",
            })
        } finally {
            setLoading(false)
        }
    }, [toast])

    useEffect(() => {
        loadCategories()
    }, [loadCategories])

    // -------------------------
    // Modal handlers
    // -------------------------
    const openAddCategory = () => {
        setSelectedCategory(null)

        setForm({
            name: "",
            discount: 0,
        })

        setIsFormOpen(true)
    }

    const openEditCategory = (category: ClientCategory) => {
        setSelectedCategory(category)

        setForm({
            name: category.name,
            discount: category.discount,
        })

        setIsFormOpen(true)
    }

    const openDeleteCategory = (category: ClientCategory) => {
        setSelectedCategory(category)
        setIsDeleteOpen(true)
    }

    const closeModals = () => {
        setIsFormOpen(false)
        setIsDeleteOpen(false)
        setSelectedCategory(null)
    }

    // -------------------------
    // Submit
    // -------------------------
    const submitCategory = async () => {
        try {
            if (selectedCategory) {
                await clientCategoriesApi.update(selectedCategory.id, form)

                toast({
                    title: "Category updated",
                    description: `${form.name} updated successfully`,
                })
            } else {
                await clientCategoriesApi.create(form)

                toast({
                    title: "Category created",
                    description: `${form.name} created successfully`,
                })
            }

            closeModals()
            await loadCategories()

        } catch {
            toast({
                title: "Error",
                description: "Failed to save category",
                variant: "error",
            })
        }
    }

    const confirmDelete = async () => {
        if (!selectedCategory) {return}

        try {
            await clientCategoriesApi.delete(selectedCategory.id)

            toast({
                title: "Category deleted",
                description: `${selectedCategory.name} removed`,
            })

            closeModals()
            await loadCategories()

        } catch {
            toast({
                title: "Error",
                description: "Failed to delete category",
                variant: "error",
            })
        }
    }

    // -------------------------
    // Public API
    // -------------------------
    return {
        categories,
        loading,

        form,
        setForm,

        selectedCategory,

        isFormOpen,
        isDeleteOpen,

        openAddCategory,
        openEditCategory,
        openDeleteCategory,

        submitCategory,
        confirmDelete,
        closeModals,
    }
}
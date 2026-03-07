import { useState, useEffect, useCallback } from "react"
import { clientsCreationApi} from "@/src/features/clients-creation/api";
import type { ClientCategory, ClientCategoryFormData } from "@/src/features/clients-creation/types"

export const useClientsCategories = () => {
    const [categories, setCategories] = useState<ClientCategory[]>([])
    const [loading, setLoading] = useState(false)

    const loadCategories = useCallback(async () => {
        try {
            setLoading(true)
            const res = await clientsCreationApi.listCategories()
            setCategories(res.results)
        } catch (e) {
            console.error("Failed to load categories", e)
        } finally {
            setLoading(false)
        }
    }, [])

    const createCategory = async (data: ClientCategoryFormData) => {
        const category = await clientsCreationApi.createCategory(data)
        setCategories(prev => [...prev, category])
        return category
    }

    useEffect(() => {
        loadCategories()
    }, [loadCategories])

    return {
        categories,
        loading,
        loadCategories,
        createCategory,
    }
}
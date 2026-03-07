"use client"

import { useState, useEffect, useCallback } from "react"
import { useToast } from "@/src/hooks/use-toast"

import { clientsCreationApi } from "../api"

import type { Client, ClientFormData } from "../types"

export function useClientsCreation() {

    const { toast } = useToast()

    // -------------------------
    // State
    // -------------------------

    const [clients, setClients] = useState<Client[]>([])
    const [loading, setLoading] = useState(false)

    const [form, setForm] = useState<ClientFormData>({
        name: "",
        email: "",
        phone: "",
        category: 0
    })

    // modals
    const [isFormOpen, setIsFormOpen] = useState(false)
    const [isDeleteOpen, setIsDeleteOpen] = useState(false)

    const [selectedClient, setSelectedClient] = useState<Client | null>(null)

    // -------------------------
    // Load clients
    // -------------------------

    const loadClients = useCallback(async () => {
        try {
            setLoading(true)

            const response = await clientsCreationApi.list()

            setClients(response.results)

        } catch (error) {

            toast({
                title: "Error",
                description: "Failed to load clients",
                variant: "error",
            })

        } finally {
            setLoading(false)
        }
    }, [toast])

    useEffect(() => {
        loadClients()
    }, [loadClients])

    // -------------------------
    // Modal handlers
    // -------------------------

    const openAddClient = () => {

        setSelectedClient(null)

        setForm({
            name: "",
            email: "",
            phone: "",
            category: 0
        })

        setIsFormOpen(true)
    }

    const openEditClient = (client: Client) => {

        setSelectedClient(client)

        setForm({
            name: client.name,
            email: client.email,
            phone: client.phone,
            category: client.category
        })

        setIsFormOpen(true)
    }

    const openDeleteClient = (client: Client) => {
        console.log("OPEN DELETE MODAL", client)
        setSelectedClient(client)
        setIsDeleteOpen(true)
    }

    const closeModals = () => {

        setIsFormOpen(false)
        setIsDeleteOpen(false)
        setSelectedClient(null)

    }

    // -------------------------
    // Submit
    // -------------------------

    const submitClient = async (data: ClientFormData) => {

        try {

            if (selectedClient) {

                await clientsCreationApi.update(selectedClient.id, data)

                toast({
                    title: "Client updated",
                    description: `${data.name} updated successfully`
                })

            } else {

                await clientsCreationApi.create(data)

                toast({
                    title: "Client created",
                    description: `${data.name} created successfully`
                })

            }

            closeModals()
            await loadClients()

        } catch (error) {

            toast({
                title: "Error",
                description: "Failed to save client",
                variant: "error"
            })

        }

    }

    // -------------------------
    // Delete
    // -------------------------

    const confirmDelete = async () => {

        if (!selectedClient) {return}

        try {

            await clientsCreationApi.remove(selectedClient.id)

            toast({
                title: "Client deleted",
                description: `${selectedClient.full_name} removed`
            })

            closeModals()
            await loadClients()

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

    // -------------------------
    // Public API
    // -------------------------

    return {

        clients,
        loading,

        createClient: clientsCreationApi.create,
        updateClient: clientsCreationApi.update,
        deleteClient: clientsCreationApi.remove,

        isFormOpen,
        isDeleteOpen,
        selectedClient,

        form,
        setForm,

        openAddClient,
        openEditClient,
        openDeleteClient,

        submitClient,
        confirmDelete,
        handleConfirm,
        closeModals,

    }
}
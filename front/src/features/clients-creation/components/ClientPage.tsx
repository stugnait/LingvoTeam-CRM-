"use client"

import { Button } from "@/src/components/ui/button"
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle
} from "@/src/components/ui/card"

import { Plus } from "lucide-react"

import { ClientTable } from "./ClientTable"

import { BaseFormModal } from "@/src/components/modals/BaseFormModal"
import { ConfirmModal } from "@/src/components/modals/ConfirmModal"

import { Input } from "@/src/components/ui/input"
import { Combobox } from "@/src/components/ui/Combobox"

import { DashboardHeader } from "@/src/shared/components/layout/DashboardHeader"

import { useClientsCreation } from "@/src/features/clients-creation/hooks/useClientsCreation"
import { useClientsCategories } from "@/src/features/clients-creation/hooks/useClientsCategories"

export function ClientPage() {

    const {
        clients,
        createClient,
        updateClient,
        deleteClient,

        isFormOpen,
        isDeleteOpen,
        selectedClient,

        form,
        setForm,

        openAddClient,
        openEditClient,
        openDeleteClient,

        submitClient,
        handleConfirm,
        closeModals,
    } = useClientsCreation()

    const { categories } = useClientsCategories()

    const categoryOptions = categories?.map(cat => ({
        value: String(cat.id),
        label: cat.name,
    }))

    return (
        <>
            <DashboardHeader />

            <main className="flex-1 overflow-y-auto p-6">

                <div className="mx-auto max-w-6xl space-y-6">

                    {/* Header */}
                    <div className="flex items-center justify-between">

                        <div>
                            <h2 className="text-2xl font-bold tracking-tight">
                                Clients
                            </h2>

                            <p className="text-muted-foreground">
                                Manage clients and categories
                            </p>
                        </div>

                        <Button onClick={openAddClient}>
                            <Plus className="h-4 w-4 mr-2" />
                            Add Client
                        </Button>

                    </div>

                    {/* Clients Table */}
                    <Card>

                        <CardHeader>

                            <CardTitle>
                                Clients List
                            </CardTitle>

                            <CardDescription>
                                All registered clients in the system
                            </CardDescription>

                        </CardHeader>

                        <CardContent className="p-0">

                            <ClientTable
                                clients={clients}
                                onEdit={openEditClient}
                                onDelete={(id) => {
                                    const client = clients.find(c => c.id === id)
                                    if (client) {
                                        openDeleteClient(client)
                                    }
                                }}
                            />

                        </CardContent>

                    </Card>

                </div>

            </main>

            {/* Create / Edit Modal */}

            <BaseFormModal
                open={isFormOpen}
                onOpenChange={(open) => !open && closeModals()}
                title={selectedClient ? "Edit Client" : "Add Client"}
                submitLabel={selectedClient ? "Update" : "Create"}
                onSubmit={() => submitClient(form)}
            >

                <div className="space-y-4">

                    <Input
                        placeholder="Client name"
                        value={form.name}
                        onChange={(e) =>
                            setForm(prev => ({
                                ...prev,
                                name: e.target.value,
                            }))
                        }
                    />

                    <Input
                        placeholder="Email"
                        value={form.email}
                        onChange={(e) =>
                            setForm(prev => ({
                                ...prev,
                                email: e.target.value,
                            }))
                        }
                    />

                    <Input
                        placeholder="Phone"
                        value={form.phone}
                        onChange={(e) =>
                            setForm(prev => ({
                                ...prev,
                                phone: e.target.value,
                            }))
                        }
                    />

                    <Combobox
                        options={categoryOptions}
                        value={String(form.category || "")}
                        onChange={(value) =>
                            setForm(prev => ({
                                ...prev,
                                category: Number(value),
                            }))
                        }
                        placeholder="Select category"
                    />

                </div>

            </BaseFormModal>

            {/* Delete Modal */}

            <ConfirmModal
                open={isDeleteOpen}
                onOpenChange={(open) => !open && closeModals()}
                title="Delete client"
                description={`Are you sure you want to delete ${selectedClient?.full_name}? This action cannot be undone.`}
                confirmLabel="Delete"
                onConfirm={handleConfirm}
            />
        </>
    )
}
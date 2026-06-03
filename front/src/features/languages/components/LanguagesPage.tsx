"use client"

import { useState } from "react"
import { Button } from "@/src/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/src/components/ui/card"
import { Plus } from "lucide-react"

import { LanguageTable } from "./LanguageTable"
import { BaseFormModal } from "@/src/components/modals/BaseFormModal"
import { ConfirmModal } from "@/src/components/modals/ConfirmModal"
import { Input } from "@/src/components/ui/input"
import { DashboardHeader } from "@/src/shared/components/layout/DashboardHeader"

import { useLanguages } from "../hooks/useLanguages"
import type { Language } from "../types"

export function LanguagesPage() {
    const { languages, loading, addLanguage, removeLanguage, page, totalPages, onPageChange, search, setSearch } = useLanguages()


    const [isFormOpen, setIsFormOpen] = useState(false)
    const [isDeleteOpen, setIsDeleteOpen] = useState(false)
    
    const [selectedLanguage, setSelectedLanguage] = useState<Language | null>(null)
    const [form, setForm] = useState({ name: "", slug: "" })
    const [isSubmitting, setIsSubmitting] = useState(false)
    
    const openAddLanguage = () => {
        setForm({ name: "", slug: "" })
        setIsFormOpen(true)
    }
    
    const openDeleteLanguage = (language: Language) => {
        setSelectedLanguage(language)
        setIsDeleteOpen(true)
    }
    
    const closeModals = () => {
        setIsFormOpen(false)
        setIsDeleteOpen(false)
        setTimeout(() => setSelectedLanguage(null), 200) // Очищення після анімації закриття
    }
    
    const submitLanguage = async () => {
        if (!form.name || !form.slug) {return}

        setIsSubmitting(true)
        try {
            await addLanguage(form)
            closeModals()
        } catch (error) {
            console.error("Помилка створення мови", error)
        } finally {
            setIsSubmitting(false)
        }
    }

    // Обробка підтвердження видалення
    const confirmDelete = async () => {
        if (!selectedLanguage) return

        try {
            await removeLanguage(selectedLanguage.id)
            closeModals()
        } catch (error) {
            console.error("Помилка видалення мови", error)
        }
    }

    return (
        <>
            <DashboardHeader />

            <main className="flex-1 overflow-y-auto p-4 sm:p-6">
                <div className="w-full min-w-0 space-y-4 sm:space-y-6">

                    {/* Header сторінки */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div>
                            <h2 className="text-xl sm:text-2xl font-bold tracking-tight">
                                Languages
                            </h2>
                            <p className="text-muted-foreground">
                                Manage supported languages in the system
                            </p>
                        </div>

                        <Button onClick={openAddLanguage} className="shrink-0">
                            <Plus className="h-4 w-4 sm:mr-2" />
                            <span className="hidden sm:inline">Add Language</span>
                        </Button>
                    </div>

                    <Card>
                        <CardHeader>
                            <CardTitle>Search</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Input
                                placeholder="Search by name or slug..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </CardContent>
                    </Card>

                    {/* Картка з таблицею */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Languages List</CardTitle>
                            <CardDescription>
                                All available languages for creating pairs
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="p-0">
                            <LanguageTable
                                languages={languages}
                                loading={loading}
                                onDelete={(language) => language && openDeleteLanguage(language)}
                                page={page}
                                totalPages={totalPages}
                                onPageChange={onPageChange}
                            />
                        </CardContent>
                    </Card>

                </div>
            </main>

            {/* Модалка додавання/редагування */}
            <BaseFormModal
                open={isFormOpen}
                onOpenChange={(open) => !open && closeModals()}
                title="Add Language"
                submitLabel={isSubmitting ? "Saving..." : "Create"}
                onSubmit={submitLanguage}
            >
                <div className="space-y-4">
                    <div>
                        <label className="text-sm font-medium mb-1 block">Language Name</label>
                        <Input
                            placeholder="Ex: English"
                            value={form.name}
                            onChange={(e) => setForm(prev => ({ ...prev, name: e.target.value }))}
                            autoFocus
                        />
                    </div>
                    <div>
                        <label className="text-sm font-medium mb-1 block">Slug (Code)</label>
                        <Input
                            placeholder="Ex: en"
                            value={form.slug}
                            onChange={(e) => setForm(prev => ({ ...prev, slug: e.target.value }))}
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                            A short identifier (e.g., "en", "uk").
                        </p>
                    </div>
                </div>
            </BaseFormModal>

            {/* Модалка видалення */}
            <ConfirmModal
                open={isDeleteOpen}
                onOpenChange={(open) => !open && closeModals()}
                title="Delete language"
                description={`Are you sure you want to delete "${selectedLanguage?.name}"? This action cannot be undone.`}
                confirmLabel="Delete"
                onConfirm={confirmDelete}
            />
        </>
    )
}
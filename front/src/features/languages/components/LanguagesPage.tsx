"use client"

import { useState } from "react"
import { Button } from "@/src/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/src/components/ui/card"
import { Globe2, Plus } from "lucide-react"

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
        if (!selectedLanguage) {
            return
        }

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
                description="Add a new language to your system."
                icon={<Globe2 className="h-7 w-7" />}
                submitLabel={isSubmitting ? "Saving..." : "Create"}
                isLoading={isSubmitting}
                onSubmit={submitLanguage}
                variant="reference"
                className="max-w-[512px] sm:max-w-[512px]"
                headerClassName="px-6 pb-3 pt-6"
                bodyClassName="px-6 pb-5"
                footerClassName="px-6 py-4"
            >
                <div className="space-y-5">
                    <div>
                        <label className="mb-2 block text-sm font-semibold text-slate-950">
                            Language Name <span className="text-red-500">*</span>
                        </label>
                        <Input
                            placeholder="Ex: English"
                            value={form.name}
                            onChange={(e) => setForm(prev => ({ ...prev, name: e.target.value }))}
                            autoFocus
                            className="h-12 rounded-xl border-slate-200 bg-white px-4 text-sm text-slate-950 shadow-sm placeholder:text-slate-400 focus-visible:border-blue-500 focus-visible:ring-4 focus-visible:ring-blue-100"
                        />
                    </div>
                    <div>
                        <label className="mb-2 block text-sm font-semibold text-slate-950">
                            Slug (Code) <span className="text-red-500">*</span>
                        </label>
                        <Input
                            placeholder="Ex: en"
                            value={form.slug}
                            onChange={(e) => setForm(prev => ({ ...prev, slug: e.target.value }))}
                            className="h-12 rounded-xl border-slate-200 bg-white px-4 text-sm text-slate-950 shadow-sm placeholder:text-slate-400 focus-visible:border-blue-500 focus-visible:ring-4 focus-visible:ring-blue-100"
                        />
                        <p className="mt-2 text-xs leading-5 text-slate-500">
                            A short identifier (e.g., &quot;en&quot;, &quot;uk&quot;).
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

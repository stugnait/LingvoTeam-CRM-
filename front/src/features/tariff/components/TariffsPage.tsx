"use client"

import { Button } from "@/src/components/ui/button"
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/src/components/ui/card"
import { Plus } from "lucide-react"

import { TariffTable } from "./TariffTable"
import { useTariffs } from "../hooks/useTariff"
import { TariffForm } from "./TariffForm"

import { BaseFormModal } from "@/src/components/modals/BaseFormModal"
import { Input } from "@/src/components/ui/input"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/src/components/ui/select"

import { DashboardHeader } from "@/src/shared/components/layout/DashboardHeader"
import { ConfirmModal } from "@/src/components/modals/ConfirmModal"
import { useI18n } from "@/src/shared/i18n/I18nProvider"

export function TariffsPage() {
    const { t } = useI18n()
    const {
        tariffs,
        categories,
        currencies,
        languages,
        languagePairs,
        isFormOpen,
        selectedTariff,
        form,
        setForm,
        errors,
        openAddTariff,
        openEditTariff,
        closeModals,
        submitTariff,
        isDeleteOpen,
        openDeleteTariff,
        confirmDelete,
        page,
        totalPages,
        onPageChange,
        isNewPairModalOpen,
        setIsNewPairModalOpen,
        newPairForm,
        setNewPairForm,
        newPairLoading,
        createAndSelectPair,
    } = useTariffs()

    return (
        <>
            <DashboardHeader />

            <main className="flex-1 overflow-y-auto p-3 sm:p-6">
                <div className="w-full min-w-0 space-y-4 sm:space-y-6">

                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                        <div>
                            <h2 className="text-2xl font-bold tracking-tight">{t("tariffs.title")}</h2>
                            <p className="text-muted-foreground">
                                {t("tariffs.description")}
                            </p>
                        </div>
                        <Button onClick={openAddTariff}>
                            <Plus className="h-4 w-4 mr-2" />
                            {t("tariffs.add")}
                        </Button>
                    </div>

                    <Card>
                        <CardHeader>
                            <CardTitle>{t("tariffs.listTitle")}</CardTitle>
                            <CardDescription>{t("tariffs.listDescription")}</CardDescription>
                        </CardHeader>
                        <CardContent className="p-0">
                            <TariffTable
                                tariffs={tariffs}
                                onEdit={openEditTariff}
                                onDelete={openDeleteTariff}
                                page={page}
                                totalPages={totalPages}
                                onPageChange={onPageChange}
                            />
                        </CardContent>
                    </Card>
                </div>
            </main>

            <BaseFormModal
                open={isFormOpen}
                onOpenChange={(open) => !open && closeModals()}
                title={selectedTariff ? t("tariffs.edit") : t("tariffs.add")}
                submitLabel={selectedTariff ? t("tariffs.update") : t("common.create")}
                onSubmit={() => submitTariff(form)}
            >
                <div className="space-y-4">

                    {/* Name */}
                    <Input
                        placeholder={t("tariffs.namePlaceholder")}
                        value={form.name}
                        className={errors?.name ? "border-red-500" : ""}
                        onChange={(e) =>
                            setForm(prev => ({...prev, name: e.target.value}))
                        }
                    />
                    {errors?.name && (
                        <p className="text-xs text-red-500 -mt-2">{errors.name}</p>
                    )}

                    {/* Language Pair */}
                    <TariffForm
                        form={form}
                        setForm={setForm}
                        errors={errors}
                        languages={languages}
                        languagePairs={languagePairs}
                        isNewPairModalOpen={isNewPairModalOpen}
                        setIsNewPairModalOpen={setIsNewPairModalOpen}
                        newPairForm={newPairForm}
                        setNewPairForm={setNewPairForm}
                        newPairLoading={newPairLoading}
                        createAndSelectPair={createAndSelectPair}
                    />

                    {/* Currency */}
                    <Select
                        value={String(form.currency_id || "")}
                        onValueChange={(val) =>
                            setForm(prev => ({
                                ...prev,
                                currency_id: Number(val),
                            }))
                        }
                    >
                        <SelectTrigger className={errors?.currency_id ? "border-red-500" : ""}>
                            <SelectValue placeholder={t("orders.currency")}/>
                        </SelectTrigger>

                        <SelectContent>
                            {currencies.map(currency => (
                                <SelectItem key={currency.id} value={String(currency.id)}>
                                    {currency.code}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    {errors?.currency_id && (
                        <p className="text-xs text-red-500 -mt-2">
                            {errors.currency_id}
                        </p>
                    )}

                    {/* Category */}
                    <Select
                        value={String(form.category || "")}
                        onValueChange={(val) =>
                            setForm(prev => ({
                                ...prev,
                                category: Number(val),
                            }))
                        }
                    >
                        <SelectTrigger className={errors?.category ? "border-red-500" : ""}>
                            <SelectValue placeholder={t("clients.selectCategory")}/>
                        </SelectTrigger>

                        <SelectContent>
                            {categories.map(category => (
                                <SelectItem key={category.id} value={String(category.id)}>
                                    {category.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    {errors?.category && (
                        <p className="text-xs text-red-500 -mt-2">
                            {errors.category}
                        </p>
                    )}

                    {/* Tariff Type */}
                    <Select
                        value={form.price_type}
                        onValueChange={(val: "page" | "action") =>
                            setForm(prev => ({
                                ...prev,
                                price_type: val,
                                price_per_page: val === "page" ? prev.price_per_page : "0",
                                price_per_action: val === "action" ? prev.price_per_action : "0",
                            }))
                        }
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="Тип тарифу"/>
                        </SelectTrigger>

                        <SelectContent>
                            <SelectItem value="page">
                                За сторінку
                            </SelectItem>

                            <SelectItem value="action">
                                За файл
                            </SelectItem>
                        </SelectContent>
                    </Select>

                    {/* Price */}
                    {form.price_type === "page" ? (
                        <>
                            <Input
                                type="number"
                                min="0"
                                step="any"
                                placeholder={t("translators.pricePerPage")}
                                className={`[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${
                                    errors?.price_per_page ? "border-red-500" : ""
                                }`}
                                onKeyDown={(e) => {
                                    if (["-", "e", "E", "+"].includes(e.key)) {
                                        e.preventDefault();
                                    }
                                }}
                                onFocus={(e) => e.target.select()}
                                value={String(form.price_per_page) === "0" ? "" : form.price_per_page}
                                onChange={(e) =>
                                    setForm(prev => ({
                                        ...prev,
                                        price_per_page: e.target.value || "0",
                                    }))
                                }
                            />

                            {errors?.price_per_page && (
                                <p className="text-xs text-red-500 -mt-2">
                                    {errors.price_per_page}
                                </p>
                            )}
                        </>
                    ) : (
                        <>
                            <Input
                                type="number"
                                min="0"
                                step="any"
                                placeholder={t("translators.pricePerAction")}
                                className={`[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${
                                    errors?.price_per_action ? "border-red-500" : ""
                                }`}
                                onKeyDown={(e) => {
                                    if (["-", "e", "E", "+"].includes(e.key)) {
                                        e.preventDefault();
                                    }
                                }}
                                onFocus={(e) => e.target.select()}
                                value={String(form.price_per_action) === "0" ? "" : form.price_per_action}
                                onChange={(e) =>
                                    setForm(prev => ({
                                        ...prev,
                                        price_per_action: e.target.value || "0",
                                    }))
                                }
                            />

                            {errors?.price_per_action && (
                                <p className="text-xs text-red-500 -mt-2">
                                    {errors.price_per_action}
                                </p>
                            )}
                        </>
                    )}

                </div>
            </BaseFormModal>

            <ConfirmModal
                open={isDeleteOpen}
                onOpenChange={(open) => !open && closeModals()}
                onConfirm={confirmDelete}
                title={t("tariffs.deleteTitle")}
                description={t("tariffs.deleteDescription")}
            />
        </>
    )
}

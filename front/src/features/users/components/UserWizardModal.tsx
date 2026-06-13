"use client"

import { useMemo } from "react"
import { Dialog, DialogContent } from "@/src/components/ui/dialog"
import { Button } from "@/src/components/ui/button"
import { Input } from "@/src/components/ui/input"
import { cn } from "@/src/lib/utils"
import {
    Upload, User as UserIcon, ArrowRight, ArrowLeft,
    Check, Lock, ChevronRight,
} from "lucide-react"
import { PatternFormat } from "react-number-format"
import {
    Select, SelectContent, SelectItem,
    SelectTrigger, SelectValue,
} from "@/src/components/ui/select"
import { TAB_PRESETS } from "../hooks/useRoles"
import type { Permission, Role } from "../types"
import type { UserFormData } from "../types"

// -----------------------------------------------------------------------
// Які таби є обов'язковими (locked) для кожного slug ролі
// -----------------------------------------------------------------------
const ROLE_LOCKED_TABS: Record<string, string[]> = {
    manager:   ["Orders"],
    editor:    ["Tasks"],
    financier: ["PnL"],
    admin:     ["Users", "Orders"],
}

interface UserWizardModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    isEdit: boolean

    // Wizard step
    step: 1 | 2
    onNextStep: () => void
    onPrevStep: () => void

    // Form
    form: UserFormData
    setForm: React.Dispatch<React.SetStateAction<UserFormData>>
    errors: Partial<Record<keyof UserFormData, string>>

    // Data
    roles: Role[]
    permissions: Permission[]

    // Submit
    onSubmit: () => void
}

export function UserWizardModal({
                                    open, onOpenChange,
                                    isEdit,
                                    step, onNextStep, onPrevStep,
                                    form, setForm, errors,
                                    roles, permissions,
                                    onSubmit,
                                }: UserWizardModalProps) {

    // Preview аватарки
    const avatarPreview = useMemo(() => {
        if (!form.avatar) { return null }
        if (typeof form.avatar === "string") { return form.avatar }
        if (form.avatar instanceof File) { return URL.createObjectURL(form.avatar) }
        return null
    }, [form.avatar])

    const safeRoles = Array.isArray(roles) ? roles : []

    const selectedRoleObj = safeRoles.find(r => r.id === form.role) ?? null

    const lockedTabs = selectedRoleObj
        ? (ROLE_LOCKED_TABS[selectedRoleObj.slug ?? ""] ?? [])
        : []

    const isEditorRole = selectedRoleObj?.slug === "editor"

    // Обчислюємо які permission_ids вже є у ролі (базові — locked)
    const rolePermissionIds = useMemo(() => {
        if (!selectedRoleObj) { return new Set<number>() }
        return new Set(
            permissions
                .filter(p =>
                    Object.entries(TAB_PRESETS).some(([tabKey, preset]) =>
                        lockedTabs.includes(tabKey) && preset.slugs.includes(p.slug)
                    )
                )
                .map(p => p.id)
        )
    }, [selectedRoleObj, permissions, lockedTabs])

    // Toggle окремого таба (тільки не-locked)
    const toggleTab = (tabKey: string) => {
        if (lockedTabs.includes(tabKey)) { return }

        const preset = TAB_PRESETS[tabKey]
        const tabPerms = permissions.filter(p => preset.slugs.includes(p.slug))
        const tabIds = tabPerms.map(p => p.id)
        const allSelected = tabIds.every(id => form.extra_permission_ids?.includes(id))

        setForm(prev => ({
            ...prev,
            extra_permission_ids: allSelected
                ? (prev.extra_permission_ids ?? []).filter(id => !tabIds.includes(id))
                : [...new Set([...(prev.extra_permission_ids ?? []), ...tabIds])],
        }))
    }

    const isTabSelected = (tabKey: string): boolean => {
        if (lockedTabs.includes(tabKey)) { return true }
        const preset = TAB_PRESETS[tabKey]
        const tabPerms = permissions.filter(p => preset.slugs.includes(p.slug))
        if (tabPerms.length === 0) { return false }
        return tabPerms.every(p => form.extra_permission_ids?.includes(p.id))
    }

    const extraCount = form.extra_permission_ids?.length ?? 0

    const toggleIsTranslator = () => {
        setForm(prev => ({
            ...prev,
            is_translator: !prev.is_translator,
            // скидаємо currency якщо знімають галочку
            currency_id: prev.is_translator ? null : prev.currency_id,
        }))
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="p-0 gap-0 max-w-lg w-[95vw] sm:w-full overflow-hidden bg-background">

                {/* ── Прогрес-хедер ── */}
                <div className="px-4 sm:px-6 pt-4 sm:pt-5 pb-3 sm:pb-4 border-b shrink-0">
                    <div className="flex items-center justify-between mb-3">
                        <h2 className="text-base font-semibold">
                            {isEdit ? "Редагування користувача" : "Новий користувач"}
                        </h2>
                        <span className="text-xs text-muted-foreground">
                            Крок {step} з 2
                        </span>
                    </div>

                    {/* Прогрес-бар */}
                    <div className="flex gap-2">
                        {[1, 2].map(n => (
                            <div
                                key={n}
                                className={cn(
                                    "h-1 flex-1 rounded-full transition-all duration-300",
                                    step >= n ? "bg-primary" : "bg-muted"
                                )}
                            />
                        ))}
                    </div>

                    {/* Лейбли кроків */}
                    <div className="flex mt-2">
                        <span className={cn("flex-1 text-xs", step === 1 ? "text-primary font-medium" : "text-muted-foreground")}>
                            Особисті дані
                        </span>
                        <span className={cn("flex-1 text-xs text-right", step === 2 ? "text-primary font-medium" : "text-muted-foreground")}>
                            Роль та доступи
                        </span>
                    </div>
                </div>

                {/* ── Sliding content ── */}
                <div className="relative overflow-hidden" style={{ minHeight: 380 }}>

                    {/* КРОК 1 — особисті дані */}
                    <div
                        className={cn(
                            "absolute inset-0 flex flex-col gap-5 p-4 sm:p-6 transition-transform duration-300 ease-in-out",
                            step === 1 ? "translate-x-0" : "-translate-x-full"
                        )}
                    >
                        {/* Аватар */}
                        <div className="flex items-center gap-4">
                            <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-full border bg-muted flex items-center justify-center">
                                {avatarPreview ? (
                                    <img src={avatarPreview} alt="Avatar" className="h-full w-full object-cover" />
                                ) : (
                                    <UserIcon className="h-7 w-7 text-muted-foreground" />
                                )}
                            </div>
                            <div className="flex items-center gap-2">
                                <Input
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    id="wizard-avatar-upload"
                                    onChange={(e) => {
                                        const file = e.target.files?.[0]
                                        if (file) { setForm(prev => ({ ...prev, avatar: file })) }
                                        e.target.value = ""
                                    }}
                                />
                                <Button asChild variant="outline" size="sm">
                                    <label htmlFor="wizard-avatar-upload" className="cursor-pointer">
                                        <Upload className="h-4 w-4 mr-2" />
                                        Фото
                                    </label>
                                </Button>
                                {form.avatar && (
                                    <Button
                                        type="button" variant="ghost" size="sm"
                                        className="text-destructive hover:text-destructive"
                                        onClick={() => setForm(prev => ({ ...prev, avatar: null }))}
                                    >
                                        Видалити
                                    </Button>
                                )}
                            </div>
                        </div>

                        {/* Поля */}
                        <div className="space-y-4">
                            <div>
                                <Input
                                    placeholder="Повне ім'я"
                                    value={form.full_name}
                                    onChange={(e) => setForm(prev => ({ ...prev, full_name: e.target.value }))}
                                    className={errors.full_name ? "border-destructive" : ""}
                                />
                                {errors.full_name && (
                                    <p className="text-xs text-destructive mt-1">{errors.full_name}</p>
                                )}
                            </div>

                            <div>
                                <Input
                                    placeholder="Email"
                                    value={form.email}
                                    onChange={(e) => setForm(prev => ({ ...prev, email: e.target.value }))}
                                    className={errors.email ? "border-destructive" : ""}
                                />
                                {errors.email && (
                                    <p className="text-xs text-destructive mt-1">{errors.email}</p>
                                )}
                            </div>

                            <div>
                                <PatternFormat
                                    format="+38 (###) ###-##-##"
                                    allowEmptyFormatting
                                    mask="_"
                                    value={form.phone}
                                    customInput={Input}
                                    type="tel"
                                    className={errors.phone ? "border-destructive" : ""}
                                    onValueChange={(values) =>
                                        setForm(prev => ({ ...prev, phone: values.formattedValue }))
                                    }
                                />
                                {errors.phone && (
                                    <p className="text-xs text-destructive mt-1">{errors.phone}</p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* КРОК 2 — роль + доступи */}
                    <div
                        className={cn(
                            "absolute inset-0 flex flex-col gap-4 p-4 sm:p-6 transition-transform duration-300 ease-in-out overflow-y-auto",
                            step === 2 ? "translate-x-0" : "translate-x-full"
                        )}
                    >
                        {/* Вибір ролі */}
                        <div>
                            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-2">
                                Основна роль <span className="text-destructive">*</span>
                            </label>
                            <Select
                                value={String(form.role || "")}
                                onValueChange={(value) => {
                                    setForm(prev => ({
                                        ...prev,
                                        role: Number(value),
                                        extra_permission_ids: [],
                                        // скидаємо translator-поля при зміні ролі
                                        is_translator: false,
                                        currency_id: null,
                                    }))
                                }}
                            >
                                <SelectTrigger className={errors.role ? "border-destructive" : ""}>
                                    <SelectValue placeholder="Оберіть роль..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {safeRoles.map(role => (
                                        <SelectItem key={role.id} value={String(role.id)}>
                                            {role.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {errors.role && (
                                <p className="text-xs text-destructive mt-1">{errors.role}</p>
                            )}
                        </div>

                        {/* ── Галочка "також перекладач" — тільки для editor ── */}
                        {isEditorRole && (
                            <div className="rounded-xl border border-border bg-muted/30 p-3 space-y-3">
                                {/* Чекбокс */}
                                <button
                                    type="button"
                                    onClick={toggleIsTranslator}
                                    className="flex items-center gap-3 w-full text-left"
                                >
                                    <div className={cn(
                                        "h-5 w-5 rounded border flex items-center justify-center shrink-0 transition-all",
                                        form.is_translator
                                            ? "bg-primary border-primary text-primary-foreground"
                                            : "border-input bg-background"
                                    )}>
                                        {form.is_translator && <Check className="h-3.5 w-3.5" />}
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium">Також є перекладачем</p>
                                        <p className="text-xs text-muted-foreground">
                                            Буде створено запис у таблиці перекладачів
                                        </p>
                                    </div>
                                </button>

                                {/* Поле currency_id — з'являється тільки якщо галочка активна */}
                                {form.is_translator && (
                                    <div>
                                        <label className="text-xs text-muted-foreground block mb-1">
                                            ID валюти <span className="text-destructive">*</span>
                                        </label>
                                        <Input
                                            type="number"
                                            placeholder="Введіть currency_id"
                                            value={form.currency_id ?? ""}
                                            onChange={(e) =>
                                                setForm(prev => ({
                                                    ...prev,
                                                    currency_id: e.target.value ? Number(e.target.value) : null,
                                                }))
                                            }
                                            className={errors.currency_id ? "border-destructive" : ""}
                                        />
                                        {errors.currency_id && (
                                            <p className="text-xs text-destructive mt-1">{errors.currency_id}</p>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Таби — показуємо тільки якщо роль вибрана */}
                        {selectedRoleObj ? (
                            <div>
                                <div className="flex items-center justify-between mb-3">
                                    <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                        Модулі доступу
                                    </label>
                                    <span className="text-xs text-muted-foreground">
                                        {extraCount > 0 && `+${extraCount} додаткових прав`}
                                    </span>
                                </div>

                                <div className="grid grid-cols-1 gap-2">
                                    {Object.entries(TAB_PRESETS).map(([tabKey, preset]) => {
                                        const isLocked = lockedTabs.includes(tabKey)
                                        const isSelected = isTabSelected(tabKey)
                                        const tabPerms = permissions.filter(p => preset.slugs.includes(p.slug))
                                        const hasPerms = tabPerms.length > 0

                                        return (
                                            <button
                                                key={tabKey}
                                                type="button"
                                                disabled={isLocked || !hasPerms}
                                                onClick={() => toggleTab(tabKey)}
                                                className={cn(
                                                    "flex items-center justify-between px-4 py-3 rounded-xl border text-left transition-all",
                                                    isSelected && isLocked
                                                        ? "border-primary/40 bg-primary/5 cursor-default"
                                                        : isSelected
                                                            ? "border-primary bg-primary/5 shadow-sm"
                                                            : "border-border bg-background hover:border-primary/30",
                                                    (!hasPerms) && "opacity-40 cursor-not-allowed"
                                                )}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <span className="text-lg">{preset.icon}</span>
                                                    <div>
                                                        <p className={cn(
                                                            "text-sm font-medium",
                                                            isSelected ? "text-primary" : "text-foreground"
                                                        )}>
                                                            {preset.label}
                                                        </p>
                                                        {isLocked && (
                                                            <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                                                                <Lock className="h-3 w-3" />
                                                                Обов&#39;язковий для цієї ролі
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>

                                                <div className={cn(
                                                    "h-5 w-5 rounded border flex items-center justify-center shrink-0 transition-all",
                                                    isSelected
                                                        ? "bg-primary border-primary text-primary-foreground"
                                                        : "border-input bg-muted/50"
                                                )}>
                                                    {isSelected && (
                                                        isLocked
                                                            ? <Lock className="h-3 w-3 text-primary-foreground" />
                                                            : <Check className="h-3.5 w-3.5" />
                                                    )}
                                                </div>
                                            </button>
                                        )
                                    })}
                                </div>
                            </div>
                        ) : (
                            <div className="flex-1 flex items-center justify-center">
                                <p className="text-sm text-muted-foreground text-center">
                                    Спочатку оберіть роль,<br />щоб побачити доступні модулі
                                </p>
                            </div>
                        )}
                    </div>
                </div>

                {/* ── Футер ── */}
                <div className="px-4 sm:px-6 py-3 sm:py-4 border-t shrink-0 flex items-center justify-between bg-background">
                    {step === 1 ? (
                        <>
                            <Button variant="ghost" onClick={() => onOpenChange(false)}>
                                Скасувати
                            </Button>
                            <Button onClick={onNextStep}>
                                Далі
                                <ArrowRight className="h-4 w-4 ml-2" />
                            </Button>
                        </>
                    ) : (
                        <>
                            <Button variant="ghost" onClick={onPrevStep}>
                                <ArrowLeft className="h-4 w-4 mr-2" />
                                Назад
                            </Button>
                            <Button onClick={onSubmit}>
                                {isEdit ? "Зберегти зміни" : "Створити користувача"}
                                <ChevronRight className="h-4 w-4 ml-2" />
                            </Button>
                        </>
                    )}
                </div>

            </DialogContent>
        </Dialog>
    )
}
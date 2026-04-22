"use client"

import { useEffect, useState } from "react"
import { cn } from "@/src/lib/utils"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/src/components/ui/table"
import { User } from "@/src/features/users/types"
import { useSalaryManagement } from "@/src/features/salary/hooks/useSalary"
import { Salary } from "@/src/features/salary/types"

// ─── Constants ───────────────────────────────────────────────────────────────

const roles = [
    { key: 1, label: "Менеджер" },
    { key: 2, label: "Редактор" },
    { key: 4, label: "Фінансист" },
    { key: 5, label: "Перекладачі" },
]

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatCurrency(val: number) {
    return new Intl.NumberFormat("uk-UA", {
        style: "currency",
        currency: "UAH",
        maximumFractionDigits: 0,
    }).format(val)
}

function today() {
    return new Date().toISOString().split("T")[0]
}

function firstDayOfMonth() {
    const d = new Date()
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`
}

// ─── Salary History Modal ─────────────────────────────────────────────────────

function SalaryHistoryModal({
                                user,
                                salaries,
                                onClose,
                            }: {
    user: User
    salaries: Salary[]
    onClose: () => void
}) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden">
                <div className="px-6 py-5 border-b flex items-center justify-between">
                    <div>
                        <p className="text-xs text-slate-400 font-medium uppercase tracking-widest mb-0.5">Транзакції</p>
                        <h2 className="text-lg font-semibold text-slate-800">{user.full_name}</h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
                    >
                        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                            <path d="M1 1l12 12M13 1L1 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                        </svg>
                    </button>
                </div>

                <div className="max-h-96 overflow-y-auto">
                    {salaries.length === 0 ? (
                        <div className="py-12 text-center text-slate-400 text-sm">
                            Немає збережених зарплат
                        </div>
                    ) : (
                        <table className="w-full text-sm">
                            <thead className="bg-slate-50 sticky top-0">
                            <tr>
                                <th className="text-left px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Період</th>
                                <th className="text-right px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Ставка</th>
                                <th className="text-right px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Всього</th>
                            </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                            {salaries.map(s => (
                                <tr key={s.id} className="hover:bg-slate-50/60 transition-colors">
                                    <td className="px-6 py-3 text-slate-700">
                                        {s.start_date} — {s.end_date}
                                    </td>
                                    <td className="px-6 py-3 text-right text-slate-600">
                                        {formatCurrency(s.base_salary ?? 0)}
                                    </td>
                                    <td className="px-6 py-3 text-right font-semibold text-emerald-600">
                                        {formatCurrency((s.base_salary ?? 0) + (s.bonus ?? 0) + (s.premium ?? 0))}
                                    </td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    )}
                </div>

                <div className="px-6 py-4 border-t bg-slate-50 flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-200 transition-colors"
                    >
                        Закрити
                    </button>
                </div>
            </div>
        </div>
    )
}

// ─── Preview / Salary Modal ───────────────────────────────────────────────────

function SalaryModal({
                         user,
                         preview,
                         formValues,
                         computedTotal,
                         createState,
                         onDatesConfirm,
                         onUpdateField,
                         onSave,
                         onClose,
                     }: {
    user: User
    preview: ReturnType<typeof useSalaryManagement>["preview"]
    formValues: ReturnType<typeof useSalaryManagement>["formValues"]
    computedTotal: number
    createState: ReturnType<typeof useSalaryManagement>["createState"]
    onDatesConfirm: (start: string, end: string) => void
    onUpdateField: (field: "base_salary" | "bonus" | "premium", val: number) => void
    onSave: () => void
    onClose: () => void
}) {
    const [localStart, setLocalStart] = useState(firstDayOfMonth())
    const [localEnd, setLocalEnd] = useState(today())
    const [datesConfirmed, setDatesConfirmed] = useState(false)

    function handleConfirmDates() {
        if (!localStart || !localEnd) return
        setDatesConfirmed(true)
        onDatesConfirm(localStart, localEnd)
    }

    async function handleSave() {
        await onSave()
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
                {/* Header */}
                <div className="px-6 py-5 border-b flex items-center justify-between">
                    <div>
                        <p className="text-xs text-slate-400 font-medium uppercase tracking-widest mb-0.5">Нарахування зарплати</p>
                        <h2 className="text-lg font-semibold text-slate-800">{user.full_name}</h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
                    >
                        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                            <path d="M1 1l12 12M13 1L1 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                        </svg>
                    </button>
                </div>

                <div className="px-6 py-5 space-y-5">
                    {/* Step 1: Dates */}
                    <div className="space-y-3">
                        <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">
                            Крок 1 — Виберіть період
                        </p>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-xs text-slate-500 mb-1">Від</label>
                                <input
                                    type="date"
                                    value={localStart}
                                    onChange={e => { setLocalStart(e.target.value); setDatesConfirmed(false) }}
                                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-300"
                                />
                            </div>
                            <div>
                                <label className="block text-xs text-slate-500 mb-1">До</label>
                                <input
                                    type="date"
                                    value={localEnd}
                                    onChange={e => { setLocalEnd(e.target.value); setDatesConfirmed(false) }}
                                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-300"
                                />
                            </div>
                        </div>
                        <button
                            onClick={handleConfirmDates}
                            disabled={!localStart || !localEnd || preview.loading}
                            className="w-full py-2 rounded-lg text-sm font-medium bg-slate-800 text-white hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                        >
                            {preview.loading ? "Завантаження..." : "Переглянути статистику"}
                        </button>
                    </div>

                    {/* Step 2: Stats */}
                    {preview.error && (
                        <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-600">
                            {preview.error}
                        </div>
                    )}

                    {preview.data && (
                        <>
                            {/* Stats block */}
                            <div className="rounded-xl bg-slate-50 border border-slate-200 divide-y divide-slate-200">
                                <div className="grid grid-cols-3 divide-x divide-slate-200">
                                    {[
                                        { label: "Замовлень", value: preview.data.orders_count },
                                        { label: "Прострочено", value: preview.data.overdue_orders_count },
                                        { label: "Виручка", value: formatCurrency(Number(preview.data.revenue ?? 0)) },
                                    ].map(item => (
                                        <div key={item.label} className="py-3 px-4 text-center">
                                            <p className="text-xs text-slate-400 mb-0.5">{item.label}</p>
                                            <p className="font-semibold text-slate-800 text-sm">{item.value}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Step 2: Form */}
                            <div className="space-y-3">
                                <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">
                                    Крок 2 — Нарахування
                                </p>
                                {(
                                    [
                                        { field: "base_salary", label: "Ставка", placeholder: "0" },
                                        { field: "bonus", label: "Бонус", placeholder: "0" },
                                        { field: "premium", label: "Премія", placeholder: "0" },
                                    ] as const
                                ).map(({ field, label, placeholder }) => (
                                    <div key={field} className="flex items-center gap-3">
                                        <label className="w-20 text-sm text-slate-500 shrink-0">{label}</label>
                                        <input
                                            type="number"
                                            min={0}
                                            value={formValues[field] || ""}
                                            placeholder={placeholder}
                                            onChange={e => onUpdateField(field, Number(e.target.value))}
                                            className="flex-1 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-300"
                                        />
                                        <span className="text-xs text-slate-400 w-4">₴</span>
                                    </div>
                                ))}

                                {/* Total */}
                                <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                                    <span className="text-sm font-medium text-slate-600">Разом</span>
                                    <span className="text-lg font-bold text-emerald-600">
                                        {formatCurrency(computedTotal)}
                                    </span>
                                </div>
                            </div>
                        </>
                    )}

                    {/* Errors / Success */}
                    {createState.error && (
                        <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-600">
                            {createState.error}
                        </div>
                    )}
                    {createState.success && (
                        <div className="rounded-lg bg-emerald-50 border border-emerald-200 px-4 py-3 text-sm text-emerald-700 font-medium">
                            ✓ Зарплату збережено!
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t bg-slate-50 flex items-center justify-between gap-3">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-200 transition-colors"
                    >
                        Скасувати
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={!preview.data || createState.loading || createState.success}
                        className="px-5 py-2 rounded-lg text-sm font-semibold bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                        {createState.loading ? "Збереження..." : "Зберегти зарплату"}
                    </button>
                </div>
            </div>
        </div>
    )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function FinanceTablePage() {
    const [activeRole, setActiveRole] = useState(3)
    const [historyUser, setHistoryUser] = useState<User | null>(null)

    const {
        users,
        usersLoading,
        fetchUsers,
        salaryList,
        fetchSalaryList,
        preview,
        openPreviewModal,
        closePreviewModal,
        handleDatesConfirm,
        formValues,
        updateFormValue,
        computedTotal,
        createState,
        saveSalary,
        resetCreateState,
    } = useSalaryManagement({ roleId: activeRole })

    // Завантажуємо юзерів при зміні ролі
    useEffect(() => {
        fetchUsers(activeRole)
    }, [activeRole])

    // Завантажуємо список зарплат при зміні ролі
    useEffect(() => {
        fetchSalaryList({ role: activeRole })
    }, [activeRole])

    // Відкрити модалку превью
    function handleOpenPreview(user: User) {
        resetCreateState()
        openPreviewModal(user.id)
    }

    // Відкрити модалку транзакцій для юзера
    function handleOpenHistory(user: User) {
        setHistoryUser(user)
        fetchSalaryList({ user: user.id })
    }

    // Зберегти та закрити
    async function handleSave() {
        const result = await saveSalary()
        if (result) {
            setTimeout(() => {
                closePreviewModal()
                resetCreateState()
            }, 1200)
        }
    }

    // Знайти активного юзера для модалки
    const activePreviewUser = users.find(u => u.id === preview.userId) ?? null

    // Зарплати для конкретного юзера (для history modal)
    const userSalaries = historyUser
        ? salaryList.items.filter(s => s.user === historyUser.id)
        : []

    return (
        <div className="flex h-full min-h-screen bg-slate-50">
            {/* SIDEBAR */}
            <div className="w-60 border-r bg-white p-4 space-y-1 shrink-0">
                <h3 className="mb-4 text-xs font-semibold text-slate-400 uppercase tracking-widest px-2">
                    Ролі
                </h3>
                {roles.map((role) => (
                    <button
                        key={role.key}
                        onClick={() => setActiveRole(role.key)}
                        className={cn(
                            "w-full text-left px-3 py-2.5 rounded-lg text-sm transition-all font-medium",
                            activeRole === role.key
                                ? "bg-slate-900 text-white shadow-sm"
                                : "text-slate-600 hover:bg-slate-100"
                        )}
                    >
                        {role.label}
                    </button>
                ))}
            </div>

            {/* MAIN */}
            <div className="flex-1 p-6 overflow-auto">
                <div className="mb-5 flex items-center justify-between">
                    <div>
                        <h1 className="text-xl font-semibold text-slate-800">Зарплати</h1>
                        <p className="text-sm text-slate-400 mt-0.5">
                            {roles.find(r => r.key === activeRole)?.label}
                        </p>
                    </div>
                </div>

                <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-sm">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-slate-50 border-b border-slate-200">
                                <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                    Працівник
                                </TableHead>
                                <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">
                                    Дії
                                </TableHead>
                            </TableRow>
                        </TableHeader>

                        <TableBody>
                            {usersLoading ? (
                                <TableRow>
                                    <TableCell colSpan={2} className="text-center h-24 text-slate-400 text-sm">
                                        <span className="inline-flex items-center gap-2">
                                            <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                                            </svg>
                                            Завантаження...
                                        </span>
                                    </TableCell>
                                </TableRow>
                            ) : users.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={2} className="text-center h-24 text-slate-400 text-sm">
                                        Немає працівників для цієї ролі
                                    </TableCell>
                                </TableRow>
                            ) : (
                                users.map((user: User) => (
                                    <TableRow
                                        key={user.id}
                                        className="hover:bg-slate-50/60 transition-colors border-b border-slate-100 last:border-0"
                                    >
                                        <TableCell className="font-medium text-slate-800 py-3.5">
                                            {user.full_name}
                                        </TableCell>
                                        <TableCell className="text-right py-3.5">
                                            <div className="flex items-center justify-end gap-2">
                                                {/* Переглянути статистику */}
                                                <button
                                                    onClick={() => handleOpenPreview(user)}
                                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors"
                                                >
                                                    <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
                                                        <path d="M1 8s2.5-5 7-5 7 5 7 5-2.5 5-7 5-7-5-7-5z" stroke="currentColor" strokeWidth="1.5"/>
                                                        <circle cx="8" cy="8" r="2" stroke="currentColor" strokeWidth="1.5"/>
                                                    </svg>
                                                    Статистика
                                                </button>

                                                {/* Транзакції */}
                                                <button
                                                    onClick={() => handleOpenHistory(user)}
                                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors"
                                                >
                                                    <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
                                                        <rect x="1" y="3" width="14" height="10" rx="1.5" stroke="currentColor" strokeWidth="1.5"/>
                                                        <path d="M1 6h14" stroke="currentColor" strokeWidth="1.5"/>
                                                        <path d="M5 10h2M9 10h2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                                                    </svg>
                                                    Транзакції
                                                </button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>
            </div>

            {/* Salary Preview / Create Modal */}
            {preview.open && activePreviewUser && (
                <SalaryModal
                    user={activePreviewUser}
                    preview={preview}
                    formValues={formValues}
                    computedTotal={computedTotal}
                    createState={createState}
                    onDatesConfirm={handleDatesConfirm}
                    onUpdateField={updateFormValue}
                    onSave={handleSave}
                    onClose={closePreviewModal}
                />
            )}

            {/* History Modal */}
            {historyUser && (
                <SalaryHistoryModal
                    user={historyUser}
                    salaries={userSalaries}
                    onClose={() => setHistoryUser(null)}
                />
            )}
        </div>
    )
}
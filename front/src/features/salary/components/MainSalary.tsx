"use client"

import { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import { cn } from "@/src/lib/utils"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/src/components/ui/table"
// Використовуємо лише один тип, щоб уникнути плутанини
import { User } from "@/src/features/users/types"
import { useSalaryManagement } from "@/src/features/salary/hooks/useSalary"
import { Salary } from "@/src/features/salary/types"

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
    user: any
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
                                        {formatCurrency(Number(s.base_salary) ?? 0)}
                                    </td>
                                    <td className="px-6 py-3 text-right font-semibold text-emerald-600">
                                        {formatCurrency((Number(s.base_salary) ?? 0) + (Number(s.bonus) ?? 0) + (Number(s.premium) ?? 0))}
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
    user: any
    preview: any
    formValues: any
    computedTotal: number
    createState: any
    onDatesConfirm: (start: string, end: string) => void
    onUpdateField: (field: "base_salary" | "bonus" | "premium", val: number) => void
    onSave: () => void
    onClose: () => void
}) {
    const [localStart, setLocalStart] = useState(firstDayOfMonth())
    const [localEnd, setLocalEnd] = useState(today())

    function handleConfirmDates() {
        if (!localStart || !localEnd) return
        onDatesConfirm(localStart, localEnd)
    }


    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-md mx-4 overflow-hidden">
                {/* Header */}
                <div className="px-6 py-5 border-b flex items-center justify-between">
                    <div>
                        <p className="text-xs text-slate-400 font-medium uppercase tracking-widest mb-0.5">Нарахування зарплати</p>
                        <h2 className="text-lg font-semibold text-slate-800">{user.full_name}</h2>
                    </div>
                    <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-slate-100 text-slate-400 transition-colors">
                        <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M1 1l12 12M13 1L1 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
                    </button>
                </div>

                <div className="px-6 py-5 space-y-5">
                    {/* Step 1: Dates */}
                    <div className="space-y-3">
                        <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">Крок 1 — Період</p>
                        <div className="grid grid-cols-2 gap-3">
                            <input type="date" value={localStart} onChange={e => setLocalStart(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm" />
                            <input type="date" value={localEnd} onChange={e => setLocalEnd(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm" />
                        </div>
                        <button onClick={handleConfirmDates} disabled={preview.loading} className="w-full py-2 rounded-lg text-sm font-medium bg-slate-800 text-white hover:bg-slate-700 disabled:opacity-40">
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
                            <div className="rounded-xl bg-slate-50 border grid grid-cols-3 divide-x">
                                <div className="py-3 px-4 text-center"><p className="text-xs text-slate-400">Замовлень</p><p className="font-semibold text-sm">{preview.data.orders_count}</p></div>
                                <div className="py-3 px-4 text-center"><p className="text-xs text-slate-400">Прострочено</p><p className="font-semibold text-sm">{preview.data.overdue_orders_count}</p></div>
                                <div className="py-3 px-4 text-center"><p className="text-xs text-slate-400">Виручка</p><p className="font-semibold text-sm">{formatCurrency(Number(preview.data.revenue))}</p></div>
                            </div>
                            <div className="space-y-3">
                                <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">Крок 2 — Нарахування</p>
                                {(["base_salary", "bonus", "premium"] as const).map(field => (
                                    <div key={field} className="flex items-center gap-3">
                                        <label className="w-20 text-sm text-slate-500 capitalize">{field.replace('_', ' ')}</label>
                                        <input type="number" value={formValues[field] || ""} onChange={e => onUpdateField(field, Number(e.target.value))} className="flex-1 border rounded-lg px-3 py-2 text-sm" />
                                    </div>
                                ))}
                                <div className="flex items-center justify-between pt-2 border-t font-bold text-emerald-600">
                                    <span>Разом</span>
                                    <span>{formatCurrency(computedTotal)}</span>
                                </div>
                            </div>
                        </>
                    )}
                </div>

                <div className="px-6 py-4 border-t bg-slate-50 flex items-center justify-between">
                    <button onClick={onClose} className="px-4 py-2 text-sm text-slate-600">Скасувати</button>
                    <button onClick={onSave} disabled={!preview.data || createState.loading} className="px-5 py-2 rounded-lg text-sm font-semibold bg-emerald-600 text-white">
                        Зберегти
                    </button>
                </div>
            </div>
        </div>
    )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function FinanceTablePage() {
    const searchParams = useSearchParams()
    const activeRole = Number(searchParams.get("role")) || 1
    const [historyUser, setHistoryUser] = useState<any>(null)

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

    function handleOpenPreview(user: any) {
        resetCreateState()
        openPreviewModal(Number(user.id))
    }

    function handleOpenHistory(user: any) {
        setHistoryUser(user)
        fetchSalaryList({ user: Number(user.id) })
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

    const activePreviewUser = users.find(u => Number(u.id) === preview.userId) ?? null
    const userSalaries = historyUser ? salaryList.items.filter(s => s.user === Number(historyUser.id)) : []

    return (
        <div className="flex h-full min-h-screen bg-slate-50 p-6">
            <div className="flex-1 max-w-6xl mx-auto">
                <div className="mb-6">
                    <h1 className="text-2xl font-bold text-slate-800">Фінансова відомість</h1>
                    <p className="text-slate-500">Управління нарахуваннями для обраної ролі</p>
                </div>

                <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-sm">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-slate-50">
                                <TableHead className="w-2/3">Працівник</TableHead>
                                <TableHead className="text-right">Дії</TableHead>
                            </TableRow>
                        </TableHeader>

                        <TableBody>
                            {usersLoading ? (
                                <TableRow><TableCell colSpan={2} className="text-center py-10">Завантаження...</TableCell></TableRow>
                            ) : users.length === 0 ? (
                                <TableRow><TableCell colSpan={2} className="text-center py-10 text-slate-400">Працівників не знайдено</TableCell></TableRow>
                            ) : (
                                users.map((user: any) => (
                                    <TableRow key={user.id} className="hover:bg-slate-50/50">
                                        <TableCell className="font-medium">{user.full_name}</TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-2">
                                                <button onClick={() => handleOpenPreview(user)} className="px-3 py-1.5 bg-slate-100 rounded-lg text-xs font-medium hover:bg-slate-200 transition-colors">Статистика</button>
                                                <button onClick={() => handleOpenHistory(user)} className="px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-lg text-xs font-medium hover:bg-emerald-100 transition-colors">Транзакції</button>
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
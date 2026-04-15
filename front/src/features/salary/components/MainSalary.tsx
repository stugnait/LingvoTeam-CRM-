"use client"

import { useState, useMemo } from "react"
import { cn } from "@/src/lib/utils"
import { Button } from "@/src/components/ui/button"
import { Input } from "@/src/components/ui/input"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/src/components/ui/table"

import { useSalary } from "@/src/features/salary/hooks/useSalary"
import { useOrders } from "@/src/features/orders/hooks/useOrders"

const roles = [
    { key: 1, label: "Менеджер" },
    { key: 2, label: "Редактор" },
    { key: 3, label: "Перекладач" },
    { key: 4, label: "Фінансист" },
]

function getEndOfMonth(dateStr: string) {
    const date = new Date(dateStr)
    const year = date.getFullYear()
    const month = date.getMonth()

    const lastDay = new Date(year, month + 1, 0)

    const y = lastDay.getFullYear()
    const m = String(lastDay.getMonth() + 1).padStart(2, "0")
    const d = String(lastDay.getDate()).padStart(2, "0")

    return `${y}-${m}-${d}`
}

export function FinanceTablePage() {
    const [activeRole, setActiveRole] = useState<number>(3)
    const [isOpen, setIsOpen] = useState(false)
    const [isEndDateManual, setIsEndDateManual] = useState(false)

    // 🔥 salaries по ролі
    const { data, createSalary, updateSalary, loading } = useSalary(activeRole)

    // 🔥 беремо юзерів з orders hook
    const { translators, editors } = useOrders()

    // 🔥 мапа ролей → список юзерів
    const usersByRole = useMemo(() => {
        return {
            3: translators, // перекладачі
            2: editors,     // редактори
            1: [],          // менеджери (додаси пізніше)
            4: [],          // фінанси (потім)
        }
    }, [translators, editors])

    const users = usersByRole[activeRole] || []

    const [form, setForm] = useState({
        userId: "",
        start_date: "",
        end_date: "",
        bonus: 0,
        premium: 0,
    })

    const handleStartDateChange = (value: string) => {
        setForm(prev => {
            if (isEndDateManual) {
                return { ...prev, start_date: value }
            }

            return {
                ...prev,
                start_date: value,
                end_date: getEndOfMonth(value),
            }
        })
    }

    const handleSubmit = async () => {
        await createSalary({
            user: Number(form.userId),
            start_date: form.start_date,
            end_date: form.end_date,
            bonus: form.bonus,
            premium: form.premium,
        })

        setIsOpen(false)

        setForm({
            userId: "",
            start_date: "",
            end_date: "",
            bonus: 0,
            premium: 0,
        })

        setIsEndDateManual(false)
    }

    const updateField = async (
        id: number,
        field: "bonus" | "premium",
        value: number
    ) => {
        await updateSalary(id, {
            [field]: value,
        })
    }

    return (
        <div className="flex h-full">
            {/* SIDEBAR */}
            <div className="w-64 border-r bg-muted/20 p-4 space-y-2">
                <h3 className="text-sm font-semibold text-muted-foreground mb-4">
                    Ролі
                </h3>

                {roles.map(role => (
                    <button
                        key={role.key}
                        onClick={() => setActiveRole(role.key)}
                        className={cn(
                            "w-full text-left px-4 py-2 rounded-lg text-sm font-medium transition",
                            activeRole === role.key
                                ? "bg-primary text-white"
                                : "hover:bg-muted"
                        )}
                    >
                        {role.label}
                    </button>
                ))}
            </div>

            {/* TABLE */}
            <div className="flex-1 p-6">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-semibold">Зарплати</h2>

                    <Button onClick={() => setIsOpen(true)}>
                        Додати зарплату
                    </Button>
                </div>

                <div className="border rounded-lg bg-card shadow-soft overflow-hidden">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>User</TableHead>
                                <TableHead>Revenue</TableHead>
                                <TableHead>Orders</TableHead>
                                <TableHead>Overdue</TableHead>
                                <TableHead>Margin</TableHead>
                                <TableHead>Rate</TableHead>
                                <TableHead>Bonus</TableHead>
                                <TableHead>Premium</TableHead>
                                <TableHead>Total</TableHead>
                            </TableRow>
                        </TableHeader>

                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={9} className="text-center py-10">
                                        Loading...
                                    </TableCell>
                                </TableRow>
                            ) : data.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={9} className="text-center py-10 text-muted-foreground">
                                        Немає даних
                                    </TableCell>
                                </TableRow>
                            ) : (
                                data.map((row: any) => (
                                    <TableRow key={row.id}>
                                        <TableCell>{row.user}</TableCell>
                                        <TableCell>{row.revenue}</TableCell>
                                        <TableCell>{row.orders_count}</TableCell>

                                        <TableCell
                                            className={cn(
                                                row.overdue_orders_count > 0 &&
                                                "text-red-500 font-medium"
                                            )}
                                        >
                                            {row.overdue_orders_count}
                                        </TableCell>

                                        <TableCell>{row.margin}%</TableCell>
                                        <TableCell>{row.rate}</TableCell>

                                        <TableCell>
                                            <Input
                                                type="number"
                                                value={row.bonus}
                                                onChange={e =>
                                                    updateField(
                                                        row.id,
                                                        "bonus",
                                                        Number(e.target.value || 0)
                                                    )
                                                }
                                                className="h-8"
                                            />
                                        </TableCell>

                                        <TableCell>
                                            <Input
                                                type="number"
                                                value={row.premium}
                                                onChange={e =>
                                                    updateField(
                                                        row.id,
                                                        "premium",
                                                        Number(e.target.value || 0)
                                                    )
                                                }
                                                className="h-8"
                                            />
                                        </TableCell>

                                        <TableCell className="font-semibold">
                                            {row.total}
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>
            </div>

            {/* MODAL */}
            {isOpen && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center">
                    <div className="bg-white p-6 rounded-xl w-[420px] space-y-4">
                        <h3 className="text-lg font-semibold">
                            Додати зарплату
                        </h3>

                        {/* 🔥 USERS ПО РОЛІ */}
                        <select
                            className="w-full border rounded-md h-10 px-3"
                            value={form.userId}
                            onChange={e =>
                                setForm(prev => ({
                                    ...prev,
                                    userId: e.target.value,
                                }))
                            }
                        >
                            <option value="">Вибери користувача</option>
                            {users.map((u: any) => (
                                <option key={u.id} value={u.id}>
                                    {u.full_name || u.name}
                                </option>
                            ))}
                        </select>

                        <Input
                            type="date"
                            value={form.start_date}
                            onChange={e =>
                                handleStartDateChange(e.target.value)
                            }
                        />

                        <Input
                            type="date"
                            value={form.end_date}
                            onChange={e => {
                                setIsEndDateManual(true)
                                setForm(prev => ({
                                    ...prev,
                                    end_date: e.target.value,
                                }))
                            }}
                        />

                        <Input
                            type="number"
                            placeholder="Бонус"
                            value={form.bonus}
                            onChange={e =>
                                setForm(prev => ({
                                    ...prev,
                                    bonus: Number(e.target.value),
                                }))
                            }
                        />

                        <Input
                            type="number"
                            placeholder="Премія"
                            value={form.premium}
                            onChange={e =>
                                setForm(prev => ({
                                    ...prev,
                                    premium: Number(e.target.value),
                                }))
                            }
                        />

                        <div className="flex justify-end gap-2">
                            <Button variant="ghost" onClick={() => setIsOpen(false)}>
                                Скасувати
                            </Button>
                            <Button onClick={handleSubmit}>
                                Зберегти
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
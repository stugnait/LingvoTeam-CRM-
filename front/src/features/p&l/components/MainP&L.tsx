"use client"

import { DashboardHeader } from "@/src/shared/components/layout/DashboardHeader"

import { useTransactions } from "../hooks/useTransactions"
import { useCategories } from "../hooks/useCategories"

import { PnLTable } from "./P&LTable"
import { CategoriesCard } from "./CategoriesCard"

import { BaseFormModal } from "@/src/components/modals/BaseFormModal"
import { ConfirmModal } from "@/src/components/modals/ConfirmModal"

import { Card, CardContent, CardHeader, CardTitle } from "@/src/components/ui/card"
import { Button } from "@/src/components/ui/button"
import { Input } from "@/src/components/ui/input"

import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/src/components/ui/select"

import { Plus } from "lucide-react"


export function MainPnL() {

    const {
        transactions,
        form,
        setForm,

        isFormOpen,
        isDeleteOpen,
        selectedTransaction,

        openAddTransaction,
        openEditTransaction,
        openDeleteTransaction,

        submitTransaction,
        confirmDelete,
        closeModals
    } = useTransactions()

    const { categories } = useCategories()


    const income = transactions
        .filter(t => t.type === "income")
        .reduce((sum, t) => sum + t.amount, 0)

    const expenses = transactions
        .filter(t => t.type === "expense")
        .reduce((sum, t) => sum + t.amount, 0)

    const profit = income - expenses


    return (
        <>

            <DashboardHeader />

            <main className="flex-1 overflow-y-auto p-6">

                <div className="mx-auto max-w-6xl space-y-6">


                    {/* PAGE HEADER */}

                    <div className="flex items-center justify-between">

                        <div>

                            <h2 className="text-2xl font-bold tracking-tight">
                                Finance
                            </h2>

                            <p className="text-muted-foreground">
                                Track income, expenses and profit
                            </p>

                        </div>

                        <Button onClick={openAddTransaction}>

                            <Plus className="h-4 w-4 mr-2"/>

                            Add Transaction

                        </Button>

                    </div>



                    {/* KPI */}

                    <div className="grid grid-cols-4 gap-4">

                        <KpiCard title="Income" value={income}/>
                        <KpiCard title="Expenses" value={expenses}/>
                        <KpiCard title="Profit" value={profit}/>
                        <KpiCard title="Net Profit" value={profit}/>

                    </div>



                    {/* TABLE + CATEGORIES */}

                    <div className="grid grid-cols-3 gap-6">

                        <Card className="col-span-2">

                            <CardHeader>

                                <CardTitle>
                                    Transactions
                                </CardTitle>

                            </CardHeader>

                            <CardContent className="p-0">

                                <PnLTable
                                    transactions={transactions}
                                    onEdit={openEditTransaction}
                                    onDelete={openDeleteTransaction}
                                />

                            </CardContent>

                        </Card>


                        <CategoriesCard />

                    </div>

                </div>

            </main>



            {/* TRANSACTION MODAL */}

            <BaseFormModal
                open={isFormOpen}
                onOpenChange={(open) => !open && closeModals()}
                title={selectedTransaction ? "Edit Transaction" : "Add Transaction"}
                submitLabel={selectedTransaction ? "Update" : "Create"}
                onSubmit={() => submitTransaction(form)}
            >

                <div className="space-y-4">

                    <Input
                        type="number"
                        placeholder="Amount"
                        value={form.amount}
                        onChange={(e) =>
                            setForm(prev => ({
                                ...prev,
                                amount: Number(e.target.value),
                            }))
                        }
                    />

                    <Select
                        value={form.type}
                        onValueChange={(value) =>
                            setForm(prev => ({
                                ...prev,
                                type: value as any,
                            }))
                        }
                    >

                        <SelectTrigger>
                            <SelectValue placeholder="Transaction type"/>
                        </SelectTrigger>

                        <SelectContent>
                            <SelectItem value="income">Income</SelectItem>
                            <SelectItem value="expense">Expense</SelectItem>
                        </SelectContent>

                    </Select>


                    <Select
                        value={String(form.category)}
                        onValueChange={(value) =>
                            setForm(prev => ({
                                ...prev,
                                category: Number(value),
                            }))
                        }
                    >

                        <SelectTrigger>
                            <SelectValue placeholder="Select category"/>
                        </SelectTrigger>

                        <SelectContent>

                            {categories.map(cat => (

                                <SelectItem
                                    key={cat.id}
                                    value={String(cat.id)}
                                >
                                    {cat.name}
                                </SelectItem>

                            ))}

                        </SelectContent>

                    </Select>


                    <Input
                        placeholder="Comment"
                        value={form.comment}
                        onChange={(e) =>
                            setForm(prev => ({
                                ...prev,
                                comment: e.target.value,
                            }))
                        }
                    />

                </div>

            </BaseFormModal>



            {/* DELETE MODAL */}

            <ConfirmModal
                open={isDeleteOpen}
                onOpenChange={(open) => !open && closeModals()}
                title="Delete transaction"
                description={`Delete ${selectedTransaction?.category} transaction?`}
                confirmLabel="Delete"
                confirmVariant="destructive"
                onConfirm={confirmDelete}
            />

        </>
    )
}



function KpiCard({ title, value }: any) {

    return (

        <Card>

            <CardHeader className="pb-2">

                <p className="text-sm text-muted-foreground">
                    {title}
                </p>

            </CardHeader>

            <CardContent>

                <p className="text-2xl font-bold">
                    ${value}
                </p>

            </CardContent>

        </Card>

    )

}
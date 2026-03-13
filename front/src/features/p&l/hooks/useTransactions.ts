"use client"

import { useCallback, useEffect, useState } from "react"
import { useToast } from "@/src/hooks/use-toast"
import { financeApi } from "../api"
import type { Transaction, TransactionFormData } from "../types"

export function useTransactions() {
    const { toast } = useToast()

    const [transactions, setTransactions] = useState<Transaction[]>([])
    const [loading, setLoading] = useState(false)

    const [form, setForm] = useState<TransactionFormData>({
        amount: 0,
        created_at: null,
        type: "expense",
        comment: "",
        currency: 1,
        category: 0
    })

    const [isFormOpen, setIsFormOpen] = useState(false)
    const [isDeleteOpen, setIsDeleteOpen] = useState(false)

    const [selectedTransaction, setSelectedTransaction] =
        useState<Transaction | null>(null)

    const loadTransactions = useCallback(async () => {
        try {
            setLoading(true)

            const response = await financeApi.listTransactions()
            setTransactions(response.results)

        } catch {
            toast({
                title: "Error",
                description: "Failed to load transactions",
                variant: "error",
            })
        } finally {
            setLoading(false)
        }
    }, [toast])

    useEffect(() => {
        loadTransactions()
    }, [loadTransactions])


    const openAddTransaction = () => {
        setSelectedTransaction(null)

        setForm({
            amount: 0,
            created_at: null,
            type: "expense",
            comment: "",
            currency: 1,
            category: 0
        })

        setIsFormOpen(true)
    }

    const openEditTransaction = (transaction: Transaction) => {
        setSelectedTransaction(transaction)

        setForm({
            amount: transaction.amount,
            created_at: transaction.created_at,
            type: transaction.type,
            comment: transaction.comment,
            currency: transaction.currency,
            category: transaction.category
        })

        setIsFormOpen(true)
    }

    const openDeleteTransaction = (transaction: Transaction) => {
        setSelectedTransaction(transaction)
        setIsDeleteOpen(true)
    }

    const closeModals = () => {
        setIsFormOpen(false)
        setIsDeleteOpen(false)
        setSelectedTransaction(null)
    }


    const submitTransaction = async (data: TransactionFormData) => {
        try {

            if (selectedTransaction) {

                await financeApi.updateTransaction(
                    selectedTransaction.id,
                    data
                )

                toast({
                    title: "Transaction updated",
                })

            } else {

                await financeApi.createTransaction(data)

                toast({
                    title: "Transaction created",
                })

            }

            closeModals()
            await loadTransactions()

        } catch {

            toast({
                title: "Error",
                description: "Failed to save transaction",
                variant: "error",
            })

        }
    }


    const confirmDelete = async () => {
        if (!selectedTransaction) {return}

        try {

            await financeApi.deleteTransaction(selectedTransaction.id)

            toast({
                title: "Transaction deleted",
            })

            closeModals()
            await loadTransactions()

        } catch {

            toast({
                title: "Error",
                description: "Failed to delete transaction",
                variant: "error",
            })

        }
    }


    return {
        transactions,
        loading,

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
    }
}
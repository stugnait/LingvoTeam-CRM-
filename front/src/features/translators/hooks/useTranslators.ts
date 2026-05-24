"use client"

import { useCallback, useEffect, useState } from "react"
import { useToast } from "@/src/hooks/use-toast"
import { translatorsApi } from "../api"
import type {
    Translator,
    TranslatorPayload,
    TranslatorTraffic,
    TranslatorTrafficPayload,
    LanguagePairOption,
    CategoryOption
} from "../types"
import {Currency} from "@/src/features/orders/types";
import {ordersApi} from "@/src/features/orders/api";

export function useTranslators() {
    const { toast } = useToast()

    // -------------------------
    // State
    // -------------------------
    const [translators, setTranslators] = useState<Translator[]>([])
    const [loading, setLoading] = useState(false)

    const [search, setSearch] = useState("")
    const [debouncedSearch, setDebouncedSearch] = useState("")

    const [ordering, setOrdering] = useState<
        "orders_count" | "-orders_count" | "created_at" | "-created_at" | null
    >(null)

    const [sourceLanguage, setSourceLanguage] = useState<number | null>(null)
    const [targetLanguage, setTargetLanguage] = useState<number | null>(null)
    const [languagePairId, setLanguagePairId] = useState<number | null>(null)
    const [page, setPage] = useState(1)
    const [totalPages, setTotalPages] = useState(1)

    // Select options
    const [currencies, setCurrencies] = useState<Currency[]>([])
    const [languagePairs, setLanguagePairs] = useState<LanguagePairOption[]>([])
    const [categories, setCategories] = useState<CategoryOption[]>([])

    const [confirmAction, setConfirmAction] =
        useState<"delete" | "deactivate" | "delete_traffic" | null>(null)

    const [form, setForm] = useState<TranslatorPayload>({
        full_name: "",
        email: "",
        phone: "",
        currency_id: 0,
    })

    const [errors, setErrors] = useState<Partial<Record<keyof TranslatorPayload, string>>>({})

    // modals
    const [isFormOpen, setIsFormOpen] = useState(false)
    const [isConfirmOpen, setIsConfirmOpen] = useState(false)
    const [selectedTranslator, setSelectedTranslator] = useState<Translator | null>(null)

    // TRAFFIC STATES
    const [traffic, setTraffic] = useState<TranslatorTraffic[]>([])
    const [isTrafficFormOpen, setIsTrafficFormOpen] = useState(false)
    const [selectedTraffic, setSelectedTraffic] = useState<TranslatorTraffic | null>(null)
    const [trafficForm, setTrafficForm] = useState<TranslatorTrafficPayload>({
        name: "",
        translator: 0,
        currency_id: 0,
        language_pair: null,
        category: null,
        rate_per_page: 0,
        rate_per_action: 0,
    })
    const [trafficErrors, setTrafficErrors] = useState<Partial<Record<keyof TranslatorTrafficPayload, string>>>({})

    // -------------------------
    // Debounce search
    // -------------------------
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(search)
        }, 400)

        return () => clearTimeout(timer)
    }, [search])

    // -------------------------
    // Load Helpers (INDEPENDENTLY)
    // -------------------------
    const loadHelpers = useCallback(() => {
        // Оголошуємо проміси для незалежного виконання
        const fetchCurrencies = ordersApi.listCurrency().catch(err => { console.error("Currencies error", err); return { results: [] }; });
        const fetchLanguages = translatorsApi.listLanguages().catch(err => { console.error("Languages error", err); return { results: [] }; });
        const fetchPairs = translatorsApi.listLanguagePairs().catch(err => { console.error("Pairs error", err); return { results: [] }; });
        const fetchCategories = translatorsApi.listCategories().catch(err => { console.error("Categories error", err); return { results: [] }; });

        Promise.all([fetchCurrencies, fetchLanguages, fetchPairs, fetchCategories]).then(([curRes, langRes, pairRes, catRes]) => {
            // 1. Валюти
            setCurrencies(curRes.results || []);

            // 2. Мови (для мапінгу пар)
            const langs = langRes.results || [];

            // Функція-помічник для пошуку назви мови по ID
            const getLangName = (val: any) => {
                if (!val) return "Unknown";
                if (typeof val === 'string') return val;
                if (val.name) return val.name; // Якщо це об'єкт { id: 1, name: 'English' }
                if (typeof val === 'number') {
                    const found = langs.find((l: any) => l.id === val);
                    return found ? found.name : `ID:${val}`;
                }
                return val;
            };

            // 3. Мовні пари
            const pairs = (pairRes.results || []).map((p: any) => {
                let pairName = `Pair #${p.id}`;

                // Перевіряємо всі можливі варіанти відповіді бекенду
                if (p.name && typeof p.name === 'string') {
                    pairName = p.name;
                } else if (p.language_pair_name) {
                    pairName = p.language_pair_name;
                } else if (p.source_language || p.target_language) {
                    const src = getLangName(p.source_language);
                    const tgt = getLangName(p.target_language);
                    pairName = `${src} → ${tgt}`;
                }

                return {
                    id: p.id,
                    name: pairName
                };
            });
            setLanguagePairs(pairs);

            // 4. Категорії (Order Traffic)
            const cats = (catRes.results || []).map((c: any) => ({
                id: c.id,
                name: c.name || `Category #${c.id}`
            }));
            setCategories(cats);
        });
    }, []);

    // -------------------------
    // Load translators
    // -------------------------
    const loadTranslators = useCallback(async (pageNumber: number = 1) => {
        try {
            setLoading(true)

            const response = await translatorsApi.list(pageNumber, {
                search: debouncedSearch,
                ordering: ordering || undefined,
                source_language: sourceLanguage || undefined,
                target_language: targetLanguage || undefined,
                language_pair_id: languagePairId || undefined,
            })

            if (response && response.results) {
                setTranslators(response.results)
                setTotalPages(Math.ceil((response.count || 0) / 10))
                setPage(pageNumber)
            }
        } catch (err) {
            console.error("Failed to load translators:", err)
            toast({
                title: "Error",
                description: "Failed to load translators",
                variant: "error",
            })
        } finally {
            setLoading(false)
        }
    }, [debouncedSearch, ordering, sourceLanguage, targetLanguage, languagePairId, toast])

    // -------------------------
    // Load Traffic
    // -------------------------
    const loadTraffic = useCallback(async () => {
        try {
            const response = await translatorsApi.listTranslatorTraffic()
            const trafficData = Array.isArray(response) ? response : (response?.results || [])
            setTraffic(trafficData)
        } catch (err) {
            console.error("Failed to load traffic:", err)
        }
    }, [])

    useEffect(() => {
        loadHelpers()
        loadTranslators(1)
        loadTraffic()
    }, [loadHelpers, loadTranslators, loadTraffic])

    const onPageChange = (newPage: number) => {
        loadTranslators(newPage)
    }

    // -------------------------
    // Modal handlers
    // -------------------------
    const openAddTranslator = () => {
        setSelectedTranslator(null)
        setForm({
            full_name: "",
            email: "",
            phone: "",
            currency_id: 0,
        })
        setErrors({})
        setIsFormOpen(true)
    }

    const openEditTranslator = (translator: Translator) => {
        setSelectedTranslator(translator)
        setForm({
            full_name: translator.full_name,
            email: translator.email,
            phone: translator.phone,
            currency_id: translator.currency_id,
        })
        setErrors({})
        setIsFormOpen(true)
    }

    const openDeleteTranslator = (translator: Translator) => {
        setSelectedTranslator(translator)
        setConfirmAction("delete")
        setIsConfirmOpen(true)
    }

    const openDeactivateTranslator = (translator: Translator) => {
        setSelectedTranslator(translator)
        setConfirmAction("deactivate")
        setIsConfirmOpen(true)
    }

    // TRAFFIC MODALS
    const openAddTraffic = (translator?: Translator) => {
        setSelectedTraffic(null)
        setTrafficForm({
            name: "",
            translator: translator?.id || 0,
            currency_id: translator?.currency_id || 0,
            language_pair: null,
            category: null,
            rate_per_page: 0,
            rate_per_action: 0,
        })
        setTrafficErrors({})
        setIsTrafficFormOpen(true)
    }

    const openEditTraffic = (trafficItem: TranslatorTraffic) => {
        setSelectedTraffic(trafficItem)
        setTrafficForm({
            name: trafficItem.name || "",
            translator: trafficItem.translator,
            currency_id: trafficItem.currency_id,
            language_pair: trafficItem.language_pair,
            category: trafficItem.category,
            rate_per_page: trafficItem.rate_per_page || 0,
            rate_per_action: trafficItem.rate_per_action || 0,
        })
        setTrafficErrors({})
        setIsTrafficFormOpen(true)
    }

    const openDeleteTraffic = (trafficItem: TranslatorTraffic) => {
        setSelectedTraffic(trafficItem)
        setConfirmAction("delete_traffic")
        setIsConfirmOpen(true)
    }

    const closeModals = () => {
        setIsFormOpen(false)
        setIsTrafficFormOpen(false)
        setIsConfirmOpen(false)
        setSelectedTranslator(null)
        setSelectedTraffic(null)
        setConfirmAction(null)
        setErrors({})
        setTrafficErrors({})
    }

    // -------------------------
    // Submit handlers
    // -------------------------
    const submitTranslator = async (data: TranslatorPayload) => {
        try {
            const newErrors: Partial<Record<keyof TranslatorPayload, string>> = {}

            if (!data.full_name.trim()) {
                newErrors.full_name = "Full name is required"
            }
            if (!data.email.trim()) {
                newErrors.email = "Email is required"
            } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
                newErrors.email = "Invalid email format"
            }
            if (!data.phone.trim()) {
                newErrors.phone = "Phone is required"
            }
            if (!data.currency_id || Number(data.currency_id) <= 0) {
                newErrors.currency_id = "Please select a currency"
            }

            if (Object.keys(newErrors).length > 0) {
                setErrors(newErrors)
                toast({
                    title: "Validation error",
                    description: "Please check the form fields",
                    variant: "error",
                })
                return
            }

            setErrors({})

            if (selectedTranslator) {
                await translatorsApi.update(selectedTranslator.id, data)
                toast({ title: "Translator updated", description: `${data.full_name} updated successfully` })
            } else {
                await translatorsApi.create(data)
                toast({ title: "Translator created", description: `${data.full_name} created successfully` })
            }

            closeModals()
            await loadTranslators(page)
        } catch (err) {
            console.error("Save error:", err)
            toast({ title: "Error", description: "Failed to save translator", variant: "error" })
        }
    }

    const submitTraffic = async () => {
        try {
            const newErrors: Partial<Record<keyof TranslatorTrafficPayload, string>> = {}

            if (!trafficForm.translator) newErrors.translator = "Required"
            if (!trafficForm.name) newErrors.name = "Required"
            if (!trafficForm.currency_id) newErrors.currency_id = "Required"
            if (!trafficForm.language_pair) newErrors.language_pair = "Required"

            if (Object.keys(newErrors).length > 0) {
                setTrafficErrors(newErrors)
                toast({ title: "Validation error", description: "Please check the form fields", variant: "error" })
                return
            }

            setTrafficErrors({})

            if (selectedTraffic) {
                await translatorsApi.updateTranslatorTraffic(selectedTraffic.id, trafficForm)
                toast({ title: "Rate updated", description: `Successfully updated` })
            } else {
                await translatorsApi.createTranslatorTraffic(trafficForm)
                toast({ title: "Rate created", description: `Successfully created` })
            }

            closeModals()
            await loadTraffic()
            await loadTranslators(page)
        } catch (err) {
            console.error("Save traffic error:", err)
            toast({ title: "Error", description: "Failed to save rate", variant: "error" })
        }
    }

    const confirmActionHandler = async () => {
        try {
            if (confirmAction === "delete_traffic" && selectedTraffic) {
                await translatorsApi.removeTranslatorTraffic(selectedTraffic.id)
                toast({ title: "Rate deleted", description: "The rate has been removed." })
                await loadTraffic()
                await loadTranslators(page)
            } else if (selectedTranslator && confirmAction) {
                await translatorsApi.remove(selectedTranslator.id)
                toast({
                    title: confirmAction === "delete" ? "Translator deleted" : "Translator deactivated",
                    description: selectedTranslator.full_name,
                })
                await loadTranslators(page)
            }

            closeModals()
        } catch (err) {
            console.error("Action error:", err)
            toast({ title: "Error", description: "Action failed", variant: "error" })
        }
    }

    // -------------------------
    // Public API
    // -------------------------
    return {
        translators,
        loading,
        search,
        setSearch,
        ordering,
        setOrdering,
        sourceLanguage,
        setSourceLanguage,
        targetLanguage,
        setTargetLanguage,
        languagePairId,
        setLanguagePairId,
        form,
        setForm,
        errors,
        isFormOpen,
        isConfirmOpen,
        confirmAction,
        selectedTranslator,

        // Traffic & Select options
        traffic,
        isTrafficFormOpen,
        trafficForm,
        setTrafficForm,
        trafficErrors,
        selectedTraffic,
        currencies,
        languagePairs,
        categories,

        openAddTraffic,
        openEditTraffic,
        openDeleteTraffic,
        submitTraffic,

        openAddTranslator,
        openEditTranslator,
        openDeleteTranslator,
        openDeactivateTranslator,

        submitTranslator,
        confirmActionHandler,
        closeModals,
        page,
        totalPages,
        onPageChange,
    }
}
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
    CategoryOption,
    LanguageOption,
    LanguagePairApiItem
} from "../types"
import type {Currency} from "@/src/features/orders/types";
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
    const [languages, setLanguages] = useState<LanguageOption[]>([])
    const [languagePairs, setLanguagePairs] = useState<LanguagePairOption[]>([])
    const [categories, setCategories] = useState<CategoryOption[]>([])

    const [confirmAction, setConfirmAction] =
        useState<"delete" | "deactivate" | "delete_traffic" | null>(null)

    const [form, setForm] = useState<TranslatorPayload>({
        full_name: "",
        email: "",
        phone: "",
        currency_id: 0,

        tariff_ids: [],
    })

    const [errors, setErrors] = useState<Partial<Record<keyof TranslatorPayload, string>>>({})

    // modals
    const [isFormOpen, setIsFormOpen] = useState(false)
    const [isConfirmOpen, setIsConfirmOpen] = useState(false)
    const [selectedTranslator, setSelectedTranslator] = useState<Translator | null>(null)


    const [isInlineTrafficOpen, setIsInlineTrafficOpen] = useState(false)
    const [inlineTrafficForm, setInlineTrafficForm] = useState<TranslatorTrafficPayload>({
        name: "",
        currency_id: 0,
        language_pair: null,
        category: null,
        rate_per_page: 0,
        rate_per_action: 0,
    })
    const [inlineTrafficLoading, setInlineTrafficLoading] = useState(false)


    // TRAFFIC STATES
    const [traffic, setTraffic] = useState<TranslatorTraffic[]>([])
    const [isTrafficFormOpen, setIsTrafficFormOpen] = useState(false)
    const [selectedTraffic, setSelectedTraffic] = useState<TranslatorTraffic | null>(null)
    const [trafficForm, setTrafficForm] = useState<TranslatorTrafficPayload>({
        name: "",
        currency_id: 0,
        language_pair: null,
        category: null,
        rate_per_page: 0,
        rate_per_action: 0,
    })
    const [trafficErrors, setTrafficErrors] = useState<Partial<Record<keyof TranslatorTrafficPayload, string>>>({})
    const [isNewPairModalOpen, setIsNewPairModalOpen] = useState(false)
    const [newPairForm, setNewPairForm] = useState({
        source_language: 0,
        target_language: 0,
    })
    const [newPairLoading, setNewPairLoading] = useState(false)

    // -------------------------
    // Debounce search
    // -------------------------
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(search)
        }, 400)

        return () => clearTimeout(timer)
    }, [search])


    const createAndSelectTraffic = async () => {
        if (!inlineTrafficForm.name || !inlineTrafficForm.language_pair) {
            toast({ title: "Validation error", description: "Name and language pair are required", variant: "error" })
            return
        }

        setInlineTrafficLoading(true)
        try {
            const created = await translatorsApi.createTranslatorTraffic(inlineTrafficForm)

            // Додаємо новий тариф в загальний список
            setTraffic(prev => [...prev, created])

            // Автоматично чекаємо його для поточного перекладача
            setForm(prev => ({
                ...prev,
                tariff_ids: [...prev.tariff_ids, created.id]
            }))

            setIsInlineTrafficOpen(false)
            setInlineTrafficForm({ name: "", currency_id: 0, language_pair: null, category: null, rate_per_page: 0, rate_per_action: 0 })
            toast({ title: "Tariff created", description: created.name })
        } catch (e) {
            toast({ title: "Error", description: "Failed to create tariff", variant: "error" })
        } finally {
            setInlineTrafficLoading(false)
        }
    }

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
            setLanguages(langs.map((lang) => ({
                id: lang.id,
                name: lang.name || `Language #${lang.id}`,
            })));

            // Функція-помічник для пошуку назви мови по ID
            const getLangName = (val: LanguagePairApiItem["source_language"]) => {
                if (!val) {
                    return "Unknown";
                }
                if (typeof val === 'string') {
                    return val;
                }
                if (typeof val !== 'number') {
                    return val.name || "Unknown";
                }
                if (typeof val === 'number') {
                    const found = langs.find((language) => language.id === val);
                    return found ? found.name : `ID:${val}`;
                }
                return "Unknown";
            };

            // 3. Мовні пари
            const pairs = (pairRes.results || []).map((p) => {
                let pairName = `Pair #${p.id}`;

                // Перевіряємо всі можливі варіанти відповіді бекенду
                if (p.name && typeof p.name === 'string') {
                    pairName = p.name;
                } else if (p.pair_name) {
                    pairName = p.pair_name;
                } else if (p.language_pair_name) {
                    pairName = p.language_pair_name;
                } else if (p.source_language || p.target_language) {
                    const src = getLangName(p.source_language);
                    const tgt = getLangName(p.target_language);
                    pairName = `${src} -> ${tgt}`;
                }

                return {
                    id: p.id,
                    name: pairName
                };
            });
            setLanguagePairs(pairs);

            // 4. Категорії (Order Traffic)
            const cats = (catRes.results || []).map((c) => ({
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

            tariff_ids: [],
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

            tariff_ids:
                translator.traffic?.map(t => t.id) || [],
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
            currency_id: 0,
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
        setIsNewPairModalOpen(false)
        setIsInlineTrafficOpen(false)
        setSelectedTranslator(null)
        setSelectedTraffic(null)
        setConfirmAction(null)
        setErrors({})
        setTrafficErrors({})
        setNewPairForm({ source_language: 0, target_language: 0 })
    }

    const createAndSelectLanguagePair = async () => {
        if (!newPairForm.source_language || !newPairForm.target_language) {
            toast({ title: "Validation error", description: "Select both languages", variant: "error" })
            return
        }

        if (newPairForm.source_language === newPairForm.target_language) {
            toast({ title: "Validation error", description: "Languages must be different", variant: "error" })
            return
        }

        setNewPairLoading(true)

        try {
            const created = await translatorsApi.createLanguagePair(
                newPairForm.source_language,
                newPairForm.target_language
            )

            const sourceName = languages.find((language) => language.id === newPairForm.source_language)?.name
                ?? `Language #${newPairForm.source_language}`
            const targetName = languages.find((language) => language.id === newPairForm.target_language)?.name
                ?? `Language #${newPairForm.target_language}`
            const pairName = created.pair_name
                || created.language_pair_name
                || created.name
                || `${sourceName} -> ${targetName}`

            setLanguagePairs(prev => {
                if (prev.some((pair) => pair.id === created.id)) {
                    return prev.map((pair) => pair.id === created.id ? { id: created.id, name: pairName } : pair)
                }

                return [...prev, { id: created.id, name: pairName }]
            })

            setTrafficForm(prev => ({
                ...prev,
                language_pair: created.id,
            }))

            setIsNewPairModalOpen(false)
            setNewPairForm({ source_language: 0, target_language: 0 })
            toast({ title: "Language pair created", description: pairName })
        } catch (err) {
            const errorData = err as { detail?: unknown; non_field_errors?: unknown }
            const nonFieldError = Array.isArray(errorData.non_field_errors)
                && typeof errorData.non_field_errors[0] === "string"
                ? errorData.non_field_errors[0]
                : undefined
            const detail = typeof errorData.detail === "string" ? errorData.detail : undefined

            toast({
                title: "Error",
                description: nonFieldError || detail || "Failed to create language pair",
                variant: "error",
            })
        } finally {
            setNewPairLoading(false)
        }
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

            if (!trafficForm.name) {
                newErrors.name = "Required"
            }
            if (!trafficForm.currency_id) {
                newErrors.currency_id = "Required"
            }
            if (!trafficForm.language_pair) {
                newErrors.language_pair = "Required"
            }

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
        languages,
        languagePairs,
        categories,
        isNewPairModalOpen,
        setIsNewPairModalOpen,
        newPairForm,
        setNewPairForm,
        newPairLoading,
        createAndSelectLanguagePair,

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

        isInlineTrafficOpen,
        setIsInlineTrafficOpen,
        inlineTrafficForm,
        setInlineTrafficForm,
        inlineTrafficLoading,
        createAndSelectTraffic,
    }
}

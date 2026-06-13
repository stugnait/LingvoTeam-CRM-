"use client"

import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useState,
    type ReactNode,
} from "react"
import { defaultLocale, locales, messages, type Locale } from "./messages"

type TranslateParams = Record<string, string | number | null | undefined>

interface I18nContextValue {
    locale: Locale
    setLocale: (locale: Locale) => void
    t: (key: string, params?: TranslateParams) => string
}

const STORAGE_KEY = "lingvoteam.locale"

const I18nContext = createContext<I18nContextValue | null>(null)

function isLocale(value: string | null | undefined): value is Locale {
    return !!value && locales.includes(value as Locale)
}

function detectLocale(): Locale {
    if (typeof window === "undefined") {
        return defaultLocale
    }

    const stored = window.localStorage.getItem(STORAGE_KEY)
    if (isLocale(stored)) {
        return stored
    }

    const browserLocale = window.navigator.language?.slice(0, 2)
    return isLocale(browserLocale) ? browserLocale : defaultLocale
}

function interpolate(template: string, params?: TranslateParams) {
    if (!params) {
        return template
    }

    return template.replace(/\{(\w+)}/g, (_, key: string) => {
        const value = params[key]
        return value === null || value === undefined ? "" : String(value)
    })
}

export function I18nProvider({ children }: { children: ReactNode }) {
    const [locale, setLocaleState] = useState<Locale>(() => detectLocale())

    useEffect(() => {
        document.documentElement.lang = locale
        window.localStorage.setItem(STORAGE_KEY, locale)
    }, [locale])

    const setLocale = useCallback((nextLocale: Locale) => {
        setLocaleState(nextLocale)
    }, [])

    const t = useCallback(
        (key: string, params?: TranslateParams) => {
            const template = messages[locale][key] ?? messages[defaultLocale][key] ?? key
            return interpolate(template, params)
        },
        [locale]
    )

    const value = useMemo<I18nContextValue>(
        () => ({ locale, setLocale, t }),
        [locale, setLocale, t]
    )

    return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

export function useI18n() {
    const context = useContext(I18nContext)

    if (!context) {
        throw new Error("useI18n must be used inside I18nProvider")
    }

    return context
}

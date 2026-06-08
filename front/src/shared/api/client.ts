const API_URL = process.env.NEXT_PUBLIC_API_URL

type ResponseType = "json" | "blob"

export interface ApiFetchOptions extends RequestInit {
    responseType?: ResponseType
    skipGlobalError?: boolean
}

// Глобальний стан рефрешу — щоб не робити кілька паралельних рефрешів
let refreshPromise: Promise<boolean> | null = null

async function tryRefreshToken(): Promise<boolean> {
    // Якщо вже є активний refresh — чекаємо його результат
    if (refreshPromise) {
        return refreshPromise
    }

    refreshPromise = fetch(`${API_URL}users/auth/refresh/`, {
        method: "POST",
        credentials: "include",
    })
        .then(res => res.ok)
        .catch(() => false)
        .finally(() => {
            refreshPromise = null
        })

    return refreshPromise
}

export async function apiFetch<T>(
    url: string,
    options: ApiFetchOptions = {}
): Promise<T> {
    const {
        responseType = "json",
        headers: customHeaders,
        ...fetchOptions
    } = options

    const buildHeaders = () => {
        const headers = new Headers(customHeaders)
        if (
            responseType === "json" &&
            !(fetchOptions.body instanceof FormData)
        ) {
            headers.set("Content-Type", "application/json")
        }
        return headers
    }

    const isFormData = fetchOptions.body instanceof FormData

    const makeRequest = () =>
        fetch(`${API_URL}${url}`, {
            credentials: "include",
            ...fetchOptions,
            headers: buildHeaders(), // свіжі headers кожен раз
            body:
                fetchOptions.body &&
                !isFormData &&
                typeof fetchOptions.body !== "string"
                    ? JSON.stringify(fetchOptions.body)
                    : fetchOptions.body,
        })

    let res = await makeRequest()

    if (res.status === 401 && url !== "users/auth/refresh/") {
        const refreshed = await tryRefreshToken()

        if (!refreshed) {
            if (typeof window !== "undefined") {
                window.location.href = "/login"
            }
            throw new Error("Session expired")
        }

        // Повторюємо оригінальний запит — cookie вже оновлений сервером
        res = await makeRequest()
    }

    if (!res.ok) {
        const error = await res.json().catch(() => null)
        throw {
            ...(error || {}),
            status: res.status,
            statusText: res.statusText,
        }
    }

    if (res.status === 204) {
        return undefined as T
    }

    if (responseType === "blob") {
        return (await res.blob()) as T
    }

    return res.json()
}
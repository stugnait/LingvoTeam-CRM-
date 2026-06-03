const API_URL = process.env.NEXT_PUBLIC_API_URL

type ResponseType = 'json' | 'blob'

type FetchOptionsWithGlobalError = RequestInit & {
    skipGlobalError?: boolean
}

export interface ApiFetchOptions extends RequestInit {
    responseType?: ResponseType
    skipGlobalError?: boolean // 👈 Додали наш прапорець
}

export async function apiFetch<T>(
    url: string,
    options: ApiFetchOptions = {}
): Promise<T> {
    const {
        responseType = 'json',
        skipGlobalError, // 👈 Дістаємо з options
        headers: customHeaders,
        ...fetchOptions
    } = options

    const headers = new Headers(customHeaders)

    // Content-Type тільки якщо НЕ blob і НЕ FormData
    if (
        responseType === 'json' &&
        !(fetchOptions.body instanceof FormData)
    ) {
        headers.set('Content-Type', 'application/json')
    }

    const isFormData = fetchOptions.body instanceof FormData

    const fetchOptionsWithGlobalError: FetchOptionsWithGlobalError = {
        credentials: 'include',
        ...fetchOptions,
        headers,
        body:
            fetchOptions.body &&
            !isFormData &&
            typeof fetchOptions.body !== "string"
                ? JSON.stringify(fetchOptions.body)
                : fetchOptions.body,

        // 👈 Передаємо прапорець у fetch, щоб його побачив Interceptor
        skipGlobalError: skipGlobalError
    }

    const res = await fetch(`${API_URL}${url}`, fetchOptionsWithGlobalError)

    if (!res.ok) {
        // ⚠️ error може бути НЕ json (наприклад 403 з text)
        const error = await res.json().catch(() => null)
        const apiError =
            error && typeof error === 'object' && !Array.isArray(error)
                ? error
                : { detail: error }

        throw {
            ...apiError,
            status: res.status,
            statusText: res.statusText,
        }
    }

    if (res.status === 204) {
        return undefined as T
    }

    // 🔑 ГОЛОВНЕ
    if (responseType === 'blob') {
        return (await res.blob()) as T
    }

    return res.json()
}

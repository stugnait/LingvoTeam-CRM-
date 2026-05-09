// src/shared/api/client.ts
const API_URL = process.env.NEXT_PUBLIC_API_URL

type ResponseType = 'json' | 'blob'

interface ApiFetchOptions extends RequestInit {
    responseType?: ResponseType
}

export async function apiFetch<T>(
    url: string,
    options: ApiFetchOptions = {}
): Promise<T> {
    const {
        responseType = 'json',
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

    const res = await fetch(`${API_URL}${url}`, {
        credentials: 'include',
        ...fetchOptions,
        headers,
        body:
            fetchOptions.body &&
            !isFormData &&
            typeof fetchOptions.body !== "string"
                ? JSON.stringify(fetchOptions.body)
                : fetchOptions.body,
    })

    if (!res.ok) {
        // ⚠️ error може бути НЕ json (наприклад 403 з text)
        const error = await res.json().catch(() => ({
            status: res.status,
            statusText: res.statusText,
        }))
        throw error
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

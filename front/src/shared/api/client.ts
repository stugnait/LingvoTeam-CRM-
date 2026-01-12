// src/shared/api/client.ts
const API_URL = process.env.NEXT_PUBLIC_API_URL

export async function apiFetch<T>(
    url: string,
    options: RequestInit = {}
): Promise<T> {
    const headers = new Headers(options.headers)

    // ✅ КЛЮЧОВА ЛОГІКА
    if (!(options.body instanceof FormData)) {
        headers.set("Content-Type", "application/json")
    }

    const res = await fetch(`${API_URL}${url}`, {
        credentials: "include",
        ...options,
        headers,
    })

    if (!res.ok) {
        const error = await res.json().catch(() => ({}))
        throw error
    }

    if (res.status === 204) {
        return undefined as T
    }

    return res.json()
}

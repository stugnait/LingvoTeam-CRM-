// src/shared/api/client.ts
const API_URL = process.env.NEXT_PUBLIC_API_URL;

export async function apiFetch<T>(
    url: string,
    options: RequestInit = {}
): Promise<T> {
    const res = await fetch(`${API_URL}${url}`, {
        credentials: "include",
        headers: {
            "Content-Type": "application/json",
            ...options.headers,
        },
        ...options,
    });

    if (!res.ok) {
        // error може бути без body
        const error = await res.json().catch(() => ({}));
        throw error;
    }

    // 🔴 КЛЮЧОВЕ ВИПРАВЛЕННЯ
    if (res.status === 204) {
        return undefined as T;
    }

    return res.json();
}

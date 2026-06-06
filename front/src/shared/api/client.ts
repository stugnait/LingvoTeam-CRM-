const API_URL = process.env.NEXT_PUBLIC_API_URL

type ResponseType = "json" | "blob"

export interface ApiFetchOptions extends RequestInit {
    responseType?: ResponseType
    skipGlobalError?: boolean
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

    const headers = new Headers(customHeaders)

    if (
        responseType === "json" &&
        !(fetchOptions.body instanceof FormData)
    ) {
        headers.set("Content-Type", "application/json")
    }

    const isFormData = fetchOptions.body instanceof FormData

    const requestConfig: RequestInit = {
        credentials: "include",
        ...fetchOptions,
        headers,
        body:
            fetchOptions.body &&
            !isFormData &&
            typeof fetchOptions.body !== "string"
                ? JSON.stringify(fetchOptions.body)
                : fetchOptions.body,
    }

    const makeRequest = () =>
        fetch(`${API_URL}${url}`, requestConfig)

    let res = await makeRequest()

    // Access token протух
    if (res.status === 401 && url !== "users/auth/refresh/") {
        const refreshRes = await fetch(`${API_URL}users/auth/refresh/`, {
            method: "POST",
            credentials: "include",
        })

        if (!refreshRes.ok) {
            if (typeof window !== "undefined") {
                window.location.href = "/login"
            }
            throw new Error("Session expired")
        }

        // невелика пауза щоб браузер встиг записати cookie
        await new Promise(resolve => setTimeout(resolve, 50))

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
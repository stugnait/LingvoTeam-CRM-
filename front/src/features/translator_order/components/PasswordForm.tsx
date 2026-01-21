"use client"

import { useState } from "react"

interface Props {
    onSubmit: (password: string) => void
    error?: string | null
}

export function PasswordForm({ onSubmit, error }: Props) {
    const [password, setPassword] = useState("")
    const [loading, setLoading] = useState(false)

    const handleSubmit = async () => {
        if (!password) return
        setLoading(true)
        await onSubmit(password)
        setLoading(false)
    }

    return (
        <div className="max-w-md mx-auto mt-24 p-6 border rounded-lg">
            <h1 className="text-xl font-semibold mb-4">
                Доступ до замовлення
            </h1>

            <input
                type="password"
                placeholder="Введіть пароль"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full border px-3 py-2 rounded mb-2"
            />

            {error && (
                <p className="text-red-500 text-sm mb-2">
                    {error}
                </p>
            )}

            <button
                onClick={handleSubmit}
                disabled={loading}
                className="w-full bg-black text-white py-2 rounded disabled:opacity-50"
            >
                {loading ? "Перевірка..." : "Отримати доступ"}
            </button>
        </div>
    )
}

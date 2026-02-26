import { useEffect, useState, useCallback } from "react"

interface Countdown {
    total: number
    days: number
    hours: number
    minutes: number
    seconds: number
    expired: boolean
}

export function useCountdown(deadline: string | null) {
    const calculate = useCallback((): Countdown => {
        if (!deadline) {
            return {
                total: 0,
                days: 0,
                hours: 0,
                minutes: 0,
                seconds: 0,
                expired: true,
            }
        }

        const end = new Date(deadline).getTime()
        const now = Date.now()
        const diff = end - now

        if (diff <= 0) {
            return {
                total: 0,
                days: 0,
                hours: 0,
                minutes: 0,
                seconds: 0,
                expired: true,
            }
        }

        return {
            total: diff,
            days: Math.floor(diff / (1000 * 60 * 60 * 24)),
            hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
            minutes: Math.floor((diff / (1000 * 60)) % 60),
            seconds: Math.floor((diff / 1000) % 60),
            expired: false,
        }
    }, [deadline])

    const [time, setTime] = useState<Countdown>(calculate)

    useEffect(() => {
        setTime(calculate())

        const interval = setInterval(() => {
            setTime(calculate())
        }, 1000)

        return () => clearInterval(interval)
    }, [calculate])

    return time
}
"use client"

import { useState, useEffect } from "react"
import { useToast } from "@/hooks/use-toast"

interface Settings {
    name: string
    email: string
    emailNotifications: boolean
    projectUpdates: boolean
}

export function useSettings() {
    const [settings, setSettings] = useState<Settings>({
        name: "",
        email: "",
        emailNotifications: true,
        projectUpdates: true,
    })
    const [isSaving, setIsSaving] = useState(false)
    const { toast } = useToast()

    useEffect(() => {
        // Load user settings from localStorage
        const currentUser = localStorage.getItem("currentUser")
        if (currentUser) {
            const user = JSON.parse(currentUser)
            setSettings({
                name: user.name || "",
                email: user.email || "",
                emailNotifications: user.emailNotifications ?? true,
                projectUpdates: user.projectUpdates ?? true,
            })
        }
    }, [])

    const updateSetting = (key: keyof Settings, value: any) => {
        setSettings((prev) => ({ ...prev, [key]: value }))
    }

    const saveSettings = async () => {
        setIsSaving(true)
        try {
            // Simulate API call
            await new Promise((resolve) => setTimeout(resolve, 1000))

            // Update localStorage
            const currentUser = JSON.parse(localStorage.getItem("currentUser") || "{}")
            const updatedUser = { ...currentUser, ...settings }
            localStorage.setItem("currentUser", JSON.stringify(updatedUser))

            toast({
                title: "Settings saved",
                description: "Your preferences have been updated.",
            })
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to save settings.",
                variant: "destructive",
            })
        } finally {
            setIsSaving(false)
        }
    }

    return {
        settings,
        updateSetting,
        saveSettings,
        isSaving,
    }
}

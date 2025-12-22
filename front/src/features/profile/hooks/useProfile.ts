"use client"

import { useEffect, useState } from "react"
import { profileApi } from "../api"
import type { ProfileUser } from "../types"
import { validateChangePassword } from "@/src/shared/validation/password"
import { useToast } from "@/src/hooks/use-toast"
import { useRouter } from "next/navigation"

export function useProfile() {
    const { toast } = useToast()
    const router = useRouter()

    const [user, setUser] = useState<ProfileUser | null>(null)
    const [loading, setLoading] = useState(true)

    const [profileForm, setProfileForm] = useState({
        full_name: "",
        email: "",
    })

    const [passwordForm, setPasswordForm] = useState({
        current_password: "",
        new_password: "",
        confirm_password: "",
    })

    const [passwordErrors, setPasswordErrors] = useState<Record<string, string>>({})

    // load profile
    useEffect(() => {
        profileApi.me()
            .then((data) => {
                setUser(data)
                setProfileForm({
                    full_name: data.full_name,
                    email: data.email,
                })
            })
            .finally(() => setLoading(false))
    }, [])

    // update basic info
    const saveProfile = async () => {
        try {
            const updated = await profileApi.updateProfile(profileForm)
            setUser(updated)

            toast({
                title: "Profile updated",
                description: "Your profile information has been saved",
            })
        } catch {
            toast({
                title: "Error",
                description: "Failed to update profile",
                variant: "error",
            })
        }
    }

    // change password
    const changePassword = async () => {
        const errors = validateChangePassword(passwordForm)
        setPasswordErrors(errors)

        if (Object.keys(errors).length > 0) {return}

        try {
            const res = await profileApi.changePassword({
                current_password: passwordForm.current_password,
                new_password: passwordForm.new_password,
                new_password_confirm: passwordForm.confirm_password
            })

            toast({
                title: "Password changed",
                description: res.message,
            })

            if (res.logout) {
                router.push("/login")
            }
        } catch (e: any) {
            toast({
                title: "Error",
                description: e?.detail || "Failed to change password",
                variant: "error",
            })
        }
    }

    return {
        user,
        loading,

        profileForm,
        setProfileForm,
        saveProfile,

        passwordForm,
        setPasswordForm,
        passwordErrors,
        changePassword,
    }
}

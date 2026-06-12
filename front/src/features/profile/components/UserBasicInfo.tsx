"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/src/components/ui/card"
import { Input } from "@/src/components/ui/input"
import { Button } from "@/src/components/ui/button"
import { useProfile } from "../hooks/useProfile"
import { useI18n } from "@/src/shared/i18n/I18nProvider"

export function UserBasicInfo() {
    const { t } = useI18n()
    const { profileForm, setProfileForm, saveProfile } = useProfile()

    return (
        <Card>
            <CardHeader>
                <CardTitle>{t("profile.basicInfo")}</CardTitle>
            </CardHeader>

            <CardContent className="space-y-4">
                <Input
                    placeholder={t("profile.fullName")}
                    value={profileForm.full_name}
                    onChange={(e) =>
                        setProfileForm((v) => ({ ...v, full_name: e.target.value }))
                    }
                />

                <Input
                    placeholder={t("auth.email")}
                    type="email"
                    value={profileForm.email}
                    onChange={(e) =>
                        setProfileForm((v) => ({ ...v, email: e.target.value }))
                    }
                />

                <Input
                    placeholder={t("profile.phone")}
                    type="phone"
                    value={profileForm.phone}
                    onChange={(e) =>
                        setProfileForm((v) => ({ ...v, phone: e.target.value }))
                    }
                />

                <Button className="w-full sm:w-auto" onClick={saveProfile}>{t("auth.saveChanges")}</Button>
            </CardContent>
        </Card>
    )
}

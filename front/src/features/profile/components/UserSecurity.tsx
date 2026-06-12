"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/src/components/ui/card"
import { Input } from "@/src/components/ui/input"
import { Button } from "@/src/components/ui/button"
import { useProfile } from "../hooks/useProfile"
import { useI18n } from "@/src/shared/i18n/I18nProvider"

export function UserSecurity() {
    const { t } = useI18n()
    const {
        passwordForm,
        setPasswordForm,
        passwordErrors,
        changePassword,
    } = useProfile()

    return (
        <Card>
            <CardHeader>
                <CardTitle>{t("profile.security")}</CardTitle>
            </CardHeader>

            <CardContent className="space-y-4">
                <Input
                    type="password"
                    placeholder={t("profile.currentPassword")}
                    value={passwordForm.current_password}
                    onChange={(e) =>
                        setPasswordForm((v) => ({
                            ...v,
                            current_password: e.target.value,
                        }))
                    }
                />
                {passwordErrors.current_password && (
                    <p className="text-sm text-destructive">
                        {passwordErrors.current_password}
                    </p>
                )}

                <Input
                    type="password"
                    placeholder={t("profile.newPassword")}
                    value={passwordForm.new_password}
                    onChange={(e) =>
                        setPasswordForm((v) => ({
                            ...v,
                            new_password: e.target.value,
                        }))
                    }
                />

                <Input
                    type="password"
                    placeholder={t("profile.confirmNewPassword")}
                    value={passwordForm.confirm_password}
                    onChange={(e) =>
                        setPasswordForm((v) => ({
                            ...v,
                            confirm_password: e.target.value,
                        }))
                    }
                />

                {passwordErrors.confirm_password && (
                    <p className="text-sm text-destructive">
                        {passwordErrors.confirm_password}
                    </p>
                )}

                <Button className="w-full sm:w-auto" onClick={changePassword}>{t("profile.changePassword")}</Button>
            </CardContent>
        </Card>
    )
}

"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/src/components/ui/card"
import { Input } from "@/src/components/ui/input"
import { Button } from "@/src/components/ui/button"
import { useProfile } from "../hooks/useProfile"

export function UserSecurity() {
    const {
        passwordForm,
        setPasswordForm,
        passwordErrors,
        changePassword,
    } = useProfile()

    return (
        <Card>
            <CardHeader>
                <CardTitle>Security</CardTitle>
            </CardHeader>

            <CardContent className="space-y-4">
                <Input
                    type="password"
                    placeholder="Current password"
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
                    placeholder="New password"
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
                    placeholder="Confirm new password"
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

                <Button onClick={changePassword}>Change password</Button>
            </CardContent>
        </Card>
    )
}

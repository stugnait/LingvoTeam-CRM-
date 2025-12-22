"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/src/components/ui/card"
import { Input } from "@/src/components/ui/input"
import { Button } from "@/src/components/ui/button"
import { useProfile } from "../hooks/useProfile"

export function UserBasicInfo() {
    const { profileForm, setProfileForm, saveProfile } = useProfile()

    return (
        <Card>
            <CardHeader>
                <CardTitle>Basic information</CardTitle>
            </CardHeader>

            <CardContent className="space-y-4">
                <Input
                    placeholder="Full name"
                    value={profileForm.full_name}
                    onChange={(e) =>
                        setProfileForm((v) => ({ ...v, full_name: e.target.value }))
                    }
                />

                <Input
                    placeholder="Email"
                    type="email"
                    value={profileForm.email}
                    onChange={(e) =>
                        setProfileForm((v) => ({ ...v, email: e.target.value }))
                    }
                />

                <Button onClick={saveProfile}>Save changes</Button>
            </CardContent>
        </Card>
    )
}

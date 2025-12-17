"use client"

import { Card } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { useSettings } from "../hooks/useSettings"

export function SettingsPage() {
    const { settings, updateSetting, saveSettings, isSaving } = useSettings()

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-foreground">Settings</h1>
                <p className="text-muted-foreground mt-1">Manage your account and application preferences</p>
            </div>

            <div className="grid gap-6">
                <Card className="p-6">
                    <h3 className="text-lg font-semibold mb-4">Account Settings</h3>
                    <div className="space-y-4">
                        <div className="grid gap-2">
                            <Label htmlFor="name">Full Name</Label>
                            <Input id="name" value={settings.name} onChange={(e) => updateSetting("name", e.target.value)} />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                type="email"
                                value={settings.email}
                                onChange={(e) => updateSetting("email", e.target.value)}
                            />
                        </div>
                    </div>
                </Card>

                <Card className="p-6">
                    <h3 className="text-lg font-semibold mb-4">Notifications</h3>
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <Label>Email Notifications</Label>
                                <p className="text-sm text-muted-foreground">Receive email updates about your projects</p>
                            </div>
                            <Switch
                                checked={settings.emailNotifications}
                                onCheckedChange={(checked) => updateSetting("emailNotifications", checked)}
                            />
                        </div>
                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <Label>Project Updates</Label>
                                <p className="text-sm text-muted-foreground">Get notified when projects are updated</p>
                            </div>
                            <Switch
                                checked={settings.projectUpdates}
                                onCheckedChange={(checked) => updateSetting("projectUpdates", checked)}
                            />
                        </div>
                    </div>
                </Card>

                <div className="flex justify-end">
                    <Button onClick={saveSettings} disabled={isSaving}>
                        {isSaving ? "Saving..." : "Save Changes"}
                    </Button>
                </div>
            </div>
        </div>
    )
}

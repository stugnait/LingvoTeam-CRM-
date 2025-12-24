"use client"

import { DashboardHeader } from "@/src/shared/components/layout/DashboardHeader"
import { UserBasicInfo } from "./UserBasicInfo"
import { UserSecurity } from "./UserSecurity"

export function UserProfilePage() {
    return (
        <>
            <DashboardHeader />
            <main className="flex-1 overflow-y-auto p-6">
                <div className="mx-auto max-w-4xl space-y-6">
                    <UserBasicInfo />
                    <UserSecurity />
                </div>
            </main>
        </>
    )
}

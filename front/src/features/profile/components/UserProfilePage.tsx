"use client"

import { DashboardHeader } from "@/src/shared/components/layout/DashboardHeader"
import { UserBasicInfo } from "./UserBasicInfo"
import { UserSecurity } from "./UserSecurity"

export function UserProfilePage() {
    return (
        <>
            <DashboardHeader />
            <main className="flex-1 overflow-y-auto p-3 sm:p-6">
                <div className="w-full min-w-0 space-y-4 sm:space-y-6">
                    <UserBasicInfo />
                    <UserSecurity />
                </div>
            </main>
        </>
    )
}
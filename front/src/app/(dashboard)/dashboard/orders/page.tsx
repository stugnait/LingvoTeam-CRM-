import { Suspense } from "react"
import MainOrder from "@/src/features/orders/components/MainOrder"
import { LoadingFallback } from "@/src/shared/i18n/LoadingFallback"

export default function Page() {
    return (
        <Suspense fallback={<LoadingFallback />}>
            <MainOrder />
        </Suspense>
    )
}

import { Suspense } from "react"
import MainOrder from "@/src/features/orders/components/MainOrder"

export default function Page() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <MainOrder />
        </Suspense>
    )
}
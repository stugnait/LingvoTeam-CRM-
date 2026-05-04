import { Suspense } from "react"
import FinanceTablePage from "@/src/features/salary/components/MainSalary"

export default function Page() {
    return (
        <Suspense fallback={<div>Завантаження фінансових даних...</div>}>
            <FinanceTablePage />
        </Suspense>
    )
}
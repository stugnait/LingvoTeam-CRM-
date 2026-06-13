import { Suspense } from "react"
import FinanceTablePage from "@/src/features/salary/components/MainSalary"
import { LoadingFallback } from "@/src/shared/i18n/LoadingFallback"

export default function Page() {
    return (
        <Suspense fallback={<LoadingFallback messageKey="salary.loadingFinance" />}>
            <FinanceTablePage />
        </Suspense>
    )
}

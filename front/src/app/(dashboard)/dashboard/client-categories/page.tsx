import { Suspense } from "react";
import ClientCategoriesPage from "@/src/features/categories/components/ClientCategoriesPage";

export default function Page() {
    return (
        // Fallback — це те, що бачитиме користувач мілісекунду,
        // поки клієнтський скрипт зчитує параметри URL
        <Suspense fallback={<div>Завантаження...</div>}>
            <ClientCategoriesPage />
        </Suspense>
    );
}
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export const useErrorInterceptor = () => {
    const router = useRouter();

    useEffect(() => {
        const { fetch: originalFetch } = window;

        window.fetch = async (...args) => {
            // Дістаємо налаштування (другий аргумент fetch)
            const config = args[1] as any;
            // Перевіряємо, чи є там наш прапорець
            const skipGlobalError = config?.skipGlobalError;

            const response = await originalFetch(...args);

            if (!response.ok) {
                if ([401, 405].includes(response.status)) {
                    router.push(`/${response.status}`);
                }
            }

            return response;
        };

        return () => {
            window.fetch = originalFetch;
        };
    }, [router]);
};
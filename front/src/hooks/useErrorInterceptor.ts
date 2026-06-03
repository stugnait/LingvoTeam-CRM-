'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

type FetchConfig = RequestInit & {
    skipGlobalError?: boolean;
};

export const useErrorInterceptor = () => {
    const router = useRouter();

    useEffect(() => {
        const { fetch: originalFetch } = window;

        window.fetch = async (...args: Parameters<typeof fetch>) => {
            // Дістаємо налаштування (другий аргумент fetch)
            const config: FetchConfig | undefined = args[1];
            // Перевіряємо, чи є там наш прапорець
            const skipGlobalError = config?.skipGlobalError;

            const response = await originalFetch(...args);

            if (!response.ok) {
                if (!skipGlobalError && [401, 405].includes(response.status)) {
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

'use client';

import { useErrorInterceptor } from "@/src/hooks/useErrorInterceptor";

export default function ErrorInterceptor({ children }: { children: React.ReactNode }) {
    useErrorInterceptor();
    return <>{children}</>;
}
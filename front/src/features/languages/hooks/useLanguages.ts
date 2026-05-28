import { useEffect, useState, useCallback } from "react";
import { languagesApi } from "../api";
import type { Language } from "../types";
import { useToast } from "@/src/hooks/use-toast";

export function useLanguages() {
    const [languages, setLanguages] = useState<Language[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [search, setSearch] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");
    const { toast } = useToast();

    // Debounce
    useEffect(() => {
        const timer = setTimeout(() => setDebouncedSearch(search), 400);
        return () => clearTimeout(timer);
    }, [search]);

    const fetchLanguages = useCallback(async (pageNumber: number = 1) => {
        setLoading(true);
        try {
            const res = await languagesApi.list(pageNumber, debouncedSearch);
            const items = Array.isArray(res) ? res : (res.results ?? []);
            const count = res.count ?? items.length;

            setLanguages(items);
            setTotalPages(Math.max(1, Math.ceil(count / 10)));
            setPage(pageNumber);
        } catch (e) {
            toast({ title: "Error", description: "Не вдалося завантажити", variant: "error" });
        } finally {
            setLoading(false);
        }
    }, [debouncedSearch]);

    useEffect(() => {
        fetchLanguages(1);
    }, [debouncedSearch]);

    const onPageChange = (newPage: number) => fetchLanguages(newPage);

    const addLanguage = useCallback(async (data: { name: string; slug: string }) => {
        await languagesApi.create(data);
        await fetchLanguages(page);
    }, [page, fetchLanguages]);

    const removeLanguage = useCallback(async (id: number) => {
        try {
            await languagesApi.delete(id);
            const newPage = languages.length === 1 && page > 1 ? page - 1 : page;
            await fetchLanguages(newPage);
        } catch {
            toast({ title: "Error", description: "Мова вже десь використовується", variant: "error" });
        }
    }, [languages.length, page, fetchLanguages]);

    return {
        languages, loading,
        page, totalPages, onPageChange,
        search, setSearch,
        addLanguage, removeLanguage,
        refetch: fetchLanguages,
    };
}
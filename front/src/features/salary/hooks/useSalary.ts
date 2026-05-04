
"use client"


import { useState, useCallback } from "react";
import { salaryApi, usersApi, translatorsApi } from "@/src/features/salary/api";
import {
    Salary,
    SalaryCreatePayload,
    User,
} from "@/src/features/salary/types";

// ─── Types ──────────────────────────────────────────────────────────────────

export interface SalaryPreview {
    user: number;
    full_name: string;
    base_salary: number;
    bonus: number;
    premium: number;
    revenue: number;
    orders_count: number;
    overdue_orders_count: number;
    margin: number;
    pages_count?: number;
    chars_count?: number;
    chars_with_spaces_count?: number;
}

export interface SalaryListState {
    items: Salary[];
    loading: boolean;
    error: string | null;
}

export interface UseSalaryManagementOptions {
    roleId?: number; // 🔥 Повертаємо на number, бо ми працюємо з ID (1, 2, 5)
}

// ─── Hook ────────────────────────────────────────────────────────────────────

export function useSalaryManagement(options?: UseSalaryManagementOptions) {
    const [users, setUsers] = useState<User[]>([]);
    const [usersLoading, setUsersLoading] = useState(false);
    const [usersError, setUsersError] = useState<string | null>(null);

    const [salaryList, setSalaryList] = useState<SalaryListState>({
        items: [],
        loading: false,
        error: null,
    });

    const [previews, setPreviews] = useState<Record<number, SalaryPreview>>({});
    const [previewsLoading, setPreviewsLoading] = useState(false);

    // ─── Завантаження юзерів ────────────────────────────────────────────────
    const fetchUsers = useCallback(async (roleId?: number) => {
        setUsersLoading(true);
        setUsersError(null);
        try {
            const currentRole = roleId ?? options?.roleId;
            let res;

            // 🔥 Перевіряємо на 5 (ID перекладачів)
            if (currentRole === 5 || String(currentRole) === "5") {
                const response = await translatorsApi.list();
                // 🔥 Дістаємо масив з об'єкта пагінації (якщо він є), інакше беремо саму response
                res = (response as any).results ? (response as any).results : response;
            } else {
                res = await usersApi.getForSalary(currentRole);
            }

            setUsers(res);
            return res;
        } catch (e: any) {
            setUsersError(e?.message ?? "Помилка завантаження працівників");
            return [];
        } finally {
            setUsersLoading(false);
        }
    }, [options?.roleId]);

    // ─── Завантаження списку зарплат ────────────────────────────────────────
    const fetchSalaryList = useCallback(async (params?: {
        user?: number;
        start_date?: string;
        end_date?: string;
        role?: number; // 🔥 Змінено назад на number
    }) => {
        setSalaryList(prev => ({ ...prev, loading: true, error: null }));
        try {
            const res = await salaryApi.list(params);
            const items = Array.isArray(res) ? res : (res as any).results ?? [];
            setSalaryList({ items, loading: false, error: null });
        } catch (e: any) {
            setSalaryList(prev => ({
                ...prev,
                loading: false,
                error: e?.message ?? "Помилка завантаження зарплат",
            }));
        }
    }, []);


    // ─── Завантаження ПРЕВ'Ю для ВСІХ юзерів ────────────────────────────────
    const fetchAllPreviews = useCallback(async (usersToFetch: User[], startDate: string, endDate: string, roleId: number) => {
        if (!usersToFetch || usersToFetch.length === 0) {
            setPreviews({});
            return;
        }

        setPreviewsLoading(true);
        try {
            const results = await Promise.all(
                usersToFetch.map(u =>
                    // 🔥 Передаємо roleId (1, 2 або 5)
                    salaryApi.preview({ user: u.id, start_date: startDate, end_date: endDate, role: String(roleId) })
                )
            );

            const newPreviews: Record<number, SalaryPreview> = {};
            results.forEach((res: any) => {
                newPreviews[res.user] = res;
            });
            setPreviews(newPreviews);

        } catch (e: any) {
            console.error("Помилка завантаження статистики", e);
        } finally {
            setPreviewsLoading(false);
        }
    }, []);

    // ─── Відкрити модалку превью ────────────────────────────────────────────

    const openPreviewModal = useCallback((userId: number) => {
        setPreview({
            open: true,
            userId,
            startDate: "",
            endDate: "",
            data: null,
            loading: false,
            error: null,
        });
        setFormValues({ base_salary: 0, bonus: 0, premium: 0 });
        setCreateState({ loading: false, error: null, success: false });
    }, []);

    // ─── Закрити модалку ────────────────────────────────────────────────────

    const closePreviewModal = useCallback(() => {
        setPreview(prev => ({ ...prev, open: false }));
    }, []);

    // ─── Оновити дати в модалці ─────────────────────────────────────────────

    const setPreviewDates = useCallback((startDate: string, endDate: string) => {
        setPreview(prev => ({ ...prev, startDate, endDate, data: null, error: null }));
    }, []);

    // ─── Завантажити превью статистики ──────────────────────────────────────

    const fetchPreview = useCallback(async () => {
        // Уникаємо зайвих запусків, якщо стейт ще не оновився
        const { userId, startDate, endDate } = preview;
        if (!userId || !startDate || !endDate) return;

        setPreview(prev => ({ ...prev, loading: true, error: null }));

        try {
            const data = await salaryApi.preview({ user: userId, start_date: startDate, end_date: endDate });

            setPreview(p => ({ ...p, data, loading: false }));

            // Виправлення помилки: Примусово конвертуємо в number
            setFormValues({
                base_salary: Number(data.base_salary) || 0,
                bonus: Number(data.bonus) || 0,
                premium: Number(data.premium) || 0,
            });
        } catch (e: any) {
            setPreview(p => ({
                ...p,
                loading: false,
                error: e?.message ?? "Помилка завантаження статистики",
            }));
        }
    }, [preview.userId, preview.startDate, preview.endDate]);

    const updateFormValue = useCallback(
        (field: keyof SalaryFormValues, value: number) => {
            setFormValues(prev => ({ ...prev, [field]: value }));
        },
        []
    );

    // ─── Порахувати тотал (утиліта для UI) ──────────────────────────────────

    const computedTotal = formValues.base_salary + formValues.bonus + formValues.premium;

    // ─── Зберегти зарплату ──────────────────────────────────────────────────
    const saveSalary = useCallback(async (
        userId: number,
        draft: { base_salary: number, bonus: number, premium: number },
        startDate: string,
        endDate: string,
        roleId: number // 🔥 Тут приймаємо number
    ): Promise<Salary | null> => {

        const payload: any = {
            start_date: startDate,
            end_date: endDate,
            base_salary: draft.base_salary,
            bonus: draft.bonus,
            premium: draft.premium,
        };

        // 🔥 Перевіряємо на 5
        if (roleId === 5 || String(roleId) === "5") {
            payload.translator = userId;
        } else {
            payload.user = userId;
        }

        try {
            const salary = await salaryApi.create(payload);
            setSalaryList(prev => ({ ...prev, items: [salary, ...prev.items] }));
            return salary;
        } catch (e: any) {

            console.error("Помилка збереження зарплати", e);

            const msg = e?.detail ?? e?.message ?? "Помилка збереження зарплати";
            setCreateState({ loading: false, error: msg, success: false });
            return null;
        }
    }, []);

    // ─── Скинути стан успіху (після показу нотіфікації) ─────────────────────

    const resetCreateState = useCallback(() => {
        setCreateState({ loading: false, error: null, success: false });
    }, []);

    // ─── Повна послідовність: відкрити → вибрати дати → завантажити превью ──

    /**
     * Хелпер для UI: дозволяє за одну функцію оновити дати і одразу загрузити превью.
     * Зручно якщо в UI є два date picker-и з onChange.
     */
    const handleDatesConfirm = useCallback(
        async (startDate: string, endDate: string) => {
            const { userId } = preview;
            if (!userId) return;

            setPreview(prev => ({
                ...prev,
                startDate,
                endDate,
                data: null,
                error: null,
                loading: true,
            }));

            try {
                const data = await salaryApi.preview({
                    user: userId,
                    start_date: startDate,
                    end_date: endDate,
                });
                setPreview(p => ({ ...p, data, loading: false }));
                setFormValues({
                    base_salary: Number(data.base_salary) || 0,
                    bonus: Number(data.bonus) || 0,
                    premium: Number(data.premium) || 0,
                });
            } catch (e: any) {
                setPreview(p => ({
                    ...p,
                    loading: false,
                    error: e?.message ?? "Помилка завантаження статистики",
                }));
            }
        },
        [preview.userId]
    );

    // ─── Return ──────────────────────────────────────────────────────────────

    return {
        users,
        usersLoading,
        usersError,
        fetchUsers,

        salaryList,
        fetchSalaryList,


        previews,
        previewsLoading,
        fetchAllPreviews,
        deleteSalary,

        // Превью модалка
        preview,
        openPreviewModal,
        closePreviewModal,
        setPreviewDates,
        fetchPreview,
        handleDatesConfirm,
        formValues,
        updateFormValue,
        computedTotal,

        saveSalary,
    };
}
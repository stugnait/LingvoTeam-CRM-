"use client"

import { useState, useCallback } from "react";
import { salaryApi, usersApi } from "@/src/features/salary/api";
import {
    Salary,
    SalaryPreview,
    SalaryCreatePayload,
    User,
} from "@/src/features/salary/types";

// ─── Types ──────────────────────────────────────────────────────────────────

export interface SalaryFormValues {
    base_salary: number;
    bonus: number;
    premium: number;
}

export interface PreviewState {
    open: boolean;
    userId: number | null;
    startDate: string;
    endDate: string;
    data: SalaryPreview | null;
    loading: boolean;
    error: string | null;
}

export interface CreateState {
    loading: boolean;
    error: string | null;
    success: boolean;
}

export interface SalaryListState {
    items: Salary[];
    loading: boolean;
    error: string | null;
}

export interface UseSalaryManagementOptions {
    roleId?: number;
}

// ─── Hook ────────────────────────────────────────────────────────────────────

export function useSalaryManagement(options?: UseSalaryManagementOptions) {
    // Список юзерів для таблиці
    const [users, setUsers] = useState<User[]>([]);
    const [usersLoading, setUsersLoading] = useState(false);
    const [usersError, setUsersError] = useState<string | null>(null);

    // Список збережених зарплат
    const [salaryList, setSalaryList] = useState<SalaryListState>({
        items: [],
        loading: false,
        error: null,
    });

    // Стан модалки превью + форми
    const [preview, setPreview] = useState<PreviewState>({
        open: false,
        userId: null,
        startDate: "",
        endDate: "",
        data: null,
        loading: false,
        error: null,
    });

    // Значення форми (ставка, бонус, премія)
    const [formValues, setFormValues] = useState<SalaryFormValues>({
        base_salary: 0,
        bonus: 0,
        premium: 0,
    });

    // Стан збереження зп
    const [createState, setCreateState] = useState<CreateState>({
        loading: false,
        error: null,
        success: false,
    });

    // ─── Завантаження юзерів ────────────────────────────────────────────────

    const fetchUsers = useCallback(async (roleId?: number) => {
        setUsersLoading(true);
        setUsersError(null);
        try {
            const res = await usersApi.getForSalary(roleId ?? options?.roleId);
            setUsers(res);
        } catch (e: any) {
            setUsersError(e?.message ?? "Помилка завантаження працівників");
        } finally {
            setUsersLoading(false);
        }
    }, [options?.roleId]);

    // ─── Завантаження списку зарплат ────────────────────────────────────────

    const fetchSalaryList = useCallback(async (params?: {
        user?: number;
        start_date?: string;
        end_date?: string;
        role?: number;
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

    const saveSalary = useCallback(async (): Promise<Salary | null> => {
        const { userId, startDate, endDate } = preview;
        if (!userId || !startDate || !endDate) {
            setCreateState(prev => ({
                ...prev,
                error: "Заповніть всі поля перед збереженням",
            }));
            return null;
        }

        setCreateState({ loading: true, error: null, success: false });

        const payload: SalaryCreatePayload = {
            user: userId,
            start_date: startDate,
            end_date: endDate,
            base_salary: formValues.base_salary,
            bonus: formValues.bonus,
            premium: formValues.premium,
        };

        try {
            const salary = await salaryApi.create(payload);
            setCreateState({ loading: false, error: null, success: true });
            // Оновлюємо список зарплат одразу
            setSalaryList(prev => ({ ...prev, items: [salary, ...prev.items] }));
            return salary;
        } catch (e: any) {
            const msg = e?.detail ?? e?.message ?? "Помилка збереження зарплати";
            setCreateState({ loading: false, error: msg, success: false });
            return null;
        }
    }, [preview, formValues]);

    // ─── Видалити зарплату ──────────────────────────────────────────────────

    const deleteSalary = useCallback(async (id: number) => {
        try {
            await salaryApi.delete(id);
            setSalaryList(prev => ({
                ...prev,
                items: prev.items.filter(s => s.id !== id),
            }));
            return true;
        } catch {
            return false;
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
        // Юзери
        users,
        usersLoading,
        usersError,
        fetchUsers,

        // Список зарплат
        salaryList,
        fetchSalaryList,
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

        // Збереження
        createState,
        saveSalary,
        resetCreateState,
    };
}
import { useState, useCallback } from "react";
import { salaryApi, usersApi } from "@/src/features/salary/api";
import {
    Salary,
    SalaryCreatePayload,
    User,
} from "@/src/features/salary/types";

// ─── Types ──────────────────────────────────────────────────────────────────

// Розширений тип прев'ю, що відповідає вашому бекенду
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
    const [users, setUsers] = useState<User[]>([]);
    const [usersLoading, setUsersLoading] = useState(false);
    const [usersError, setUsersError] = useState<string | null>(null);

    const [salaryList, setSalaryList] = useState<SalaryListState>({
        items: [],
        loading: false,
        error: null,
    });

    // Зберігаємо прев'ю (статистику) для КОЖНОГО користувача: { [userId]: SalaryPreview }
    const [previews, setPreviews] = useState<Record<number, SalaryPreview>>({});
    const [previewsLoading, setPreviewsLoading] = useState(false);

    // ─── Завантаження юзерів ────────────────────────────────────────────────
    const fetchUsers = useCallback(async (roleId?: number) => {
        setUsersLoading(true);
        setUsersError(null);
        try {
            const res = await usersApi.getForSalary(roleId ?? options?.roleId);
            setUsers(res);
            return res; // Повертаємо для ланцюжка промісів
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

    // ─── Завантаження ПРЕВ'Ю для ВСІХ юзерів ────────────────────────────────
    const fetchAllPreviews = useCallback(async (usersToFetch: User[], startDate: string, endDate: string) => {
        if (!usersToFetch || usersToFetch.length === 0) {
            setPreviews({});
            return;
        }

        setPreviewsLoading(true);
        try {
            // Робимо паралельні запити для кожного юзера з таблиці
            const results = await Promise.all(
                usersToFetch.map(u =>
                    salaryApi.preview({ user: u.id, start_date: startDate, end_date: endDate })
                )
            );

            // Перетворюємо масив результатів у об'єкт для зручного доступу в UI
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

    // ─── Зберегти зарплату (адаптовано для inline-рядків) ───────────────────
    const saveSalary = useCallback(async (
        userId: number,
        draft: { base_salary: number, bonus: number, premium: number },
        startDate: string,
        endDate: string
    ): Promise<Salary | null> => {

        const payload: SalaryCreatePayload = {
            user: userId,
            start_date: startDate,
            end_date: endDate,
            base_salary: draft.base_salary,
            bonus: draft.bonus,
            premium: draft.premium,
        };

        try {
            const salary = await salaryApi.create(payload);
            // Додаємо нову зарплату в історію транзакцій миттєво
            setSalaryList(prev => ({ ...prev, items: [salary, ...prev.items] }));
            return salary;
        } catch (e: any) {
            console.error("Помилка збереження зарплати", e);
            return null;
        }
    }, []);


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

        saveSalary,
    };
}
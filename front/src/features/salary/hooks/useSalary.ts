import { useState, useCallback } from "react";
import { salaryApi, usersApi, translatorsApi } from "@/src/features/salary/api";
import {
    Salary,
    SalaryCreatePayload,
    SalaryPreview,
    User,
} from "@/src/features/salary/types";

// ─── Types ──────────────────────────────────────────────────────────────────

// export interface SalaryPreview {
//     user: number;
//     full_name: string;
//     base_salary: number;
//     bonus: number;
//     premium: number;
//     revenue: number;
//     orders_count: number;
//     overdue_orders_count: number;
//     margin: number;
//     pages_count?: number;
//     chars_count?: number;
//     chars_with_spaces_count?: number;
// }

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
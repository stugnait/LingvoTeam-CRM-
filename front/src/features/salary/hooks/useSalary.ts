import { useState, useCallback } from "react";
import { salaryApi, usersApi, translatorsApi } from "@/src/features/salary/api";
import {
    Salary,
    SalaryCreatePayload,
    SalaryPreview,
    User,
} from "@/src/features/salary/types";
import { useToast } from "@/src/hooks/use-toast"; // 🔥 Додано імпорт тостів

// ─── Types ──────────────────────────────────────────────────────────────────

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
    const { toast } = useToast(); // 🔥 Ініціалізація хука тостів

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

            if (currentRole === 5 || String(currentRole) === "5") {
                const response = await translatorsApi.list();
                res = (response as any).results ? (response as any).results : response;
            } else {
                res = await usersApi.getForSalary(currentRole);
            }

            setUsers(res);
            return res;
        } catch (e: any) {
            const errorMessage = e?.message ?? "Помилка завантаження працівників";
            setUsersError(errorMessage);
            toast({
                title: "Помилка завантаження",
                description: errorMessage,
                variant: "error",
            });

            return [];
        } finally {
            setUsersLoading(false);
        }
    }, [options?.roleId, toast]);

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
            const errorMessage = e?.message ?? "Помилка завантаження зарплат";
            setSalaryList(prev => ({
                ...prev,
                loading: false,
                error: errorMessage,
            }));

            // 🔥 Тост про помилку
            toast({
                title: "Помилка",
                description: errorMessage,
                variant: "error",
            });
        }
    }, [toast]);

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
                    salaryApi.preview({ user: u.id, start_date: startDate, end_date: endDate, role: String(roleId) })
                        .catch(err => {
                            console.error(`Помилка завантаження статистики для юзера ${u.id}:`, err);
                            return null;
                        })
                )
            );

            const newPreviews: Record<number, SalaryPreview> = {};
            results.forEach((res: any) => {
                if (res && res.user) {
                    newPreviews[res.user] = res;
                }
            });
            setPreviews(newPreviews);

        } catch (e: any) {
            console.error("Помилка завантаження статистики", e);
            // 🔥 Тост про загальну помилку при зборі статистики
            toast({
                title: "Помилка статистики",
                description: "Не вдалося завантажити попередні розрахунки",
                variant: "error",
            });
        } finally {
            setPreviewsLoading(false);
        }
    }, [toast]);

    // ─── Зберегти зарплату ──────────────────────────────────────────────────
    const saveSalary = useCallback(async (
        userId: number,
        draft: { base_salary: number, bonus: number, premium: number },
        startDate: string,
        endDate: string,
        roleId: number
    ): Promise<Salary | null> => {

        const payload: any = {
            start_date: startDate,
            end_date: endDate,
            base_salary: draft.base_salary,
            bonus: draft.bonus,
            premium: draft.premium,
        };

        if (roleId === 5 || String(roleId) === "5") {
            payload.translator = userId;
        } else {
            payload.user = userId;
        }

        try {
            const salary = await salaryApi.create(payload);
            setSalaryList(prev => ({ ...prev, items: [salary, ...prev.items] }));

            // setPreviews(prev => ({
            //     ...prev,
            //     [userId]: {
            //         ...prev[userId],
            //         is_saved: true
            //     }
            // }));

            // 🔥 Тост про успішне збереження
            toast({
                title: "Збережено",
                description: "Фінансові дані працівника успішно оновлено",
            });

            return salary;
        } catch (e: any) {
            console.error("Помилка збереження зарплати", e);
            toast({
                title: "Помилка збереження",
                description: "Не вдалося оновити фінансові дані",
                variant: "error",
            });

            return null;
        }
    }, [toast]);

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
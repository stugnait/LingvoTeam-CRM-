"use client";

import { useState, useEffect, ElementType } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useMe } from "@/src/features/auth/hooks/useMe";
import { Button } from "../ui/button";
import {
    LayoutDashboard,
    FileText,
    Receipt,
    Wallet,
    Languages,
    Users,
    UserCog,
    User,
    CheckSquare,
    ChevronLeft,
    ChevronDown,
    Menu,
    X,
    BarChart2
} from "lucide-react";

interface NavItem {
    name: string;
    href: string;
    icon: ElementType;
    permissions?: string[];
    children?: { name: string; roleId?: number; tabId?: string; permissions?: string[] }[];
}

interface NavGroup {
    name: string;
    items: NavItem[];
}

const navGroups: NavGroup[] = [
    {
        name: "Головне",
        items: [
            {
                name: "Dashboard",
                href: "/dashboard",
                icon: LayoutDashboard,
                permissions: [],
                children: [
                    { name: "Фінанси (P&L)", tabId: "finance", permissions: ["statistic.pnl.view"] },
                    { name: "Ефективність команди", tabId: "team", permissions: ["statistic.kpi.manager", "statistic.kpi.translator"] },
                    { name: "Аналітика клієнтів", tabId: "clients", permissions: ["statistic.client.view"] },
                ]
            },
            { name: "Orders", href: "/dashboard/orders", icon: FileText, permissions: ["ui.tab.orders"] },
            { name: "Tasks", href: "/dashboard/editor", icon: CheckSquare, permissions: ["ui.tab.tasks"] },
            { name: "Clients", href: "/dashboard/clients", icon: Users, permissions: ["ui.tab.clients"] },
            { name: "Client-Categories", href: "/dashboard/client-categories", icon: CheckSquare, permissions: ["ui.tab.clients"] },
        ],
    },
    {
        name: "Фінанси",
        items: [
            { name: "Tariffs", href: "/dashboard/tariffs", icon: Receipt, permissions: ["ui.tab.tariffs"] },
            { name: "Stats", href: "/dashboard/stats", icon: BarChart2, permissions: ["ui.tab.stats"] },
            { name: "P&L", href: "/dashboard/p&l", icon: CheckSquare, permissions: ["ui.tab.pnl"] },
            {
                name: "Salary",
                href: "/dashboard/salary",
                icon: Wallet,
                permissions: ["ui.tab.salary"],
                children: [
                    { name: "Менеджер", roleId: 1, permissions: ["ui.tab.salary"] },
                    { name: "Редактор", roleId: 2, permissions: ["ui.tab.salary"] },
                    { name: "Перекладачі", roleId: 5, permissions: ["ui.tab.salary"] },
                ],
            },
        ],
    },
    {
        name: "Команда",
        items: [
            { name: "Translators", href: "/dashboard/translations", icon: Languages, permissions: ["ui.tab.translators"] },
            { name: "Users", href: "/dashboard/users", icon: UserCog, permissions: ["ui.tab.users"] },
            { name: "Profile", href: "/dashboard/profile", icon: User, permissions: [] },
        ],
    },
];

interface CrmSidebarProps {
    collapsed: boolean;
    toggle: () => void;
}

export function CrmSidebar({ collapsed, toggle }: CrmSidebarProps) {
    const pathname = usePathname();
    const searchParams = useSearchParams();

    const { user, loading } = useMe();
    const role = user?.role;
    const permissions = user?.permissions || [];

    const [isMobileOpen, setIsMobileOpen] = useState(false);
    const [isMobile, setIsMobile] = useState(false);
    const [openMenus, setOpenMenus] = useState<Record<string, boolean>>({});

    useEffect(() => {
        setOpenMenus({
            "/dashboard": pathname === "/dashboard",
            "/dashboard/salary": pathname.startsWith("/dashboard/salary"),
        });
    }, [pathname]);

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 1024);
        handleResize();
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    if (loading || !role) {
        return null;
    }

    const toggleMenu = (href: string) => {
        setOpenMenus(prev => ({ ...prev, [href]: !prev[href] }));
    };

    const hasAccess = (item: { permissions?: string[] }): boolean => {
        if (!item.permissions || item.permissions.length === 0) { return true; }
        return item.permissions.some(perm => permissions.includes(perm));
    };

    const filteredNavGroups = navGroups
        .map((group) => ({
            ...group,
            items: group.items.filter(hasAccess),
        }))
        .filter((group) => group.items.length > 0);

    return (
        <>
            <Button
                variant="ghost"
                size="icon"
                className={`
                    fixed top-4 z-[100] transition-all duration-300 lg:hidden
                    ${isMobileOpen ? "left-[13rem]" : "left-4"}
                `}
                onClick={() => setIsMobileOpen(!isMobileOpen)}
            >
                {isMobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </Button>

            <aside
                className={`
                    fixed inset-y-0 left-0 z-[100] flex flex-col border-r bg-background transition-all duration-300 ease-in-out
                    ${isMobile ? (isMobileOpen ? "w-64 translate-x-0 shadow-2xl" : "w-64 -translate-x-full") : collapsed ? "w-20 translate-x-0" : "w-64 translate-x-0"}
                `}
            >
                {!isMobile && (
                    <Button
                        variant="outline"
                        size="icon"
                        onClick={toggle}
                        className="absolute -right-4 top-6 z-50 flex h-8 w-8 items-center justify-center rounded-full border bg-background shadow-sm transition-transform hover:bg-muted"
                    >
                        <ChevronLeft
                            className={`h-4 w-4 text-muted-foreground transition-transform duration-300 ${collapsed ? "rotate-180" : ""}`}
                        />
                    </Button>
                )}

                <div className="flex h-16 shrink-0 items-center border-b px-6 overflow-hidden whitespace-nowrap">
                    <Link href="/dashboard" className="flex items-center gap-3">
                        <Languages className="h-5 w-5 shrink-0 text-primary" />
                        <span className={`font-bold tracking-tight transition-opacity duration-300 ${collapsed && !isMobile ? "opacity-0 w-0" : "opacity-100"}`}>
                            TranslateCRM
                        </span>
                    </Link>
                </div>

                <nav className={`flex-1 space-y-4 overflow-y-auto overflow-x-hidden py-4 ${collapsed && !isMobile ? "px-2" : "px-4"}`}>
                    {filteredNavGroups.map((group) => (
                        <div key={group.name} className="space-y-1">
                            {(!collapsed || isMobile) && (
                                <div className="px-3 py-1">
                                    <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground whitespace-nowrap">
                                        {group.name}
                                    </span>
                                </div>
                            )}

                            <div className="space-y-1">
                                {group.items.map((item) => {
                                    const Icon = item.icon;
                                    const isActive = pathname.startsWith(item.href) && (item.href !== "/dashboard" || pathname === "/dashboard");

                                    const visibleChildren = item.children?.filter(hasAccess);
                                    const hasChildren = visibleChildren && visibleChildren.length > 0;
                                    const isOpen = openMenus[item.href];

                                    if (hasChildren) {
                                        return (
                                            <div key={item.name} className="space-y-1 overflow-hidden">
                                                <button
                                                    onClick={() => toggleMenu(item.href)}
                                                    className={`
                                                        relative flex w-full items-center justify-between rounded-md px-3 py-2 text-sm font-medium transition-all duration-200 overflow-hidden
                                                        ${isActive ? "bg-muted text-foreground" : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"}
                                                        ${collapsed && !isMobile ? "justify-center" : ""}
                                                    `}
                                                >
                                                    {isActive && (
                                                        <span className="absolute left-0 top-1/2 h-[60%] w-[3px] -translate-y-1/2 rounded-r bg-primary" />
                                                    )}
                                                    <div className="flex items-center gap-3 whitespace-nowrap">
                                                        <Icon className="h-5 w-5 shrink-0" />
                                                        {(!collapsed || isMobile) && <span>{item.name}</span>}
                                                    </div>
                                                    {(!collapsed || isMobile) && (
                                                        <ChevronDown className={`h-4 w-4 shrink-0 transition-transform ${isOpen ? "rotate-180" : ""}`} />
                                                    )}
                                                </button>

                                                {isOpen && (!collapsed || isMobile) && (
                                                    <div className="ml-9 mt-1 space-y-1 animate-in slide-in-from-top-1 duration-200">
                                                        {visibleChildren.map((child, idx) => {
                                                            const query = child.tabId ? { tab: child.tabId } : { role: child.roleId?.toString() };

                                                            const isChildActive = child.tabId
                                                                ? (searchParams.get("tab") === child.tabId || (!searchParams.get("tab") && child.tabId === "finance" && pathname === item.href))
                                                                : searchParams.get("role") === String(child.roleId);

                                                            return (
                                                                <Link
                                                                    key={idx}
                                                                    href={{ pathname: item.href, query }}
                                                                    onClick={() => isMobile && setIsMobileOpen(false)}
                                                                    className={`
                                                                        flex items-center rounded-md px-3 py-2 text-sm transition-colors whitespace-nowrap
                                                                        ${isChildActive ? "text-primary font-medium" : "text-muted-foreground hover:text-foreground"}
                                                                    `}
                                                                >
                                                                    {child.name}
                                                                </Link>
                                                            );
                                                        })}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    }

                                    return (
                                        <Link
                                            key={item.name}
                                            href={item.href}
                                            onClick={() => isMobile && setIsMobileOpen(false)}
                                            className={`
                                                relative flex items-center rounded-md px-3 py-2 text-sm font-medium transition-all duration-200 overflow-hidden
                                                ${isActive ? "bg-muted text-foreground" : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"}
                                                ${collapsed && !isMobile ? "justify-center" : ""}
                                            `}
                                            title={collapsed ? item.name : undefined}
                                        >
                                            {isActive && (
                                                <span className="absolute left-0 top-1/2 h-[60%] w-[3px] -translate-y-1/2 rounded-r bg-primary" />
                                            )}
                                            <Icon className="h-5 w-5 shrink-0" />
                                            {(!collapsed || isMobile) && (
                                                <span className="ml-3 whitespace-nowrap">{item.name}</span>
                                            )}
                                        </Link>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </nav>

                <div className={`border-t p-4 text-sm text-muted-foreground overflow-hidden whitespace-nowrap ${collapsed && !isMobile ? "px-2 text-center" : ""}`}>
                    {(!collapsed || isMobile) ? (
                        <span>Role: <b className="text-foreground">{role?.name || role}</b></span>
                    ) : (
                        <b className="uppercase text-foreground">{(role?.name || role)?.charAt(0)}</b>
                    )}
                </div>
            </aside>

            {isMobileOpen && isMobile && (
                <div
                    className="fixed inset-0 z-[90] bg-black/50 duration-200 animate-in fade-in backdrop-blur-sm"
                    onClick={() => setIsMobileOpen(false)}
                />
            )}
        </>
    );
}
import { useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip as ReTooltip,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  AreaChart,
  Area,
} from "recharts";
import { useDashboardStore } from "@/features/dashboard/store";
import { useSupplierStore } from "@/features/suppliers/store";
import { useClientStore } from "@/features/clients/store";
import { useUserStore } from "@/features/users/store";
import { useRoleStore } from "@/features/roles/store";
import { useDashboardSocket } from "@/hooks/useDashboardSocket";
import { formatCurrency } from "@/utils/format";

// ── color maps ────────────────────────────────────────────────────────────────

const ORDER_STATUS_COLORS: Record<string, string> = {
  PENDING: "#f59e0b",
  PROCESSING: "#3b82f6",
  CONFIRMED: "#6366f1",
  SHIPPED: "#14b8a6",
  DELIVERED: "#10b981",
  CANCELLED: "#ef4444",
  COMPLETED: "#22c55e",
};

const PAYMENT_COLORS: Record<string, string> = {
  PAID: "#22c55e",
  PARTIAL: "#f59e0b",
  UNPAID: "#ef4444",
  REFUNDED: "#94a3b8",
};

// ── stat card config ──────────────────────────────────────────────────────────

const STAT_CARDS = [
  {
    labelKey: "nav.categories",
    storeKey: "categories",
    bg: "bg-indigo-50",
    iconColor: "text-indigo-600",
    icon: "M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z",
    link: "/categories",
  },
  {
    labelKey: "nav.products",
    storeKey: "products",
    bg: "bg-teal-50",
    iconColor: "text-teal-600",
    icon: "M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4",
    link: "/products",
  },
  {
    labelKey: "nav.brands",
    storeKey: "brands",
    bg: "bg-orange-50",
    iconColor: "text-orange-500",
    icon: "M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z",
    link: "/brands",
  },
  {
    labelKey: "nav.orders",
    storeKey: "orders",
    bg: "bg-emerald-50",
    iconColor: "text-emerald-600",
    icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01",
    link: "/orders",
  },
  {
    labelKey: "nav.suppliers",
    storeKey: "suppliers",
    bg: "bg-purple-50",
    iconColor: "text-purple-600",
    icon: "M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z",
    link: "/suppliers",
  },
  {
    labelKey: "nav.clients",
    storeKey: "clients",
    bg: "bg-red-50",
    iconColor: "text-red-500",
    icon: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z",
    link: "/clients",
  },
  {
    labelKey: "nav.users",
    storeKey: "users",
    bg: "bg-sky-50",
    iconColor: "text-sky-600",
    icon: "M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z",
    link: "/users",
  },
  {
    labelKey: "nav.roles",
    storeKey: "roles",
    bg: "bg-amber-50",
    iconColor: "text-amber-600",
    icon: "M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z",
    link: "/roles",
  },
] as const;

// ── helpers ───────────────────────────────────────────────────────────────────

function ChartCard({
  title,
  children,
  className = "",
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`bg-white rounded-xl p-5 shadow-sm ${className}`}>
      <h3 className="text-sm font-semibold text-slate-700 mb-4">{title}</h3>
      {children}
    </div>
  );
}

function LoadingBar() {
  return (
    <div className="flex items-center justify-center h-full min-h-[160px]">
      <div className="w-6 h-6 rounded-full border-2 border-indigo-200 border-t-indigo-600 animate-spin" />
    </div>
  );
}

// ── component ─────────────────────────────────────────────────────────────────

export function Dashboard() {
  const { t } = useTranslation();

  // Dashboard API — covers products, brands, categories, orders, amounts
  const fetchDashboard = useDashboardStore((s) => s.fetch);
  const dashboard = useDashboardStore((s) => s.data);
  const loading = useDashboardStore((s) => s.loading);
  const lastUpdated = useDashboardStore((s) => s.lastUpdated);

  // Individual fetches — only for resources not in the dashboard API
  const fetchSuppliers = useSupplierStore((s) => s.fetchAll);
  const fetchClients = useClientStore((s) => s.fetchAll);
  const fetchUsers = useUserStore((s) => s.fetchAll);
  const fetchRoles = useRoleStore((s) => s.fetchAll);

  const supplierCount = useSupplierStore((s) => s.totalCount);
  const clientCount = useClientStore((s) => s.totalCount);
  const userCount = useUserStore((s) => s.totalCount);
  const roleCount = useRoleStore((s) => s.totalCount);

  // Real-time: refresh whenever an order or payment event fires
  const { connected } = useDashboardSocket(fetchDashboard);

  useEffect(() => {
    // Socket triggers fetchDashboard on connect, so no need to call it here.
    // Side-resource counts only need a one-time fetch (size=1 for totalCount).
    Promise.all([
      fetchSuppliers(1, 1),
      fetchClients(1, 1),
      fetchUsers(1, 1),
      fetchRoles(1, 1),
    ]);
  }, [fetchSuppliers, fetchClients, fetchUsers, fetchRoles]);

  const counts: Record<string, number> = {
    categories: dashboard?.totalCategories ?? 0,
    products: dashboard?.totalProducts ?? 0,
    brands: dashboard?.totalBrands ?? 0,
    orders: dashboard?.totalOrders ?? 0,
    suppliers: supplierCount,
    clients: clientCount,
    users: userCount,
    roles: roleCount,
  };

  // Pivot payment chart: one row per month, each payment status as a key
  const pivotedPayments = useMemo(() => {
    const items = dashboard?.paymentChart ?? [];
    const map = new Map<string, Record<string, number | string>>();
    for (const item of items) {
      if (!map.has(item.monthLabel)) {
        map.set(item.monthLabel, { monthLabel: item.monthLabel });
      }
      const row = map.get(item.monthLabel)!;
      row[item.status] = (Number(row[item.status] ?? 0)) + item.totalAmount;
    }
    return Array.from(map.values());
  }, [dashboard?.paymentChart]);

  const paymentStatuses = useMemo(() => {
    const s = new Set((dashboard?.paymentChart ?? []).map((i) => i.status));
    return [...s];
  }, [dashboard?.paymentChart]);

  const lastUpdatedLabel = lastUpdated
    ? lastUpdated.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })
    : null;

  return (
    <div className="p-4 md:p-7 flex flex-col gap-5 md:gap-7">

      {/* ── Toolbar: live indicator + last updated + refresh ────────────────── */}
      <div className="flex items-center justify-between gap-3">
        <span
          className={`flex items-center gap-1.5 text-xs font-medium ${connected ? "text-green-600" : "text-slate-400"}`}
        >
          <span
            className={`w-2 h-2 rounded-full ${connected ? "bg-green-500 animate-pulse" : "bg-slate-300"}`}
          />
          {connected ? t("payment.liveConnected") : t("payment.liveDisconnected")}
        </span>

        <div className="flex items-center gap-3">
          {lastUpdatedLabel && (
            <span className="text-xs text-slate-400">
              {t("dashboard.lastUpdated")}: {lastUpdatedLabel}
            </span>
          )}
          <button
            onClick={fetchDashboard}
            disabled={loading}
            className="flex items-center gap-1.5 text-xs font-medium text-indigo-600 hover:text-indigo-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <svg
              className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            {t("dashboard.refresh")}
          </button>
        </div>
      </div>

      {/* ── Stat cards ──────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-5">
        {STAT_CARDS.map((stat) => (
          <Link
            key={stat.labelKey}
            to={stat.link}
            className="bg-white rounded-xl p-5 md:p-6 flex items-center gap-4 shadow-sm hover:-translate-y-0.5 hover:shadow-md transition-all duration-150 no-underline"
          >
            <div
              className={`${stat.bg} ${stat.iconColor} w-12 h-12 rounded-xl flex items-center justify-center shrink-0`}
            >
              <svg
                className="w-6 h-6"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d={stat.icon} />
              </svg>
            </div>
            <div>
              <p className="text-2xl md:text-3xl font-extrabold text-slate-900 leading-none mb-1">
                {counts[stat.storeKey]}
              </p>
              <p className="text-sm text-slate-500 font-medium">
                {t(stat.labelKey)}
              </p>
            </div>
          </Link>
        ))}
      </div>

      {/* ── Revenue highlight ───────────────────────────────────────────────── */}
      <div className="bg-gradient-to-br from-indigo-600 to-indigo-800 rounded-xl p-6 md:p-8 text-white flex items-center justify-between gap-4">
        <div>
          <p className="text-indigo-200 text-sm font-medium mb-1">
            {t("dashboard.totalRevenue")}
          </p>
          <p className="text-3xl md:text-4xl font-extrabold tracking-tight">
            {formatCurrency(dashboard?.totalOrderAmount ?? 0)}
          </p>
          <p className="text-indigo-200 text-xs mt-2">
            {t("dashboard.welcomeDesc")}
          </p>
        </div>
        <div className="bg-white/10 rounded-full w-16 h-16 flex items-center justify-center shrink-0">
          <svg
            className="w-8 h-8 text-white"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="1.8"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>
      </div>

      {/* ── Row: Order Status (donut) + Monthly Payment Chart ───────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 md:gap-7">

        {/* Order status donut */}
        <ChartCard title={t("dashboard.orderStatus")}>
          {loading ? (
            <LoadingBar />
          ) : (dashboard?.orderStatusSummary ?? []).length === 0 ? (
            <div className="flex items-center justify-center min-h-[200px] text-slate-400 text-sm">
              {t("common.noData")}
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={dashboard!.orderStatusSummary}
                  dataKey="count"
                  nameKey="status"
                  cx="50%"
                  cy="50%"
                  innerRadius={52}
                  outerRadius={82}
                  paddingAngle={2}
                >
                  {dashboard!.orderStatusSummary.map((entry) => (
                    <Cell
                      key={entry.status}
                      fill={ORDER_STATUS_COLORS[entry.status] ?? "#94a3b8"}
                    />
                  ))}
                </Pie>
                <ReTooltip
                  formatter={(value: number, name: string) => [
                    `${value} orders — ${formatCurrency(
                      dashboard!.orderStatusSummary.find(
                        (s) => s.status === name
                      )?.totalAmount ?? 0
                    )}`,
                    name,
                  ]}
                />
                <Legend
                  iconType="circle"
                  iconSize={8}
                  formatter={(value) => (
                    <span className="text-xs text-slate-600">{value}</span>
                  )}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        {/* Monthly payment area chart */}
        <ChartCard
          title={t("dashboard.paymentChart")}
          className="lg:col-span-2"
        >
          {loading ? (
            <LoadingBar />
          ) : pivotedPayments.length === 0 ? (
            <div className="flex items-center justify-center min-h-[200px] text-slate-400 text-sm">
              {t("common.noData")}
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart
                data={pivotedPayments}
                margin={{ top: 4, right: 12, left: 8, bottom: 0 }}
              >
                <defs>
                  {paymentStatuses.map((status) => (
                    <linearGradient
                      key={status}
                      id={`grad-${status}`}
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop
                        offset="5%"
                        stopColor={PAYMENT_COLORS[status] ?? "#94a3b8"}
                        stopOpacity={0.35}
                      />
                      <stop
                        offset="95%"
                        stopColor={PAYMENT_COLORS[status] ?? "#94a3b8"}
                        stopOpacity={0.02}
                      />
                    </linearGradient>
                  ))}
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis
                  dataKey="monthLabel"
                  tick={{ fontSize: 11, fill: "#94a3b8" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: "#94a3b8" }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v: number) => `$${v >= 1000 ? `${(v / 1000).toFixed(1)}k` : v}`}
                />
                <ReTooltip
                  formatter={(v: number) => formatCurrency(v)}
                  contentStyle={{
                    borderRadius: "8px",
                    border: "1px solid #e2e8f0",
                    fontSize: "12px",
                  }}
                />
                <Legend
                  iconType="circle"
                  iconSize={8}
                  formatter={(value) => (
                    <span className="text-xs text-slate-600">{value}</span>
                  )}
                />
                {paymentStatuses.map((status) => (
                  <Area
                    key={status}
                    type="monotone"
                    dataKey={status}
                    stackId="1"
                    stroke={PAYMENT_COLORS[status] ?? "#94a3b8"}
                    fill={`url(#grad-${status})`}
                    strokeWidth={2}
                  />
                ))}
              </AreaChart>
            </ResponsiveContainer>
          )}
        </ChartCard>
      </div>

      {/* ── Row: Products by Brand + Products by Category ───────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-7">

        {/* Products by Brand */}
        <ChartCard title={t("dashboard.productsByBrand")}>
          {loading ? (
            <LoadingBar />
          ) : (dashboard?.productsByBrand ?? []).length === 0 ? (
            <div className="flex items-center justify-center min-h-[160px] text-slate-400 text-sm">
              {t("common.noData")}
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={Math.max(180, (dashboard?.productsByBrand.length ?? 0) * 36)}>
              <BarChart
                data={dashboard!.productsByBrand}
                layout="vertical"
                margin={{ top: 0, right: 16, left: 0, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                <XAxis
                  type="number"
                  tick={{ fontSize: 11, fill: "#94a3b8" }}
                  axisLine={false}
                  tickLine={false}
                  allowDecimals={false}
                />
                <YAxis
                  type="category"
                  dataKey="brandName"
                  tick={{ fontSize: 11, fill: "#64748b" }}
                  axisLine={false}
                  tickLine={false}
                  width={90}
                />
                <ReTooltip
                  contentStyle={{
                    borderRadius: "8px",
                    border: "1px solid #e2e8f0",
                    fontSize: "12px",
                  }}
                />
                <Bar
                  dataKey="productCount"
                  name={t("dashboard.products")}
                  fill="#6366f1"
                  radius={[0, 4, 4, 0]}
                  maxBarSize={18}
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        {/* Products by Category */}
        <ChartCard title={t("dashboard.productsByCategory")}>
          {loading ? (
            <LoadingBar />
          ) : (dashboard?.productsByCategory ?? []).length === 0 ? (
            <div className="flex items-center justify-center min-h-[160px] text-slate-400 text-sm">
              {t("common.noData")}
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={Math.max(180, (dashboard?.productsByCategory.length ?? 0) * 36)}>
              <BarChart
                data={dashboard!.productsByCategory}
                layout="vertical"
                margin={{ top: 0, right: 16, left: 0, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                <XAxis
                  type="number"
                  tick={{ fontSize: 11, fill: "#94a3b8" }}
                  axisLine={false}
                  tickLine={false}
                  allowDecimals={false}
                />
                <YAxis
                  type="category"
                  dataKey="categoryName"
                  tick={{ fontSize: 11, fill: "#64748b" }}
                  axisLine={false}
                  tickLine={false}
                  width={90}
                />
                <ReTooltip
                  contentStyle={{
                    borderRadius: "8px",
                    border: "1px solid #e2e8f0",
                    fontSize: "12px",
                  }}
                />
                <Bar
                  dataKey="productCount"
                  name={t("dashboard.products")}
                  fill="#14b8a6"
                  radius={[0, 4, 4, 0]}
                  maxBarSize={18}
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>
      </div>
    </div>
  );
}

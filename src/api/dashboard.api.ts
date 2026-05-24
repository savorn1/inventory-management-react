import { http } from "./http";
import type { ApiResponse } from "./types";

// ── Sub-types ────────────────────────────────────────────────────────────────

export interface BrandProductCountDTO {
  brandName: string;
  productCount: number;
}

export interface CategoryProductCountDTO {
  categoryName: string;
  productCount: number;
}

export interface OrderStatusSummaryDTO {
  status: string;
  count: number;
  totalAmount: number;
}

export interface PaymentChartItemDTO {
  year: number;
  month: number;
  monthLabel: string; // e.g. "Jan 2025"
  status: string;
  count: number;
  totalAmount: number;
}

// ── Root DTO ─────────────────────────────────────────────────────────────────

export interface DashboardDTO {
  // Overview counts
  totalProducts: number;
  totalBrands: number;
  totalCategories: number;
  totalOrders: number;
  totalOrderAmount: number;

  // Products breakdown
  productsByBrand: BrandProductCountDTO[];
  productsByCategory: CategoryProductCountDTO[];

  // Orders breakdown by status
  orderStatusSummary: OrderStatusSummaryDTO[];

  // Payment chart (monthly, grouped by status)
  paymentChart: PaymentChartItemDTO[];
}

// ── API object ───────────────────────────────────────────────────────────────

export const dashboardApi = {
  /** Requires ORDER_READ permission. */
  get: () => http.get<ApiResponse<DashboardDTO>>("api/dashboard"),
};

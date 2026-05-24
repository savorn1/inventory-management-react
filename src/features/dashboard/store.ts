import { create } from "zustand";
import { dashboardApi } from "@/api/dashboard.api";
import type { DashboardDTO } from "@/api/dashboard.api";

interface DashboardState {
  data: DashboardDTO | null;
  loading: boolean;
  error: string | null;
  lastUpdated: Date | null;

  fetch: () => Promise<void>;
}

const EMPTY: DashboardDTO = {
  totalProducts: 0,
  totalBrands: 0,
  totalCategories: 0,
  totalOrders: 0,
  totalOrderAmount: 0,
  productsByBrand: [],
  productsByCategory: [],
  orderStatusSummary: [],
  paymentChart: [],
};

export const useDashboardStore = create<DashboardState>((set) => ({
  data: null,
  loading: false,
  error: null,
  lastUpdated: null,

  fetch: async () => {
    set({ loading: true, error: null });
    try {
      const res = await dashboardApi.get();
      set({ data: res.data ?? EMPTY, loading: false, lastUpdated: new Date() });
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : "Failed to load dashboard",
        loading: false,
        data: EMPTY,
        lastUpdated: new Date(),
      });
    }
  },
}));

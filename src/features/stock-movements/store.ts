import { create } from "zustand";
import { stockMovementsApi } from "@/api/stock-movements.api";
import type { StockMovementDTO } from "@/api/stock-movements.api";

interface StockMovementStore {
  items: StockMovementDTO[];
  loading: boolean;
  page: number;
  size: number;
  totalCount: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
  search: string;
  typeFilter: "IN" | "OUT" | "";
  fetchAll: (p?: number, s?: number, q?: string, type?: "IN" | "OUT" | "") => Promise<void>;
  goToPage: (p: number) => Promise<void>;
  changeSize: (s: number) => Promise<void>;
  searchByProduct: (q: string) => void;
  setTypeFilter: (type: "IN" | "OUT" | "") => void;
}

export const useStockMovementStore = create<StockMovementStore>((set, get) => ({
  items: [],
  loading: false,
  page: 1,
  size: 10,
  totalCount: 0,
  totalPages: 0,
  hasNext: false,
  hasPrev: false,
  search: "",
  typeFilter: "",

  async fetchAll(
    p = get().page,
    s = get().size,
    q = get().search,
    type = get().typeFilter,
  ) {
    set({ loading: true, page: p, size: s });
    try {
      const res = await stockMovementsApi.getAll(p, s, q, type);
      set({
        items: res.data,
        totalCount: res.metadata.totalCount,
        totalPages: res.metadata.totalPage,
        hasNext: res.metadata.hasNext,
        hasPrev: res.metadata.hasPrev,
      });
    } finally {
      set({ loading: false });
    }
  },

  goToPage: (p) => get().fetchAll(p),
  changeSize: (s) => get().fetchAll(1, s),

  searchByProduct(q) {
    set({ search: q });
    get().fetchAll(1, get().size, q, get().typeFilter);
  },

  setTypeFilter(type) {
    set({ typeFilter: type });
    get().fetchAll(1, get().size, get().search, type);
  },
}));

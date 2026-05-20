import { create } from "zustand";
import { brandsApi } from "@/api/brands.api";
import type { BrandDTO } from "@/api/brands.api";

interface BrandStore {
  items: BrandDTO[];
  loading: boolean;
  page: number;
  size: number;
  totalCount: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
  search: string;
  fetchAll: (p?: number, s?: number, q?: string) => Promise<void>;
  goToPage: (p: number) => Promise<void>;
  changeSize: (s: number) => Promise<void>;
  searchByName: (q: string) => Promise<void>;
  add: (payload: Omit<BrandDTO, "id">) => Promise<void>;
  remove: (id: number) => Promise<void>;
}

export const useBrandStore = create<BrandStore>((set, get) => ({
  items: [],
  loading: false,
  page: 1,
  size: 10,
  totalCount: 0,
  totalPages: 0,
  hasNext: false,
  hasPrev: false,
  search: "",

  async fetchAll(p = get().page, s = get().size, q = get().search) {
    set({ loading: true, page: p, size: s });
    try {
      const res = await brandsApi.getAll(p, s, q);
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
  searchByName(q) {
    set({ search: q });
    return get().fetchAll(1, get().size, q);
  },

  async add(payload) {
    await brandsApi.create(payload);
    await get().fetchAll(1, get().size);
  },

  async remove(id) {
    await brandsApi.delete(id);
    const remaining = get().items.filter((i) => i.id !== id).length;
    const targetPage =
      remaining === 0 && get().page > 1 ? get().page - 1 : get().page;
    await get().fetchAll(targetPage);
  },
}));

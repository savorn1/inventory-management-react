import { create } from "zustand";
import { productsApi } from "@/api/products.api";
import type { ProductDTO, CreateProductDTO } from "@/api/products.api";

interface ProductStore {
  items: ProductDTO[];
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
  add: (payload: CreateProductDTO) => Promise<void>;
  update: (id: number, payload: CreateProductDTO) => Promise<void>;
  remove: (id: number) => Promise<void>;
}

export const useProductStore = create<ProductStore>((set, get) => ({
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
      const res = await productsApi.getAll(p, s, q);
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
    await productsApi.create(payload);
    await get().fetchAll(1, get().size);
  },

  async update(id, payload) {
    await productsApi.update(id, payload);
    await get().fetchAll(get().page, get().size);
  },

  async remove(id) {
    await productsApi.delete(id);
    const remaining = get().items.filter((i) => i.id !== id).length;
    const targetPage =
      remaining === 0 && get().page > 1 ? get().page - 1 : get().page;
    await get().fetchAll(targetPage);
  },
}));

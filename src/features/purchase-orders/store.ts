import { create } from "zustand";
import { purchaseOrdersApi } from "@/api/purchase-orders.api";
import type {
  PurchaseOrderDTO,
  CreatePurchaseOrderDTO,
  ReceivePurchaseOrderDTO,
} from "@/api/purchase-orders.api";

interface PurchaseOrderState {
  items: PurchaseOrderDTO[];
  loading: boolean;
  page: number;
  size: number;
  totalCount: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
  search: string;
  statusFilter: string[];
}

interface PurchaseOrderActions {
  fetchAll: (
    page?: number,
    size?: number,
    search?: string,
    statusFilter?: string[],
  ) => Promise<void>;
  goToPage: (page: number) => Promise<void>;
  changeSize: (size: number) => Promise<void>;
  searchPOs: (query: string) => Promise<void>;
  setStatusFilter: (status: string[]) => Promise<void>;
  add: (payload: CreatePurchaseOrderDTO) => Promise<void>;
  updateStatus: (id: number, status: string) => Promise<void>;
  receiveItems: (id: number, dto: ReceivePurchaseOrderDTO) => Promise<void>;
  remove: (id: number) => Promise<void>;
}

type PurchaseOrderStore = PurchaseOrderState & PurchaseOrderActions;

const initialState: PurchaseOrderState = {
  items: [],
  loading: false,
  page: 1,
  size: 10,
  totalCount: 0,
  totalPages: 0,
  hasNext: false,
  hasPrev: false,
  search: "",
  statusFilter: [],
};

export const usePurchaseOrderStore = create<PurchaseOrderStore>((set, get) => ({
  ...initialState,

  async fetchAll(
    page = get().page,
    size = get().size,
    search = get().search,
    statusFilter = get().statusFilter,
  ) {
    set({ loading: true, page, size });
    try {
      const res = await purchaseOrdersApi.getAll(
        page,
        size,
        search,
        statusFilter,
      );
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

  goToPage: (page) => get().fetchAll(page),

  changeSize: (size) => get().fetchAll(1, size),

  searchPOs(query) {
    set({ search: query });
    return get().fetchAll(1, get().size, query);
  },

  setStatusFilter(statusFilter) {
    set({ statusFilter });
    return get().fetchAll(1, get().size, get().search, statusFilter);
  },

  async add(payload) {
    await purchaseOrdersApi.create(payload);
    await get().fetchAll(1, get().size);
  },

  async updateStatus(id, status) {
    await purchaseOrdersApi.updateStatus(id, status);
    set((state) => ({
      items: state.items.map((po) => (po.id === id ? { ...po, status } : po)),
    }));
  },

  async receiveItems(id, dto) {
    const res = await purchaseOrdersApi.receiveItems(id, dto);
    set((state) => ({
      items: state.items.map((po) => (po.id === id ? res.data : po)),
    }));
  },

  async remove(id) {
    await purchaseOrdersApi.delete(id);
    const remaining = get().items.filter((po) => po.id !== id).length;
    const targetPage =
      remaining === 0 && get().page > 1 ? get().page - 1 : get().page;
    await get().fetchAll(targetPage);
  },
}));

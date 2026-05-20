import { create } from "zustand";
import { paymentsApi } from "@/api/payments.api";
import type { PaymentDTO } from "@/api/payments.api";

interface PaymentState {
  items: PaymentDTO[];
  loading: boolean;
  page: number;
  size: number;
  totalCount: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
  statusFilter: string;
}

interface PaymentActions {
  fetchAll: (
    page?: number,
    size?: number,
    statusFilter?: string,
  ) => Promise<void>;
  goToPage: (page: number) => Promise<void>;
  changeSize: (size: number) => Promise<void>;
  setFilter: (status: string) => Promise<void>;
  updateStatus: (id: number, paymentStatus: string) => Promise<void>;
  remove: (id: number) => Promise<void>;
}

type PaymentStore = PaymentState & PaymentActions;

const initialState: PaymentState = {
  items: [],
  loading: false,
  page: 1,
  size: 10,
  totalCount: 0,
  totalPages: 0,
  hasNext: false,
  hasPrev: false,
  statusFilter: "",
};

export const usePaymentStore = create<PaymentStore>((set, get) => ({
  ...initialState,

  async fetchAll(
    page = get().page,
    size = get().size,
    statusFilter = get().statusFilter,
  ) {
    set({ loading: true, page, size });
    try {
      const res = await paymentsApi.getAll(page, size, statusFilter);
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

  setFilter(status) {
    set({ statusFilter: status });
    return get().fetchAll(1, get().size, status);
  },

  async updateStatus(id, paymentStatus) {
    const res = await paymentsApi.updateStatus(id, paymentStatus);
    set((state) => ({
      items: state.items.map((item) =>
        item.id === id
          ? { ...item, status: res.data.status, paidAt: res.data.paidAt }
          : item,
      ),
    }));
  },

  async remove(id) {
    await paymentsApi.delete(id);
    const remaining = get().items.filter((p) => p.id !== id).length;
    const targetPage =
      remaining === 0 && get().page > 1 ? get().page - 1 : get().page;
    await get().fetchAll(targetPage);
  },
}));

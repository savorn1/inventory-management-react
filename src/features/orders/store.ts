import { create } from "zustand";
import { ordersApi } from "@/api/orders.api";
import type { OrderDTO, CreateOrderDTO } from "@/api/orders.api";

interface OrderState {
  items: OrderDTO[];
  loading: boolean;
  page: number;
  size: number;
  totalCount: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
  search: string;
  statusFilter: string;
  paymentStatusFilter: string;
}

interface OrderActions {
  fetchAll: (
    page?: number,
    size?: number,
    search?: string,
    statusFilter?: string,
    paymentStatusFilter?: string,
  ) => Promise<void>;
  goToPage: (page: number) => Promise<void>;
  changeSize: (size: number) => Promise<void>;
  searchOrders: (query: string) => Promise<void>;
  setStatusFilter: (status: string) => Promise<void>;
  setPaymentFilter: (paymentStatus: string) => Promise<void>;
  add: (payload: CreateOrderDTO) => Promise<void>;
  updateStatus: (id: number, status: string) => Promise<void>;
  updatePaymentStatus: (id: number, paymentStatus: string) => Promise<void>;
  remove: (id: number) => Promise<void>;
}

type OrderStore = OrderState & OrderActions;

const initialState: OrderState = {
  items: [],
  loading: false,
  page: 1,
  size: 10,
  totalCount: 0,
  totalPages: 0,
  hasNext: false,
  hasPrev: false,
  search: "",
  statusFilter: "",
  paymentStatusFilter: "",
};

export const useOrderStore = create<OrderStore>((set, get) => ({
  ...initialState,

  async fetchAll(
    page = get().page,
    size = get().size,
    search = get().search,
    statusFilter = get().statusFilter,
    paymentStatusFilter = get().paymentStatusFilter,
  ) {
    set({ loading: true, page, size });
    try {
      const res = await ordersApi.getAll(
        page,
        size,
        search,
        statusFilter,
        paymentStatusFilter,
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

  searchOrders(query) {
    set({ search: query });
    return get().fetchAll(1, get().size, query);
  },

  setStatusFilter(status) {
    set({ statusFilter: status });
    return get().fetchAll(
      1,
      get().size,
      get().search,
      status,
      get().paymentStatusFilter,
    );
  },

  setPaymentFilter(paymentStatus) {
    set({ paymentStatusFilter: paymentStatus });
    return get().fetchAll(
      1,
      get().size,
      get().search,
      get().statusFilter,
      paymentStatus,
    );
  },

  async add(payload) {
    await ordersApi.create(payload);
    await get().fetchAll(1, get().size);
  },

  async updateStatus(id, status) {
    await ordersApi.updateStatus(id, status);
    set((state) => ({
      items: state.items.map((order) =>
        order.id === id ? { ...order, status } : order,
      ),
    }));
  },

  async updatePaymentStatus(id, paymentStatus) {
    await ordersApi.updatePaymentStatus(id, paymentStatus);
    set((state) => ({
      items: state.items.map((order) =>
        order.id === id ? { ...order, paymentStatus } : order,
      ),
    }));
  },

  async remove(id) {
    await ordersApi.delete(id);
    const remaining = get().items.filter((order) => order.id !== id).length;
    const targetPage =
      remaining === 0 && get().page > 1 ? get().page - 1 : get().page;
    await get().fetchAll(targetPage);
  },
}));

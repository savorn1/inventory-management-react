import { create } from "zustand";
import { openItemsApi } from "@/api/open-items.api";
import type { OpenItemDTO, CreateOpenItemDTO, OpenItemStatus } from "@/api/open-items.api";

interface OpenItemState {
  items: OpenItemDTO[];
  loading: boolean;
  page: number;
  size: number;
  totalCount: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
  search: string;
  statusFilter: OpenItemStatus[];
}

interface OpenItemActions {
  fetchAll: (
    page?: number,
    size?: number,
    search?: string,
    statusFilter?: OpenItemStatus[],
  ) => Promise<void>;
  goToPage: (page: number) => Promise<void>;
  changeSize: (size: number) => Promise<void>;
  searchItems: (query: string) => void;
  setStatusFilter: (status: OpenItemStatus[]) => void;
  add: (payload: CreateOpenItemDTO) => Promise<void>;
  confirm: (id: number) => Promise<void>;
  cancel: (id: number) => Promise<void>;
  remove: (id: number) => Promise<void>;
}

type OpenItemStore = OpenItemState & OpenItemActions;

const initialState: OpenItemState = {
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

export const useOpenItemStore = create<OpenItemStore>((set, get) => ({
  ...initialState,

  async fetchAll(
    page = get().page,
    size = get().size,
    search = get().search,
    statusFilter = get().statusFilter,
  ) {
    set({ loading: true, page, size });
    try {
      const res = await openItemsApi.getAll(page, size, search, statusFilter);
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

  searchItems(query) {
    set({ search: query });
    get().fetchAll(1, get().size, query, get().statusFilter);
  },

  setStatusFilter(statusFilter) {
    set({ statusFilter });
    get().fetchAll(1, get().size, get().search, statusFilter);
  },

  async add(payload) {
    await openItemsApi.create(payload);
    await get().fetchAll(1, get().size);
  },

  async confirm(id) {
    const res = await openItemsApi.confirm(id);
    set((state) => ({
      items: state.items.map((item) => (item.id === id ? res.data : item)),
    }));
  },

  async cancel(id) {
    const res = await openItemsApi.cancel(id);
    set((state) => ({
      items: state.items.map((item) => (item.id === id ? res.data : item)),
    }));
  },

  async remove(id) {
    await openItemsApi.delete(id);
    const remaining = get().items.filter((item) => item.id !== id).length;
    const targetPage =
      remaining === 0 && get().page > 1 ? get().page - 1 : get().page;
    await get().fetchAll(targetPage);
  },
}));

import { create } from "zustand";
import { usersApi } from "@/api/users.api";
import type { SysUserDTO, CreateSysUserDTO } from "@/api/users.api";
import type { ApiResponse } from "@/api/types";

interface UserStore {
  items: SysUserDTO[];
  loading: boolean;
  page: number;
  size: number;
  totalCount: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
  search: string;
  statusFilter: string;
  fetchAll: (
    p?: number,
    s?: number,
    name?: string,
    status?: string,
  ) => Promise<void>;
  goToPage: (p: number) => Promise<void>;
  changeSize: (s: number) => Promise<void>;
  searchByName: (q: string) => Promise<void>;
  filterByStatus: (status: string) => Promise<void>;
  getById: (id: number) => Promise<ApiResponse<SysUserDTO>>;
  add: (payload: CreateSysUserDTO) => Promise<SysUserDTO>;
  update: (
    id: number,
    payload: Omit<CreateSysUserDTO, "password"> & {
      password?: string;
      roleIds?: number[];
    },
  ) => Promise<void>;
  remove: (id: number) => Promise<void>;
}

export const useUserStore = create<UserStore>((set, get) => ({
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

  async fetchAll(
    p = get().page,
    s = get().size,
    name = get().search,
    status = get().statusFilter,
  ) {
    set({ loading: true, page: p, size: s });
    try {
      const res = await usersApi.getAll(p, s, name, status);
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
    return get().fetchAll(1, get().size, q, get().statusFilter);
  },
  filterByStatus(status) {
    set({ statusFilter: status });
    return get().fetchAll(1, get().size, get().search, status);
  },

  getById: (id) => usersApi.getById(id),

  async add(payload) {
    const res = await usersApi.create(payload);
    await get().fetchAll(1, get().size);
    return res.data;
  },

  async update(id, payload) {
    await usersApi.update(id, payload);
    await get().fetchAll(get().page, get().size);
  },

  async remove(id) {
    await usersApi.delete(id);
    const remaining = get().items.filter((i) => i.id !== id).length;
    const targetPage =
      remaining === 0 && get().page > 1 ? get().page - 1 : get().page;
    await get().fetchAll(targetPage);
  },
}));

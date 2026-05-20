import { http } from "./http";
import type { ApiResponse, PageResponse } from "./types";

export interface SupplierDTO {
  id: number;
  name: string;
  phone: string;
  email: string;
  address: string;
}

export type SupplierPayload = Omit<SupplierDTO, "id">;

export const suppliersApi = {
  getAll: (page = 1, size = 10, name = "") => {
    const params = new URLSearchParams({
      page: String(page),
      size: String(size),
    });
    if (name) params.set("name", name);
    return http.get<PageResponse<SupplierDTO>>(`api/supplier?${params}`);
  },

  getById: (id: number) =>
    http.get<ApiResponse<SupplierDTO>>(`api/supplier/${id}`),

  create: (dto: SupplierPayload) =>
    http.post<ApiResponse<SupplierDTO>>("api/supplier", dto),

  update: (id: number, dto: SupplierPayload) =>
    http.put<ApiResponse<SupplierDTO>>(`api/supplier/${id}`, dto),

  delete: (id: number) =>
    http.delete<ApiResponse<string>>(`api/supplier/${id}`),
};

import { http } from "./http";
import type { ApiResponse, PageResponse } from "./types";

export type OpenItemStatus = "DRAFT" | "CONFIRMED" | "CANCELLED";

export interface OpenItemDetailDTO {
  id: number;
  openItemId: number;
  productId: number;
  productName: string;
  qty: number;
  remark: string | null;
}

export interface OpenItemDTO {
  id: number;
  openItemNo: string;
  itemDate: string;
  status: OpenItemStatus;
  remark: string | null;
  createdAt: string;
  updatedAt: string;
  details: OpenItemDetailDTO[];
}

export interface CreateOpenItemDetailDTO {
  productId: number;
  qty: number;
  remark?: string;
}

export interface CreateOpenItemDTO {
  itemDate: string;
  remark?: string;
  details: CreateOpenItemDetailDTO[];
}

export const openItemsApi = {
  getAll: (page = 1, size = 10, q = "", status: OpenItemStatus[] = []) => {
    const params = new URLSearchParams({
      page: String(page),
      size: String(size),
    });
    if (q) params.set("q", q);
    status.forEach((s) => params.append("status", s));
    return http.get<PageResponse<OpenItemDTO>>(`api/open-item?${params}`);
  },

  getById: (id: number) =>
    http.get<ApiResponse<OpenItemDTO>>(`api/open-item/${id}`),

  create: (dto: CreateOpenItemDTO) =>
    http.post<ApiResponse<OpenItemDTO>>("api/open-item", dto),

  confirm: (id: number) =>
    http.post<ApiResponse<OpenItemDTO>>(`api/open-item/${id}/confirm`, {}),

  cancel: (id: number) =>
    http.post<ApiResponse<OpenItemDTO>>(`api/open-item/${id}/cancel`, {}),

  delete: (id: number) =>
    http.delete<ApiResponse<string>>(`api/open-item/${id}`),
};

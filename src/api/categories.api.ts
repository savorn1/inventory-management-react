import { http } from "./http";
import type { ApiResponse, PageResponse } from "./types";

export interface CategoryDTO {
  id: number;
  name: string;
  description: string;
}

export type CategoryPayload = Omit<CategoryDTO, "id">;

export const categoriesApi = {
  getAll: (page = 1, size = 10, name = "") => {
    const params = new URLSearchParams({
      page: String(page),
      size: String(size),
    });
    if (name) params.set("name", name);
    return http.get<PageResponse<CategoryDTO>>(`api/category?${params}`);
  },

  getById: (id: number) =>
    http.get<ApiResponse<CategoryDTO>>(`api/category/${id}`),

  create: (dto: CategoryPayload) =>
    http.post<ApiResponse<CategoryDTO>>("api/category", dto),

  delete: (id: number) =>
    http.delete<ApiResponse<string>>(`api/category/${id}`),
};

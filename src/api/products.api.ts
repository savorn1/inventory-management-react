import { http } from "./http";
import type { ApiResponse, PageResponse } from "./types";

export interface ProductDTO {
  id: number;
  name: string;
  description: string;
  price: number;
  brandId: number;
  brandName: string;
  categoryId: number;
  categoryName: string;
  imageUrl?: string;
  imageUrls?: string[];
  stock?: number; // optional — shown as badge when backend provides it
}

export interface CreateProductDTO {
  name: string;
  description: string;
  price: number;
  brandId: number | null;
  categoryId: number | null;
  imageUrl?: string | null;
  imageUrls?: string[];
}

export const productsApi = {
  getAll: (page = 1, size = 10, name = "") => {
    const params = new URLSearchParams({
      page: String(page),
      size: String(size),
    });
    if (name) params.set("name", name);
    return http.get<PageResponse<ProductDTO>>(`api/product?${params}`);
  },

  getById: (id: number) =>
    http.get<ApiResponse<ProductDTO>>(`api/product/${id}`),

  create: (dto: CreateProductDTO) =>
    http.post<ApiResponse<ProductDTO>>("api/product", dto),

  update: (id: number, dto: CreateProductDTO) =>
    http.put<ApiResponse<string>>(`api/product/${id}`, dto),

  delete: (id: number) => http.delete<ApiResponse<string>>(`api/product/${id}`),

};

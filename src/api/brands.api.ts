import { http } from './http'
import type { ApiResponse, PageResponse } from './types'

export interface BrandDTO {
  id: number
  name: string
}

export type BrandPayload = Omit<BrandDTO, 'id'>

export const brandsApi = {
  getAll: (page = 1, size = 10, name = '') => {
    const params = new URLSearchParams({ page: String(page), size: String(size) })
    if (name) params.set('name', name)
    return http.get<PageResponse<BrandDTO>>(`api/brand?${params}`)
  },

  getById: (id: number) =>
    http.get<ApiResponse<BrandDTO>>(`api/brand/${id}`),

  create: (dto: BrandPayload) =>
    http.post<ApiResponse<BrandDTO>>('api/brand', dto),

  delete: (id: number) =>
    http.delete<ApiResponse<string>>(`api/brand/${id}`),
}

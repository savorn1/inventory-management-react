import { http } from './http'
import type { ApiResponse, PageResponse } from './types'

export interface ClientDTO {
  id: number
  name: string
  email: string
  phone: string
  gender: string
  address: string
}

export type ClientPayload = Omit<ClientDTO, 'id'>

export const clientsApi = {
  getAll: (page = 1, size = 10, name = '') => {
    const params = new URLSearchParams({ page: String(page), size: String(size) })
    if (name) params.set('name', name)
    return http.get<PageResponse<ClientDTO>>(`api/client?${params}`)
  },

  getById: (id: number) =>
    http.get<ApiResponse<ClientDTO>>(`api/client/${id}`),

  create: (dto: ClientPayload) =>
    http.post<ApiResponse<ClientDTO>>('api/client', dto),

  update: (id: number, dto: ClientPayload) =>
    http.put<ApiResponse<ClientDTO>>(`api/client/${id}`, dto),

  delete: (id: number) =>
    http.delete<ApiResponse<string>>(`api/client/${id}`),
}

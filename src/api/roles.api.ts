import { http } from './http'
import type { ApiResponse, PageResponse } from './types'

export interface PermissionDTO {
  id: number
  name: string
  action: string
  description: string
  module: string
}

export interface RoleDTO {
  id: number
  name: string
  code: string
  isDefault: boolean
  description: string
  permissions: PermissionDTO[]
}

export interface CreateRoleDTO {
  name: string
  code: string
  isDefault: boolean
  description: string
  permissionIds: number[]
}

export const rolesApi = {
  getAll: (page = 1, size = 10, name = '') => {
    const params = new URLSearchParams({ page: String(page), size: String(size) })
    if (name) params.set('name', name)
    return http.get<PageResponse<RoleDTO>>(`api/roles?${params}`)
  },

  getById: (id: number) =>
    http.get<ApiResponse<RoleDTO>>(`api/roles/${id}`),

  create: (dto: CreateRoleDTO) =>
    http.post<ApiResponse<RoleDTO>>('api/roles', dto),

  update: (id: number, dto: CreateRoleDTO) =>
    http.put<ApiResponse<RoleDTO>>(`api/roles/${id}`, dto),

  delete: (id: number) =>
    http.delete<ApiResponse<string>>(`api/roles/${id}`),
}

export const permissionsApi = {
  getAll: (page = 1, size = 200) =>
    http.get<PageResponse<PermissionDTO>>(`api/permissions?page=${page}&size=${size}`),
}

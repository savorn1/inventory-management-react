import { http } from './http'
import type { ApiResponse, PageResponse } from './types'

export interface SysUserDTO {
  id: number
  name: string
  password?: string
  status: string
  roleIds?: number[]
}

export interface CreateSysUserDTO {
  name: string
  password: string
  status: string
}

export type UpdateSysUserDTO = Omit<CreateSysUserDTO, 'password'> & { password?: string; roleIds?: number[] }

export const usersApi = {
  getAll: (page = 1, size = 10, name = '', status = '') => {
    const params = new URLSearchParams({ page: String(page), size: String(size) })
    if (name) params.set('name', name)
    if (status) params.set('status', status)
    return http.get<PageResponse<SysUserDTO>>(`api/sys-user?${params}`)
  },

  getById: (id: number) =>
    http.get<ApiResponse<SysUserDTO>>(`api/sys-user/${id}`),

  create: (dto: CreateSysUserDTO) =>
    http.post<ApiResponse<SysUserDTO>>('api/sys-user', dto),

  update: (id: number, dto: UpdateSysUserDTO) =>
    http.put<ApiResponse<SysUserDTO>>(`api/sys-user/${id}`, dto),

  delete: (id: number) =>
    http.delete<ApiResponse<string>>(`api/sys-user/${id}`),
}

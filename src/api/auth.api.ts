import { http } from './http'
import type { ApiResponse } from './types'

export interface LoginRequest {
  name: string
  password: string
}

export interface LoginResponse {
  accessToken: string
}

export interface UserProfile {
  id: number
  username: string
  uuid: string
  permissions: string[]
}

export const authApi = {
  login: (body: LoginRequest) =>
    http.post<ApiResponse<LoginResponse>>('api/auth/login', body),

  profile: () =>
    http.get<ApiResponse<UserProfile>>('api/auth/profile'),

  logout: () =>
    http.post<ApiResponse<null>>('api/auth/logout', {}),
}

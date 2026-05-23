import { http } from "./http";
import type { ApiResponse } from "./types";

export interface LoginRequest {
  name: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken?: string;
}

export interface RefreshResponse {
  accessToken: string;
  refreshToken?: string;
}

export interface UserProfile {
  id: number;
  username: string;
  uuid: string;
  permissions: string[];
}

export const authApi = {
  login: (body: LoginRequest) =>
    http.post<ApiResponse<LoginResponse>>("api/auth/login", body),

  refresh: (refreshToken: string) =>
    fetch("/api/auth/refresh", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
    }).then((r) => r.json() as Promise<ApiResponse<RefreshResponse>>),

  profile: () => http.get<ApiResponse<UserProfile>>("api/auth/profile"),

  logout: () => http.post<ApiResponse<null>>("api/auth/logout", {}),
};

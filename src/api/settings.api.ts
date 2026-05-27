import { http } from "./http";
import type { ApiResponse } from "./types";

export interface SystemSettingDTO {
  allowOverselling: boolean;
}

export const settingsApi = {
  get: () => http.get<ApiResponse<SystemSettingDTO>>("api/settings"),
  update: (dto: SystemSettingDTO) =>
    http.put<ApiResponse<SystemSettingDTO>>("api/settings", dto),
};

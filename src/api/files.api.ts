import { http } from "./http";
import type { ApiResponse } from "./types";

export const filesApi = {
  upload: (file: File) => {
    const fd = new FormData();
    fd.append("file", file);
    return http.postFile<ApiResponse<string>>("api/files/upload", fd);
  },

  uploadMultiple: (files: File[]) => {
    const fd = new FormData();
    files.forEach((f) => fd.append("files", f));
    return http.postFile<ApiResponse<string[]>>("api/files/upload/multiple", fd);
  },
};

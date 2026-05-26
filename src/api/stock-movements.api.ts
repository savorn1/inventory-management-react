import { http } from "./http";
import type { PageResponse } from "./types";

export interface StockMovementDTO {
  id: number;
  productId: number;
  productName: string;
  type: "IN" | "OUT";
  qty: number;
  referenceType: string;  // e.g. "PURCHASE_ORDER", "SALE_ORDER", "ADJUSTMENT"
  referenceId: number | null;
  referenceNo: string | null;
  remark: string | null;
  createdAt: string;
  createdBy: string | null;
}

export const stockMovementsApi = {
  getAll: (
    page = 1,
    size = 10,
    q = "",
    type: "IN" | "OUT" | "" = "",
  ) => {
    const params = new URLSearchParams({
      page: String(page),
      size: String(size),
    });
    if (q) params.set("q", q);
    if (type) params.set("type", type);
    return http.get<PageResponse<StockMovementDTO>>(
      `api/stock-movement?${params}`,
    );
  },
};

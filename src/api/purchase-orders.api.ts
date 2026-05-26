import { http } from "./http";
import type { ApiResponse, PageResponse } from "./types";

export interface PurchaseOrderDetailDTO {
  id: number;
  purchaseOrderId: number;
  productId: number;
  productName: string;
  qty: number;
  price: number;
  discount: number;
  total: number;
  receivedQty: number;
}

export interface PurchaseOrderDTO {
  id: number;
  poNo: string;
  supplierId: number;
  supplierName: string;
  orderDate: string;
  expectedDate: string;
  status: string;
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  remark: string;
  createdAt: string;
  updatedAt: string;
  details: PurchaseOrderDetailDTO[];
}

export interface CreatePurchaseOrderDetailDTO {
  productId: number;
  qty: number;
  price: number;
  discount: number;
}

export interface CreatePurchaseOrderDTO {
  supplierId: number;
  orderDate: string | null;
  expectedDate: string | null;
  status: string;
  discount: number;
  tax: number;
  remark: string;
  details: CreatePurchaseOrderDetailDTO[];
}

export interface ReceiveItemDTO {
  detailId: number;
  receivedQty: number;
}

export interface ReceivePurchaseOrderDTO {
  items: ReceiveItemDTO[];
}

export const purchaseOrdersApi = {
  getAll: (page = 1, size = 10, q = "", status: string[] = []) => {
    const params = new URLSearchParams({
      page: String(page),
      size: String(size),
    });
    if (q) params.set("q", q);
    status.forEach((s) => params.append("status", s));
    return http.get<PageResponse<PurchaseOrderDTO>>(
      `api/purchase-order?${params}`,
    );
  },

  getById: (id: number) =>
    http.get<ApiResponse<PurchaseOrderDTO>>(`api/purchase-order/${id}`),

  create: (dto: CreatePurchaseOrderDTO) =>
    http.post<ApiResponse<PurchaseOrderDTO>>("api/purchase-order", dto),

  updateStatus: (id: number, status: string) =>
    http.patch<ApiResponse<PurchaseOrderDTO>>(
      `api/purchase-order/${id}/status`,
      { status },
    ),

  receiveItems: (id: number, dto: ReceivePurchaseOrderDTO) =>
    http.patch<ApiResponse<PurchaseOrderDTO>>(
      `api/purchase-order/${id}/receive`,
      dto,
    ),

  delete: (id: number) =>
    http.delete<ApiResponse<string>>(`api/purchase-order/${id}`),
};

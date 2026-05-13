import { http } from './http'
import type { ApiResponse, PageResponse } from './types'

export interface OrderDetailDTO {
  id: number
  orderId: number
  productId: number
  productName: string
  qty: number
  price: number
  discount: number
  total: number
}

export interface OrderDTO {
  id: number
  orderNo: string
  clientId: number
  clientName: string
  orderDate: string
  status: string
  subtotal: number
  discount: number
  tax: number
  total: number
  paymentStatus: string
  remark: string
  details: OrderDetailDTO[]
}

export interface CreateOrderDetailDTO {
  productId: number
  qty: number
  price: number
  discount: number
  total: number
}

export interface CreateOrderDTO {
  clientId: number
  orderDate: string | null
  status: string
  discount: number
  tax: number
  remark: string
  details: CreateOrderDetailDTO[]
}

export const ordersApi = {
  getAll: (page = 1, size = 10, q = '') => {
    const params = new URLSearchParams({ page: String(page), size: String(size) })
    if (q) params.set('q', q)
    return http.get<PageResponse<OrderDTO>>(`api/order?${params}`)
  },

  getById: (id: number) =>
    http.get<ApiResponse<OrderDTO>>(`api/order/${id}`),

  create: (dto: CreateOrderDTO) =>
    http.post<ApiResponse<OrderDTO>>('api/order', dto),

  delete: (id: number) =>
    http.delete<ApiResponse<string>>(`api/order/${id}`),
}

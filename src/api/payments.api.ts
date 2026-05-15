import { http } from './http'
import type { ApiResponse, PageResponse } from './types'

export interface PaymentDTO {
  id: number
  paymentNo: string
  orderId: number
  orderNo: string
  amount: number
  paymentMethod: string
  status: string
  paidAt: string | null
  remark: string | null
  createdAt: string
  updatedAt: string
}

export interface CreatePaymentDTO {
  orderId: number
  amount: number
  paymentMethod: string
  status: string
  paidAt: string | null
  remark: string | null
}

export const paymentsApi = {
  getAll: (page = 1, size = 10, status = '') => {
    const params = new URLSearchParams({ page: String(page), size: String(size) })
    if (status) params.set('status', status)
    return http.get<PageResponse<PaymentDTO>>(`api/payment?${params}`)
  },

  getById: (id: number) =>
    http.get<ApiResponse<PaymentDTO>>(`api/payment/${id}`),

  create: (dto: CreatePaymentDTO) =>
    http.post<ApiResponse<PaymentDTO>>('api/payment', dto),

  updateStatus: (id: number, paymentStatus: string) =>
    http.patch<ApiResponse<PaymentDTO>>(`api/payment/${id}/status`, { paymentStatus }),

  delete: (id: number) =>
    http.delete<ApiResponse<string>>(`api/payment/${id}`),
}

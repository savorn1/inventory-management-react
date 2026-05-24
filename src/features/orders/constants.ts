import type { BadgeVariant } from "@/components/ui";

export const ORDER_STATUSES = [
  "PENDING",
  "PROCESSING",
  "CONFIRMED",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
  "COMPLETED",
] as const;

export const PAYMENT_STATUSES = ["PAID", "PARTIAL", "UNPAID"] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

export const STATUS_VARIANT: Record<OrderStatus, BadgeVariant> = {
  PENDING: "warning",
  PROCESSING: "warning",
  CONFIRMED: "warning",
  SHIPPED: "success",
  DELIVERED: "success",
  CANCELLED: "danger",
  COMPLETED: "success",
};

export const PAYMENT_VARIANT: Record<PaymentStatus, BadgeVariant> = {
  PAID: "success",
  PARTIAL: "warning",
  UNPAID: "danger",
};

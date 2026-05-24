import type { BadgeVariant } from "@/components/ui";

export const PAYMENT_STATUSES = [
  "UNPAID",
  "PAID",
  "PARTIAL",
  "REFUNDED",
] as const;

export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

export const PAYMENT_VARIANT: Record<PaymentStatus, BadgeVariant> = {
  PAID: "success",
  PARTIAL: "warning",
  UNPAID: "danger",
  REFUNDED: "warning",
};

import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { usePaymentStore } from "./store";
import { useAuthStore } from "@/stores/auth";
import { useToast } from "@/hooks/useToast";
import { usePaymentSocket } from "@/hooks/usePaymentSocket";
import {
  AppTable,
  AppPagination,
  AppButton,
  AppBadge,
  AppModal,
} from "@/components/ui";
import type { BadgeVariant } from "@/components/ui";
import { formatDateTime } from "@/utils/format";

const PAYMENT_STATUSES = ["UNPAID", "PAID", "PARTIAL", "REFUNDED"] as const;
type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

const PAYMENT_VARIANT: Record<PaymentStatus, BadgeVariant> = {
  PAID: "success",
  PARTIAL: "warning",
  UNPAID: "danger",
  REFUNDED: "warning",
};

function fmt(n: number) {
  return n.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

interface StatusModal {
  paymentId: number;
  paymentNo: string;
  status: string;
}

export function PaymentView() {
  const { t } = useTranslation();
  const store = usePaymentStore();
  const auth = useAuthStore();
  const toast = useToast();

  const [statusModal, setStatusModal] = useState<StatusModal | null>(null);
  const [saving, setSaving] = useState(false);

  const { connected } = usePaymentSocket(() => store.fetchAll());

  useEffect(() => {
    store.fetchAll(1, 10);
  }, []);

  async function saveStatus() {
    if (!statusModal) return;
    setSaving(true);
    try {
      await store.updateStatus(statusModal.paymentId, statusModal.status);
      toast.add(t("payment.statusUpdated"));
      setStatusModal(null);
    } catch (err) {
      toast.add(
        err instanceof Error ? err.message : t("payment.statusUpdateFailed"),
        "error",
      );
    } finally {
      setSaving(false);
    }
  }

  const selectCls =
    "h-9 px-3 border border-slate-200 rounded-lg text-sm outline-none focus:border-indigo-500 bg-white cursor-pointer";

  return (
    <div className="p-4 md:p-7 flex flex-col gap-5">
      <div className="flex flex-wrap items-center gap-3">
        <span
          className={`flex items-center gap-1.5 text-xs font-medium ${connected ? "text-green-600" : "text-slate-400"}`}
        >
          <span
            className={`w-2 h-2 rounded-full ${connected ? "bg-green-500 animate-pulse" : "bg-slate-300"}`}
          />
          {connected
            ? t("payment.liveConnected")
            : t("payment.liveDisconnected")}
        </span>
        <select
          value={store.statusFilter}
          onChange={(e) => store.setFilter(e.target.value)}
          className={selectCls}
        >
          <option value="">{t("order.allPaymentStatus")}</option>
          {PAYMENT_STATUSES.map((s) => (
            <option key={s} value={s}>
              {t(`order.payment${s.charAt(0) + s.slice(1).toLowerCase()}`)}
            </option>
          ))}
        </select>
      </div>

      <AppTable
        head={
          <>
            <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wide w-10">
              #
            </th>
            <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wide">
              {t("payment.paymentNo")}
            </th>
            <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wide">
              {t("order.orderNo")}
            </th>
            <th className="px-4 py-3 text-right text-xs font-bold text-slate-500 uppercase tracking-wide">
              {t("payment.amount")}
            </th>
            <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wide">
              {t("payment.method")}
            </th>
            <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wide">
              {t("order.paymentStatus")}
            </th>
            <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wide">
              {t("payment.paidAt")}
            </th>
            {auth.can("ORDER_UPDATE") && (
              <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wide">
                {t("common.actions")}
              </th>
            )}
          </>
        }
        body={
          store.loading ? (
            <tr>
              <td colSpan={8} className="text-center text-slate-400 py-12">
                {t("common.loading")}
              </td>
            </tr>
          ) : store.items.length === 0 ? (
            <tr>
              <td colSpan={8} className="text-center text-slate-400 py-12">
                {t("payment.noData")}
              </td>
            </tr>
          ) : (
            store.items.map((item, idx) => (
              <tr
                key={item.id}
                className="border-b border-slate-50 hover:bg-slate-50 transition-colors"
              >
                <td className="px-4 py-3 text-slate-400">
                  {(store.page - 1) * store.size + idx + 1}
                </td>
                <td className="px-4 py-3 font-mono text-sm font-semibold text-indigo-700">
                  {item.paymentNo}
                </td>
                <td className="px-4 py-3 text-slate-600">{item.orderNo}</td>
                <td className="px-4 py-3 text-right font-semibold text-slate-800">
                  ${fmt(item.amount)}
                </td>
                <td className="px-4 py-3 text-slate-600">
                  {item.paymentMethod || "—"}
                </td>
                <td className="px-4 py-3">
                  <AppBadge
                    variant={
                      PAYMENT_VARIANT[item.status as PaymentStatus] ?? "danger"
                    }
                  >
                    {item.status}
                  </AppBadge>
                </td>
                <td className="px-4 py-3 text-slate-500 whitespace-nowrap">
                  {formatDateTime(item.paidAt)}
                </td>
                {auth.can("ORDER_UPDATE") && (
                  <td className="px-4 py-3">
                    <AppButton
                      variant="edit"
                      size="sm"
                      onClick={() =>
                        setStatusModal({
                          paymentId: item.id,
                          paymentNo: item.paymentNo,
                          status: item.status,
                        })
                      }
                    >
                      {t("payment.updatePayment")}
                    </AppButton>
                  </td>
                )}
              </tr>
            ))
          )
        }
      />

      <AppPagination
        page={store.page}
        totalPages={store.totalPages}
        totalCount={store.totalCount}
        size={store.size}
        loading={store.loading}
        onChange={store.goToPage}
        onSizeChange={store.changeSize}
      />

      <AppModal
        show={!!statusModal}
        title={`${t("payment.updatePayment")} — ${statusModal?.paymentNo ?? ""}`}
        onClose={() => setStatusModal(null)}
      >
        <div className="flex flex-col gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              {t("order.paymentStatus")}
            </label>
            <select
              value={statusModal?.status ?? ""}
              onChange={(e) =>
                setStatusModal((prev) =>
                  prev ? { ...prev, status: e.target.value } : prev,
                )
              }
              className="w-full h-9 px-3 border border-slate-200 rounded-lg text-sm outline-none focus:border-indigo-500 bg-white cursor-pointer"
            >
              {PAYMENT_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {t(`order.payment${s.charAt(0) + s.slice(1).toLowerCase()}`)}
                </option>
              ))}
            </select>
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <AppButton
              variant="cancel"
              onClick={() => setStatusModal(null)}
              disabled={saving}
            >
              {t("common.cancel")}
            </AppButton>
            <AppButton onClick={saveStatus} disabled={saving}>
              {saving ? t("common.saving") : t("common.save")}
            </AppButton>
          </div>
        </div>
      </AppModal>
    </div>
  );
}

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { usePurchaseOrderStore } from "./store";
import { useAuthStore } from "@/stores/auth";
import { useToast } from "@/hooks/useToast";
import {
  AppTable,
  AppPagination,
  AppButton,
  AppBadge,
  AppModal,
} from "@/components/ui";
import {
  PURCHASE_ORDER_STATUSES,
  PO_STATUS_VARIANT,
  type PurchaseOrderStatus,
} from "./constants";
import type { PurchaseOrderDetailDTO } from "@/api/purchase-orders.api";

function fmt(n: number) {
  return Number(n).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

interface StatusModal {
  poId: number;
  poNo: string;
  status: string;
}

interface ReceiveModal {
  poId: number;
  poNo: string;
  details: PurchaseOrderDetailDTO[];
  receivedQtys: Record<number, number>;
}

export function PurchaseOrderView() {
  const { t } = useTranslation();
  const store = usePurchaseOrderStore();
  const auth = useAuthStore();
  const navigate = useNavigate();
  const toast = useToast();

  const [statusModal, setStatusModal] = useState<StatusModal | null>(null);
  const [receiveModal, setReceiveModal] = useState<ReceiveModal | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    store.fetchAll(1, 10);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function removePO(id: number) {
    if (!confirm(t("common.deleteConfirm"))) return;
    try {
      await store.remove(id);
      toast.add(t("po.deleteSuccess"));
    } catch {
      toast.add(t("po.deleteFailed"), "error");
    }
  }

  async function saveStatus() {
    if (!statusModal) return;
    setSaving(true);
    try {
      await store.updateStatus(statusModal.poId, statusModal.status);
      toast.add(t("po.statusUpdated"));
      setStatusModal(null);
    } catch (err) {
      toast.add(
        err instanceof Error ? err.message : t("po.statusUpdateFailed"),
        "error",
      );
    } finally {
      setSaving(false);
    }
  }

  function openReceiveModal(poId: number, poNo: string, details: PurchaseOrderDetailDTO[]) {
    const receivedQtys: Record<number, number> = {};
    details.forEach((d) => {
      receivedQtys[d.id] = 0;
    });
    setReceiveModal({ poId, poNo, details, receivedQtys });
  }

  async function saveReceive() {
    if (!receiveModal) return;
    const items = Object.entries(receiveModal.receivedQtys)
      .filter(([, qty]) => qty > 0)
      .map(([detailId, receivedQty]) => ({
        detailId: Number(detailId),
        receivedQty,
      }));
    if (items.length === 0) {
      toast.add(t("po.receiveNoItems"), "error");
      return;
    }
    setSaving(true);
    try {
      await store.receiveItems(receiveModal.poId, { items });
      toast.add(t("po.receiveSuccess"));
      setReceiveModal(null);
    } catch (err) {
      toast.add(
        err instanceof Error ? err.message : t("po.receiveFailed"),
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
      {/* ── Toolbar ──────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-3">
        <input
          value={store.search}
          onChange={(e) => store.searchPOs(e.target.value)}
          className="h-9 px-3 border border-slate-200 rounded-lg text-sm outline-none focus:border-indigo-500 flex-1 min-w-0 max-w-xs placeholder:text-slate-400"
          placeholder={t("po.searchPlaceholder")}
        />

        <select
          value={store.statusFilter[0] ?? ""}
          onChange={(e) =>
            store.setStatusFilter(e.target.value ? [e.target.value] : [])
          }
          className={selectCls}
        >
          <option value="">{t("po.allStatus")}</option>
          {PURCHASE_ORDER_STATUSES.map((s) => (
            <option key={s} value={s}>
              {t(`po.status${s.charAt(0) + s.slice(1).toLowerCase().replace(/_([a-z])/g, (_, c: string) => c.toUpperCase())}`)}
            </option>
          ))}
        </select>

        {auth.can("PURCHASE_ORDER_CREATE") && (
          <AppButton
            onClick={() => navigate("/purchase-orders/create")}
            className="ml-auto"
          >
            + {t("po.addTitle")}
          </AppButton>
        )}
      </div>

      {/* ── Table ────────────────────────────────────────────────────── */}
      <AppTable
        head={
          <>
            <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wide w-10">
              #
            </th>
            <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wide">
              {t("po.poNo")}
            </th>
            <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wide">
              {t("po.supplier")}
            </th>
            <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wide">
              {t("po.orderDate")}
            </th>
            <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wide">
              {t("po.expectedDate")}
            </th>
            <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wide">
              {t("po.status")}
            </th>
            <th className="px-4 py-3 text-right text-xs font-bold text-slate-500 uppercase tracking-wide">
              {t("po.total")}
            </th>
            <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wide">
              {t("common.actions")}
            </th>
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
                {t("po.noData")}
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
                  {item.poNo}
                </td>
                <td className="px-4 py-3 text-slate-700 font-medium">
                  {item.supplierName}
                </td>
                <td className="px-4 py-3 text-slate-500 whitespace-nowrap">
                  {item.orderDate ? item.orderDate.slice(0, 10) : "—"}
                </td>
                <td className="px-4 py-3 text-slate-500 whitespace-nowrap">
                  {item.expectedDate ? item.expectedDate.slice(0, 10) : "—"}
                </td>
                <td className="px-4 py-3">
                  <AppBadge
                    variant={
                      PO_STATUS_VARIANT[item.status as PurchaseOrderStatus] ??
                      "warning"
                    }
                  >
                    {item.status.replace(/_/g, " ")}
                  </AppBadge>
                </td>
                <td className="px-4 py-3 text-right font-semibold text-slate-800">
                  ${fmt(item.total)}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    {auth.can("PURCHASE_ORDER_UPDATE") &&
                      item.status !== "RECEIVED" &&
                      item.status !== "CANCELLED" && (
                        <AppButton
                          variant="primary"
                          size="sm"
                          onClick={() =>
                            setStatusModal({
                              poId: item.id,
                              poNo: item.poNo,
                              status: item.status,
                            })
                          }
                        >
                          {t("po.updateStatus")}
                        </AppButton>
                      )}
                    {auth.can("PURCHASE_ORDER_UPDATE") &&
                      (item.status === "ORDERED" ||
                        item.status === "PARTIALLY_RECEIVED") && (
                        <AppButton
                          variant="edit"
                          size="sm"
                          onClick={() =>
                            openReceiveModal(item.id, item.poNo, item.details)
                          }
                        >
                          {t("po.receive")}
                        </AppButton>
                      )}
                    {auth.can("PURCHASE_ORDER_DELETE") &&
                      item.status === "DRAFT" && (
                        <AppButton
                          variant="delete"
                          size="sm"
                          onClick={() => removePO(item.id)}
                        >
                          {t("common.delete")}
                        </AppButton>
                      )}
                  </div>
                </td>
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

      {/* ── Status Update Modal ───────────────────────────────────────── */}
      <AppModal
        show={!!statusModal}
        title={`${t("po.updateStatus")} — ${statusModal?.poNo ?? ""}`}
        onClose={() => setStatusModal(null)}
      >
        <div className="flex flex-col gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              {t("po.status")}
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
              {PURCHASE_ORDER_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s.replace(/_/g, " ")}
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

      {/* ── Receive Items Modal ───────────────────────────────────────── */}
      <AppModal
        show={!!receiveModal}
        title={`${t("po.receiveTitle")} — ${receiveModal?.poNo ?? ""}`}
        onClose={() => setReceiveModal(null)}
      >
        {receiveModal && (
          <div className="flex flex-col gap-4">
            <p className="text-sm text-slate-500">{t("po.receiveHint")}</p>

            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="border-b border-slate-100">
                    <th className="py-2 pr-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wide">
                      {t("po.product")}
                    </th>
                    <th className="py-2 px-3 text-right text-xs font-bold text-slate-500 uppercase tracking-wide">
                      {t("po.ordered")}
                    </th>
                    <th className="py-2 px-3 text-right text-xs font-bold text-slate-500 uppercase tracking-wide">
                      {t("po.received")}
                    </th>
                    <th className="py-2 pl-3 text-right text-xs font-bold text-slate-500 uppercase tracking-wide">
                      {t("po.receiveNow")}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {receiveModal.details.map((d) => {
                    const remaining = d.qty - (d.receivedQty ?? 0);
                    return (
                      <tr
                        key={d.id}
                        className="border-b border-slate-50 hover:bg-slate-50"
                      >
                        <td className="py-2.5 pr-3 text-slate-700 font-medium">
                          {d.productName}
                        </td>
                        <td className="py-2.5 px-3 text-right text-slate-500">
                          {d.qty}
                        </td>
                        <td className="py-2.5 px-3 text-right text-slate-500">
                          {d.receivedQty ?? 0}
                        </td>
                        <td className="py-2.5 pl-3 text-right">
                          <input
                            type="number"
                            min="0"
                            max={remaining}
                            value={receiveModal.receivedQtys[d.id] ?? 0}
                            onChange={(e) =>
                              setReceiveModal((prev) =>
                                prev
                                  ? {
                                      ...prev,
                                      receivedQtys: {
                                        ...prev.receivedQtys,
                                        [d.id]: Math.min(
                                          Number(e.target.value),
                                          remaining,
                                        ),
                                      },
                                    }
                                  : prev,
                              )
                            }
                            disabled={remaining <= 0}
                            className="w-20 px-2 py-1 border border-slate-200 rounded-lg text-sm outline-none focus:border-indigo-500 text-right disabled:bg-slate-50 disabled:text-slate-400"
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end gap-2 pt-1">
              <AppButton
                variant="cancel"
                onClick={() => setReceiveModal(null)}
                disabled={saving}
              >
                {t("common.cancel")}
              </AppButton>
              <AppButton onClick={saveReceive} disabled={saving}>
                {saving ? t("common.saving") : t("po.confirmReceive")}
              </AppButton>
            </div>
          </div>
        )}
      </AppModal>
    </div>
  );
}

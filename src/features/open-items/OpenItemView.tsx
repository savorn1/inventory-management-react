import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useOpenItemStore } from "./store";
import { useAuthStore } from "@/stores/auth";
import { useToast } from "@/hooks/useToast";
import {
  AppTable,
  AppPagination,
  AppButton,
  AppBadge,
  AppModal,
} from "@/components/ui";
import type { OpenItemDTO, OpenItemStatus } from "@/api/open-items.api";

const OPEN_ITEM_STATUSES: OpenItemStatus[] = ["DRAFT", "CONFIRMED", "CANCELLED"];

const STATUS_VARIANT: Record<OpenItemStatus, "warning" | "success" | "danger"> = {
  DRAFT: "warning",
  CONFIRMED: "success",
  CANCELLED: "danger",
};

const TH =
  "px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wide";

export function OpenItemView() {
  const { t } = useTranslation();
  const store = useOpenItemStore();
  const auth = useAuthStore();
  const navigate = useNavigate();
  const toast = useToast();

  const [detailModal, setDetailModal] = useState<OpenItemDTO | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    store.fetchAll(1, 10);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleConfirm(id: number) {
    setSaving(true);
    try {
      await store.confirm(id);
      toast.add(t("openItem.confirmSuccess"));
    } catch (err) {
      toast.add(
        err instanceof Error ? err.message : t("openItem.confirmFailed"),
        "error",
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleCancel(id: number) {
    if (!confirm(t("openItem.cancelConfirm"))) return;
    setSaving(true);
    try {
      await store.cancel(id);
      toast.add(t("openItem.cancelSuccess"));
    } catch (err) {
      toast.add(
        err instanceof Error ? err.message : t("openItem.cancelFailed"),
        "error",
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: number) {
    if (!confirm(t("common.deleteConfirm"))) return;
    try {
      await store.remove(id);
      toast.add(t("openItem.deleteSuccess"));
    } catch (err) {
      toast.add(
        err instanceof Error ? err.message : t("openItem.deleteFailed"),
        "error",
      );
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
          onChange={(e) => store.searchItems(e.target.value)}
          className="h-9 px-3 border border-slate-200 rounded-lg text-sm outline-none focus:border-indigo-500 flex-1 min-w-0 max-w-xs placeholder:text-slate-400"
          placeholder={t("openItem.searchPlaceholder")}
        />

        <select
          value={store.statusFilter[0] ?? ""}
          onChange={(e) =>
            store.setStatusFilter(
              e.target.value ? [e.target.value as OpenItemStatus] : [],
            )
          }
          className={selectCls}
        >
          <option value="">{t("openItem.allStatus")}</option>
          {OPEN_ITEM_STATUSES.map((s) => (
            <option key={s} value={s}>
              {t(`openItem.status${s.charAt(0) + s.slice(1).toLowerCase()}`)}
            </option>
          ))}
        </select>

        {auth.can("OPEN_ITEM_CREATE") && (
          <AppButton
            onClick={() => navigate("/open-items/create")}
            className="ml-auto"
          >
            + {t("openItem.addTitle")}
          </AppButton>
        )}
      </div>

      {/* ── Table ────────────────────────────────────────────────────── */}
      <AppTable
        head={
          <>
            <th className={`${TH} text-left w-10`}>#</th>
            <th className={`${TH} text-left`}>{t("openItem.itemNo")}</th>
            <th className={`${TH} text-left`}>{t("openItem.itemDate")}</th>
            <th className={`${TH} text-left`}>{t("openItem.status")}</th>
            <th className={`${TH} text-right`}>{t("openItem.totalQty")}</th>
            <th className={`${TH} text-left`}>{t("openItem.remark")}</th>
            <th className={`${TH} text-left`}>{t("common.actions")}</th>
          </>
        }
        body={
          store.loading ? (
            <tr>
              <td colSpan={7} className="text-center text-slate-400 py-12">
                {t("common.loading")}
              </td>
            </tr>
          ) : store.items.length === 0 ? (
            <tr>
              <td colSpan={7} className="text-center text-slate-400 py-12">
                {t("openItem.noData")}
              </td>
            </tr>
          ) : (
            store.items.map((item, idx) => (
              <tr
                key={item.id}
                className="border-b border-slate-50 hover:bg-slate-50 transition-colors"
              >
                {/* # */}
                <td className="px-4 py-3 text-slate-400">
                  {(store.page - 1) * store.size + idx + 1}
                </td>

                {/* Item No */}
                <td className="px-4 py-3">
                  <button
                    className="font-mono text-sm font-semibold text-indigo-700 hover:underline bg-transparent border-0 p-0 cursor-pointer"
                    onClick={() => setDetailModal(item)}
                  >
                    {item.openItemNo}
                  </button>
                </td>

                {/* Date */}
                <td className="px-4 py-3 text-slate-500 whitespace-nowrap">
                  {item.itemDate ? item.itemDate.slice(0, 10) : "—"}
                </td>

                {/* Status */}
                <td className="px-4 py-3">
                  <AppBadge variant={STATUS_VARIANT[item.status]}>
                    {t(
                      `openItem.status${item.status.charAt(0) + item.status.slice(1).toLowerCase()}`,
                    )}
                  </AppBadge>
                </td>

                {/* Total qty */}
                <td className="px-4 py-3 text-right font-semibold text-slate-800">
                  {item.details.reduce((s, d) => s + d.qty, 0)}
                </td>

                {/* Remark */}
                <td className="px-4 py-3 text-slate-500 max-w-[160px] truncate">
                  {item.remark || "—"}
                </td>

                {/* Actions */}
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    {auth.can("OPEN_ITEM_UPDATE") && item.status === "DRAFT" && (
                      <AppButton
                        variant="primary"
                        size="sm"
                        disabled={saving}
                        onClick={() => handleConfirm(item.id)}
                      >
                        {t("openItem.confirm")}
                      </AppButton>
                    )}
                    {auth.can("OPEN_ITEM_UPDATE") && item.status === "DRAFT" && (
                      <AppButton
                        variant="edit"
                        size="sm"
                        disabled={saving}
                        onClick={() => handleCancel(item.id)}
                      >
                        {t("openItem.cancel")}
                      </AppButton>
                    )}
                    {auth.can("OPEN_ITEM_DELETE") && item.status === "DRAFT" && (
                      <AppButton
                        variant="delete"
                        size="sm"
                        onClick={() => handleDelete(item.id)}
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

      {/* ── Detail Modal ──────────────────────────────────────────────── */}
      <AppModal
        show={!!detailModal}
        title={`${t("openItem.detailTitle")} — ${detailModal?.openItemNo ?? ""}`}
        onClose={() => setDetailModal(null)}
      >
        {detailModal && (
          <div className="flex flex-col gap-4">
            {/* Meta */}
            <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
              <div>
                <span className="text-slate-500">{t("openItem.itemDate")}:</span>{" "}
                <span className="font-medium text-slate-700">
                  {detailModal.itemDate?.slice(0, 10) ?? "—"}
                </span>
              </div>
              <div>
                <span className="text-slate-500">{t("openItem.status")}:</span>{" "}
                <AppBadge variant={STATUS_VARIANT[detailModal.status]}>
                  {t(
                    `openItem.status${detailModal.status.charAt(0) + detailModal.status.slice(1).toLowerCase()}`,
                  )}
                </AppBadge>
              </div>
              {detailModal.remark && (
                <div className="col-span-2">
                  <span className="text-slate-500">{t("openItem.remark")}:</span>{" "}
                  <span className="text-slate-700">{detailModal.remark}</span>
                </div>
              )}
            </div>

            {/* Items table */}
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="border-b border-slate-100">
                    <th className="py-2 pr-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wide">
                      {t("openItem.product")}
                    </th>
                    <th className="py-2 px-3 text-right text-xs font-bold text-slate-500 uppercase tracking-wide">
                      {t("openItem.qty")}
                    </th>
                    <th className="py-2 pl-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wide">
                      {t("openItem.remark")}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {detailModal.details.map((d) => (
                    <tr
                      key={d.id}
                      className="border-b border-slate-50 hover:bg-slate-50"
                    >
                      <td className="py-2.5 pr-3 text-slate-700 font-medium">
                        {d.productName}
                      </td>
                      <td className="py-2.5 px-3 text-right text-slate-800 font-semibold">
                        {d.qty}
                      </td>
                      <td className="py-2.5 pl-3 text-slate-500">
                        {d.remark || "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t border-slate-200">
                    <td className="py-2 pr-3 text-xs font-bold text-slate-500 uppercase">
                      {t("openItem.total")}
                    </td>
                    <td className="py-2 px-3 text-right font-bold text-slate-800">
                      {detailModal.details.reduce((s, d) => s + d.qty, 0)}
                    </td>
                    <td />
                  </tr>
                </tfoot>
              </table>
            </div>

            <div className="flex justify-end">
              <AppButton variant="cancel" onClick={() => setDetailModal(null)}>
                {t("common.cancel")}
              </AppButton>
            </div>
          </div>
        )}
      </AppModal>
    </div>
  );
}

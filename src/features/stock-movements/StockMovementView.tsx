import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useStockMovementStore } from "./store";
import { AppTable, AppPagination, AppBadge } from "@/components/ui";
import { formatDateTime } from "@/utils/format";

const TH = "px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wide";

const REF_LABEL: Record<string, string> = {
  PURCHASE_ORDER: "PO",
  SALE_ORDER: "SO",
  ADJUSTMENT: "ADJ",
  RETURN: "RTN",
};

function refLabel(type: string) {
  return REF_LABEL[type] ?? type;
}

export function StockMovementView() {
  const { t } = useTranslation();
  const store = useStockMovementStore();

  useEffect(() => {
    store.fetchAll(1, 10);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="p-4 md:p-7 flex flex-col gap-5">

      {/* ── Toolbar ── */}
      <div className="flex flex-wrap items-center gap-3">
        <input
          value={store.search}
          onChange={(e) => store.searchByProduct(e.target.value)}
          className="h-9 px-3 border border-slate-200 rounded-lg text-sm outline-none focus:border-indigo-500 flex-1 min-w-0 max-w-xs placeholder:text-slate-400"
          placeholder={t("stockMovement.searchPlaceholder")}
        />

        <select
          value={store.typeFilter}
          onChange={(e) => store.setTypeFilter(e.target.value as "IN" | "OUT" | "")}
          className="h-9 px-3 border border-slate-200 rounded-lg text-sm outline-none focus:border-indigo-500 bg-white cursor-pointer"
        >
          <option value="">{t("stockMovement.allTypes")}</option>
          <option value="IN">{t("stockMovement.typeIn")}</option>
          <option value="OUT">{t("stockMovement.typeOut")}</option>
        </select>
      </div>

      {/* ── Table ── */}
      <AppTable
        head={
          <>
            <th className={`${TH} text-left w-10`}>#</th>
            <th className={`${TH} text-left`}>{t("stockMovement.product")}</th>
            <th className={`${TH} text-left`}>{t("stockMovement.type")}</th>
            <th className={`${TH} text-right`}>{t("stockMovement.qty")}</th>
            <th className={`${TH} text-left`}>{t("stockMovement.reference")}</th>
            <th className={`${TH} text-left`}>{t("stockMovement.remark")}</th>
            <th className={`${TH} text-left`}>{t("stockMovement.createdBy")}</th>
            <th className={`${TH} text-left`}>{t("stockMovement.date")}</th>
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
                {t("stockMovement.noData")}
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

                {/* Product */}
                <td className="px-4 py-3 font-medium text-slate-800 whitespace-nowrap">
                  {item.productName}
                </td>

                {/* Type badge */}
                <td className="px-4 py-3">
                  <AppBadge variant={item.type === "IN" ? "success" : "danger"}>
                    {item.type === "IN"
                      ? t("stockMovement.typeIn")
                      : t("stockMovement.typeOut")}
                  </AppBadge>
                </td>

                {/* Qty */}
                <td className="px-4 py-3 text-right font-semibold text-slate-800">
                  {item.type === "IN" ? "+" : "−"}{item.qty}
                </td>

                {/* Reference */}
                <td className="px-4 py-3">
                  {item.referenceNo ? (
                    <span className="flex items-center gap-1.5">
                      <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-500 uppercase tracking-wide">
                        {refLabel(item.referenceType)}
                      </span>
                      <span className="font-mono text-sm text-indigo-700">
                        {item.referenceNo}
                      </span>
                    </span>
                  ) : (
                    <span className="text-slate-400">—</span>
                  )}
                </td>

                {/* Remark */}
                <td className="px-4 py-3 text-slate-500 max-w-[180px] truncate">
                  {item.remark || "—"}
                </td>

                {/* Created by */}
                <td className="px-4 py-3 text-slate-500 whitespace-nowrap">
                  {item.createdBy || "—"}
                </td>

                {/* Date */}
                <td className="px-4 py-3 text-slate-500 whitespace-nowrap">
                  {formatDateTime(item.createdAt)}
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
    </div>
  );
}

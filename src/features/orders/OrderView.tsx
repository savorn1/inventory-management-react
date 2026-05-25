import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useOrderStore } from "./store";
import { useAuthStore } from "@/stores/auth";
import { useToast } from "@/hooks/useToast";
import { productsApi, type ProductDTO } from "@/api/products.api";
import {
  AppTable,
  AppPagination,
  AppButton,
  AppBadge,
  AppModal,
} from "@/components/ui";
import {
  ORDER_STATUSES,
  PAYMENT_STATUSES,
  STATUS_VARIANT,
  PAYMENT_VARIANT,
  type OrderStatus,
  type PaymentStatus,
} from "./constants";

function fmt(n: number) {
  return n.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

interface StatusModal {
  orderId: number;
  orderNo: string;
  status: string;
}

export function OrderView() {
  const { t } = useTranslation();
  const store = useOrderStore();
  const auth = useAuthStore();
  const navigate = useNavigate();
  const toast = useToast();

  const [statusModal, setStatusModal] = useState<StatusModal | null>(null);
  const [saving, setSaving] = useState(false);

  // product combobox
  const [productQuery, setProductQuery] = useState("");
  const [productOptions, setProductOptions] = useState<ProductDTO[]>([]);
  const [productDropOpen, setProductDropOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<ProductDTO | null>(null);
  const productRef = useRef<HTMLDivElement>(null);

  // close dropdown on outside click
  useEffect(() => {
    function handleOutside(e: MouseEvent) {
      if (productRef.current && !productRef.current.contains(e.target as Node)) {
        setProductDropOpen(false);
      }
    }
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, []);

  // debounced product fetch — all setState inside the async callback to satisfy React Compiler
  useEffect(() => {
    const query = productQuery.trim();
    const timer = setTimeout(async () => {
      if (!query) {
        setProductOptions([]);
        setProductDropOpen(false);
        return;
      }
      try {
        const res = await productsApi.getAll(1, 20, query);
        setProductOptions(res.data);
        setProductDropOpen(true);
      } catch {
        setProductOptions([]);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [productQuery]);

  function selectProduct(product: ProductDTO) {
    setSelectedProduct(product);
    setProductQuery(product.name);
    setProductDropOpen(false);
    store.setProductFilter(product.id);
  }

  function clearProduct() {
    setSelectedProduct(null);
    setProductQuery("");
    setProductOptions([]);
    setProductDropOpen(false);
    store.setProductFilter(null);
  }

  useEffect(() => {
    store.fetchAll(1, 10);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function removeOrder(id: number) {
    if (!confirm("Delete this order?")) return;
    try {
      await store.remove(id);
      toast.add("Order deleted successfully.");
    } catch {
      toast.add("Failed to delete order. Please try again.", "error");
    }
  }

  async function saveStatus() {
    if (!statusModal) return;
    setSaving(true);
    try {
      await store.updateStatus(statusModal.orderId, statusModal.status);
      toast.add(t("order.statusUpdated"));
      setStatusModal(null);
    } catch (err) {
      toast.add(
        err instanceof Error ? err.message : t("order.statusUpdateFailed"),
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
        <input
          value={store.search}
          onChange={(e) => store.searchOrders(e.target.value)}
          className="h-9 px-3 border border-slate-200 rounded-lg text-sm outline-none focus:border-indigo-500 flex-1 min-w-0 max-w-xs placeholder:text-slate-400"
          placeholder={t("order.searchPlaceholder")}
        />

        {/* Product search combobox */}
        <div className="relative" ref={productRef}>
          <div
            className={`flex items-center h-9 border rounded-lg bg-white overflow-hidden min-w-[200px] ${
              productDropOpen ? "border-indigo-500" : "border-slate-200"
            }`}
          >
            <input
              value={productQuery}
              onChange={(e) => {
                setProductQuery(e.target.value);
                if (selectedProduct) {
                  setSelectedProduct(null);
                  store.setProductFilter(null);
                }
              }}
              onFocus={() => {
                if (productOptions.length > 0) setProductDropOpen(true);
              }}
              className="flex-1 h-full px-3 text-sm outline-none bg-transparent placeholder:text-slate-400"
              placeholder={t("order.searchByProduct")}
            />
            {selectedProduct && (
              <button
                type="button"
                onClick={clearProduct}
                className="pr-2 text-slate-400 hover:text-slate-600 text-xl leading-none"
                aria-label="Clear product filter"
              >
                ×
              </button>
            )}
          </div>

          {productDropOpen && productOptions.length > 0 && (
            <ul className="absolute z-50 top-full mt-1 left-0 right-0 bg-white border border-slate-200 rounded-lg shadow-lg max-h-56 overflow-y-auto">
              {productOptions.map((p) => (
                <li
                  key={p.id}
                  onMouseDown={() => selectProduct(p)}
                  className="px-3 py-2 text-sm text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 cursor-pointer flex items-center gap-2"
                >
                  {p.imageUrl && (
                    <img
                      src={p.imageUrl}
                      alt={p.name}
                      className="w-6 h-6 rounded object-cover shrink-0"
                    />
                  )}
                  <span className="font-medium truncate">{p.name}</span>
                  {p.brandName && (
                    <span className="text-slate-400 text-xs ml-auto shrink-0">
                      {p.brandName}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>

        <select
          value={store.statusFilter}
          onChange={(e) => store.setStatusFilter(e.target.value)}
          className={selectCls}
        >
          <option value="">{t("order.allOrderStatus")}</option>
          {ORDER_STATUSES.map((s) => (
            <option key={s} value={s}>
              {t(`order.status${s.charAt(0) + s.slice(1).toLowerCase()}`)}
            </option>
          ))}
        </select>
        <select
          value={store.paymentStatusFilter}
          onChange={(e) => store.setPaymentFilter(e.target.value)}
          className={selectCls}
        >
          <option value="">{t("order.allPaymentStatus")}</option>
          {PAYMENT_STATUSES.map((s) => (
            <option key={s} value={s}>
              {t(`order.payment${s.charAt(0) + s.slice(1).toLowerCase()}`)}
            </option>
          ))}
        </select>
        {auth.can("ORDER_CREATE") && (
          <AppButton
            onClick={() => navigate("/orders/create")}
            className="ml-auto"
          >
            + {t("order.addTitle")}
          </AppButton>
        )}
      </div>

      <AppTable
        head={
          <>
            <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wide w-10">
              #
            </th>
            <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wide">
              {t("order.orderNo")}
            </th>
            <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wide">
              {t("order.client")}
            </th>
            <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wide">
              {t("order.orderDate")}
            </th>
            <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wide">
              {t("order.status")}
            </th>
            <th className="px-4 py-3 text-right text-xs font-bold text-slate-500 uppercase tracking-wide">
              {t("order.total")}
            </th>
            <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wide">
              {t("order.paymentStatus")}
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
                {t("order.noData")}
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
                  {item.orderNo}
                </td>
                <td className="px-4 py-3 text-slate-700 font-medium">
                  {item.clientName}
                </td>
                <td className="px-4 py-3 text-slate-500 whitespace-nowrap">
                  {item.orderDate ? item.orderDate.slice(0, 10) : "—"}
                </td>
                <td className="px-4 py-3">
                  <AppBadge
                    variant={
                      STATUS_VARIANT[item.status as OrderStatus] ?? "warning"
                    }
                  >
                    {item.status}
                  </AppBadge>
                </td>
                <td className="px-4 py-3 text-right font-semibold text-slate-800">
                  ${fmt(item.total)}
                </td>
                <td className="px-4 py-3">
                  <AppBadge
                    variant={
                      PAYMENT_VARIANT[item.paymentStatus as PaymentStatus] ??
                      "danger"
                    }
                  >
                    {item.paymentStatus}
                  </AppBadge>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    {auth.can("ORDER_UPDATE") && (
                      <AppButton
                        variant="edit"
                        size="sm"
                        onClick={() => navigate(`/orders/${item.id}/edit`)}
                      >
                        {t("common.edit")}
                      </AppButton>
                    )}
                    {auth.can("ORDER_UPDATE") && (
                      <AppButton
                        variant="primary"
                        size="sm"
                        onClick={() =>
                          setStatusModal({
                            orderId: item.id,
                            orderNo: item.orderNo,
                            status: item.status,
                          })
                        }
                      >
                        {t("order.updateStatus")}
                      </AppButton>
                    )}
                    {auth.can("ORDER_DELETE") && (
                      <AppButton
                        variant="delete"
                        size="sm"
                        onClick={() => removeOrder(item.id)}
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

      <AppModal
        show={!!statusModal}
        title={`${t("order.updateStatus")} — ${statusModal?.orderNo ?? ""}`}
        onClose={() => setStatusModal(null)}
      >
        <div className="flex flex-col gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              {t("order.status")}
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
              {ORDER_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {t(`order.status${s.charAt(0) + s.slice(1).toLowerCase()}`)}
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

import { Fragment, useState, useEffect, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useOrderStore } from "./store";
import { useSystemSettingsStore } from "@/features/settings/store";
import { clientsApi } from "@/api/clients.api";
import { productsApi } from "@/api/products.api";
import { useToast } from "@/hooks/useToast";
import { AppButton, AppProductCombobox } from "@/components/ui";
import { ORDER_STATUSES } from "./constants";
import type { ClientDTO } from "@/api/clients.api";
import type { ProductDTO } from "@/api/products.api";

// ─────────────────────────────────────────────────────────────────────────────
// Types & helpers
// ─────────────────────────────────────────────────────────────────────────────
type DiscountType = "flat" | "pct";

interface LineItem {
  productId: number;
  productName: string;
  qty: number;
  price: number;
  discount: number;
  discountType: DiscountType;
  total: number;
  remark: string;
}

function calcTotal(
  qty: number,
  price: number,
  discount: number,
  discountType: DiscountType,
): number {
  const gross = qty * price;
  const disc =
    discountType === "pct" ? gross * (discount / 100) : discount;
  return Math.max(0, gross - disc);
}

function fmt(n: number) {
  return Number(n).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// View
// ─────────────────────────────────────────────────────────────────────────────
export function CreateOrderView() {
  const { t } = useTranslation();
  const store = useOrderStore();
  const navigate = useNavigate();
  const toast = useToast();

  const sys = useSystemSettingsStore();
  const allowOverselling = sys.settings?.allowOverselling ?? false;

  const [saving, setSaving] = useState(false);
  const [clients, setClients] = useState<ClientDTO[]>([]);
  const [lines, setLines] = useState<LineItem[]>([]);

  const [form, setForm] = useState({
    clientId: 0,
    orderDate: new Date().toISOString().slice(0, 10),
    status: "PENDING",
    discount: 0,
    tax: 0,
    remark: "",
  });

  // qty input refs for auto-focus after add
  const qtyRefs = useRef<(HTMLInputElement | null)[]>([]);
  const pendingFocusIdx = useRef<number | null>(null);

  // only fetch clients on mount (products are fetched per-query now)
  useEffect(() => {
    clientsApi.getAll(1, 500).then((res) => setClients(res.data));
    if (!sys.settings) sys.fetch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // auto-focus the qty cell of a newly added / updated row
  useEffect(() => {
    const idx = pendingFocusIdx.current;
    if (idx !== null) {
      const el = qtyRefs.current[idx];
      if (el) {
        el.focus();
        el.select();
      }
      pendingFocusIdx.current = null;
    }
  }, [lines]);

  // ── derived totals ──────────────────────────────────────────────────────
  const subtotal = useMemo(
    () => lines.reduce((s, l) => s + l.total, 0),
    [lines],
  );
  const total = useMemo(
    () => subtotal - Number(form.discount) + Number(form.tax),
    [subtotal, form.discount, form.tax],
  );

  // ── product search (passed to combobox) ────────────────────────────────
  async function searchProducts(query: string): Promise<ProductDTO[]> {
    const res = await productsApi.getAll(1, 20, query);
    return res.data;
  }

  // ── line actions ────────────────────────────────────────────────────────
  function addProductLine(product: ProductDTO) {
    const existingIdx = lines.findIndex((l) => l.productId === product.id);
    if (existingIdx >= 0) {
      // duplicate → increment qty on existing row
      setLines((prev) => {
        const next = [...prev];
        const l = next[existingIdx];
        const qty = l.qty + 1;
        next[existingIdx] = {
          ...l,
          qty,
          total: calcTotal(qty, l.price, l.discount, l.discountType),
        };
        return next;
      });
      toast.add(`Qty updated: "${product.name}"`);
      pendingFocusIdx.current = existingIdx;
      return;
    }
    setLines((prev) => [
      ...prev,
      {
        productId: product.id,
        productName: product.name,
        qty: 1,
        price: product.price,
        discount: 0,
        discountType: "flat",
        total: product.price,
        remark: "",
      },
    ]);
    pendingFocusIdx.current = lines.length;
  }

  function removeLine(idx: number) {
    setLines((prev) => prev.filter((_, i) => i !== idx));
  }

  function updateLine(idx: number, updates: Partial<LineItem>) {
    setLines((prev) => {
      const next = prev.map((l, i) => (i === idx ? { ...l, ...updates } : l));
      const l = next[idx];
      const qty = Math.max(1, l.qty);
      next[idx] = {
        ...l,
        qty,
        total: calcTotal(qty, l.price, l.discount, l.discountType),
      };
      return next;
    });
  }

  // ── submit ──────────────────────────────────────────────────────────────
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!form.clientId) return alert(t("order.clientRequired"));
    if (lines.length === 0) return alert(t("order.detailsRequired"));
    if (lines.some((l) => !l.productId))
      return alert(t("order.productRequired"));

    setSaving(true);
    try {
      await store.add({
        clientId: Number(form.clientId),
        orderDate: form.orderDate ? `${form.orderDate}T00:00:00` : null,
        status: form.status,
        discount: Number(form.discount),
        tax: Number(form.tax),
        remark: form.remark,
        details: lines.map((l) => ({
          productId: l.productId,
          qty: l.qty,
          price: l.price,
          discount: l.discount,
          total: l.total,
        })),
      });
      toast.add("Order created successfully.");
      navigate("/orders");
    } catch {
      toast.add("Failed to create order. Please try again.", "error");
    } finally {
      setSaving(false);
    }
  }

  // ── render ──────────────────────────────────────────────────────────────
  return (
    <div className="p-4 md:p-7 max-w-5xl mx-auto flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          className="text-slate-400 hover:text-slate-700 transition-colors p-1 rounded-lg bg-transparent border-0 cursor-pointer"
          onClick={() => navigate("/orders")}
        >
          <svg
            className="w-5 h-5"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>
        <h1 className="text-xl font-bold text-slate-800">
          {t("order.addTitle")}
        </h1>
      </div>

      <form className="flex flex-col gap-5" onSubmit={submit}>
        {/* ── Order Info ─────────────────────────────────────────────────── */}
        <div className="bg-white border border-slate-100 rounded-xl shadow-sm p-5 flex flex-col gap-4">
          <h2 className="text-sm font-bold text-slate-600 uppercase tracking-wide">
            {t("order.orderInfo")}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-600">
                {t("order.client")} *
              </label>
              <select
                value={form.clientId}
                onChange={(e) =>
                  setForm((f) => ({ ...f, clientId: Number(e.target.value) }))
                }
                required
                className="px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:border-indigo-500 bg-white"
              >
                <option value={0} disabled>
                  {t("common.select")}
                </option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-600">
                {t("order.orderDate")}
              </label>
              <input
                type="date"
                value={form.orderDate}
                onChange={(e) =>
                  setForm((f) => ({ ...f, orderDate: e.target.value }))
                }
                className="px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:border-indigo-500"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-600">
                {t("order.status")}
              </label>
              <select
                value={form.status}
                onChange={(e) =>
                  setForm((f) => ({ ...f, status: e.target.value }))
                }
                className="px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:border-indigo-500 bg-white"
              >
                {ORDER_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-600">
              {t("order.remark")}
            </label>
            <textarea
              value={form.remark}
              onChange={(e) =>
                setForm((f) => ({ ...f, remark: e.target.value }))
              }
              rows={2}
              className="px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:border-indigo-500 resize-y font-sans"
              placeholder={t("order.remarkPlaceholder")}
            />
          </div>
        </div>

        {/* ── Order Items ────────────────────────────────────────────────── */}
        <div className="bg-white border border-slate-100 rounded-xl shadow-sm p-5 flex flex-col gap-4">
          <h2 className="text-sm font-bold text-slate-600 uppercase tracking-wide">
            {t("order.details")}
          </h2>

          {/* Product search — type to fetch from API, click to add a row */}
          <AppProductCombobox
            onSearch={searchProducts}
            onSelect={addProductLine}
            placeholder={t("order.searchProductPlaceholder")}
            allowOutOfStock={allowOverselling}
          />

          {/* Live summary bar */}
          {lines.length > 0 && (
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 bg-slate-50 rounded-lg px-4 py-2.5 text-sm text-slate-500">
              <span className="font-semibold text-slate-600">
                {lines.length} {lines.length === 1 ? "item" : "items"}
              </span>
              <span className="text-slate-300">·</span>
              <span>
                {t("order.subtotal")}:{" "}
                <strong className="text-slate-700">${fmt(subtotal)}</strong>
              </span>
              <span className="text-slate-300">·</span>
              <span>
                {t("order.discount")}:{" "}
                <strong className="text-slate-700">
                  −${fmt(Number(form.discount))}
                </strong>
              </span>
              <span className="text-slate-300">·</span>
              <span>
                {t("order.tax")}:{" "}
                <strong className="text-slate-700">
                  +${fmt(Number(form.tax))}
                </strong>
              </span>
              <span className="text-slate-300 ml-auto hidden sm:inline">·</span>
              <span className="sm:ml-0 ml-auto">
                {t("order.total")}:{" "}
                <strong className="text-indigo-700 text-base">
                  ${fmt(total)}
                </strong>
              </span>
            </div>
          )}

          {/* Line items table */}
          {lines.length === 0 ? (
            <div className="text-center text-slate-400 py-8 text-sm">
              {t("order.noLines")}
            </div>
          ) : (
            <div className="overflow-x-auto -mx-1">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="border-b border-slate-100">
                    <th className="px-2 py-2 text-left text-xs font-bold text-slate-500 uppercase tracking-wide w-7">
                      #
                    </th>
                    <th className="px-2 py-2 text-left text-xs font-bold text-slate-500 uppercase tracking-wide">
                      {t("order.product")}
                    </th>
                    <th className="px-2 py-2 text-left text-xs font-bold text-slate-500 uppercase tracking-wide w-20">
                      {t("order.qty")}
                    </th>
                    <th className="px-2 py-2 text-left text-xs font-bold text-slate-500 uppercase tracking-wide w-28">
                      {t("order.price")}
                    </th>
                    <th className="px-2 py-2 text-left text-xs font-bold text-slate-500 uppercase tracking-wide w-36">
                      {t("order.lineDiscount")}
                    </th>
                    <th className="px-2 py-2 text-right text-xs font-bold text-slate-500 uppercase tracking-wide w-28">
                      {t("order.lineTotal")}
                    </th>
                    <th className="px-2 py-2 w-10" />
                  </tr>
                </thead>
                <tbody>
                  {lines.map((line, idx) => (
                    <Fragment key={idx}>
                      <tr className="hover:bg-slate-50 transition-colors">
                        <td className="px-2 pt-3 pb-1 text-slate-400 text-xs align-top">
                          {idx + 1}
                        </td>

                        {/* Product name + inline remark */}
                        <td className="px-2 pt-3 pb-1 align-top">
                          <div className="font-medium text-slate-700 leading-tight">
                            {line.productName}
                          </div>
                          <input
                            value={line.remark}
                            onChange={(e) =>
                              updateLine(idx, { remark: e.target.value })
                            }
                            placeholder={t("order.lineNotePlaceholder")}
                            className="mt-1 w-full text-xs text-slate-500 placeholder:text-slate-300 outline-none bg-transparent border-b border-transparent focus:border-slate-200 py-0.5 transition-colors"
                          />
                        </td>

                        {/* Qty — min 1 enforced in updateLine */}
                        <td className="px-2 pt-3 pb-1 align-top">
                          <input
                            ref={(el) => {
                              qtyRefs.current[idx] = el;
                            }}
                            type="number"
                            min="1"
                            value={line.qty}
                            onChange={(e) =>
                              updateLine(idx, { qty: Number(e.target.value) })
                            }
                            className="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-sm outline-none focus:border-indigo-500 text-right"
                          />
                        </td>

                        <td className="px-2 pt-3 pb-1 align-top">
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={line.price}
                            onChange={(e) =>
                              updateLine(idx, {
                                price: Number(e.target.value),
                              })
                            }
                            className="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-sm outline-none focus:border-indigo-500 text-right"
                          />
                        </td>

                        {/* Discount — $ / % toggle */}
                        <td className="px-2 pt-3 pb-1 align-top">
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              title={
                                line.discountType === "flat"
                                  ? "Switch to %"
                                  : "Switch to $"
                              }
                              onClick={() =>
                                updateLine(idx, {
                                  discountType:
                                    line.discountType === "flat"
                                      ? "pct"
                                      : "flat",
                                  discount: 0,
                                })
                              }
                              className="w-7 h-8 text-xs font-bold border border-slate-200 rounded-md bg-slate-50 hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-200 transition-colors shrink-0 cursor-pointer"
                            >
                              {line.discountType === "flat" ? "$" : "%"}
                            </button>
                            <input
                              type="number"
                              min="0"
                              max={
                                line.discountType === "pct" ? 100 : undefined
                              }
                              step={line.discountType === "pct" ? 1 : 0.01}
                              value={line.discount}
                              onChange={(e) =>
                                updateLine(idx, {
                                  discount: Number(e.target.value),
                                })
                              }
                              className="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-sm outline-none focus:border-indigo-500 text-right"
                            />
                          </div>
                        </td>

                        <td className="px-2 pt-3 pb-1 text-right font-semibold text-slate-700 align-top whitespace-nowrap">
                          ${fmt(line.total)}
                        </td>

                        <td className="px-2 pt-3 pb-1 align-top">
                          <button
                            type="button"
                            onClick={() => removeLine(idx)}
                            className="text-red-400 hover:text-red-600 transition-colors p-1 rounded bg-transparent border-0 cursor-pointer"
                          >
                            <svg
                              className="w-4 h-4"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                            >
                              <path d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </td>
                      </tr>

                      {/* row separator */}
                      <tr className="border-b border-slate-50">
                        <td colSpan={7} className="pb-1" />
                      </tr>
                    </Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* ── Totals ─────────────────────────────────────────────────────── */}
        <div className="bg-white border border-slate-100 rounded-xl shadow-sm p-5">
          <div className="flex flex-col gap-3 max-w-xs ml-auto">
            <div className="flex justify-between text-sm text-slate-600">
              <span>{t("order.subtotal")}</span>
              <span className="font-medium">${fmt(subtotal)}</span>
            </div>
            <div className="flex items-center justify-between text-sm text-slate-600">
              <label className="shrink-0">{t("order.discount")}</label>
              <div className="flex items-center gap-1">
                <span className="text-slate-400">$</span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.discount}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      discount: Number(e.target.value),
                    }))
                  }
                  className="w-24 px-2 py-1 border border-slate-200 rounded-lg text-sm outline-none focus:border-indigo-500 text-right"
                />
              </div>
            </div>
            <div className="flex items-center justify-between text-sm text-slate-600">
              <label className="shrink-0">{t("order.tax")}</label>
              <div className="flex items-center gap-1">
                <span className="text-slate-400">$</span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.tax}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, tax: Number(e.target.value) }))
                  }
                  className="w-24 px-2 py-1 border border-slate-200 rounded-lg text-sm outline-none focus:border-indigo-500 text-right"
                />
              </div>
            </div>
            <div className="border-t border-slate-100 pt-3 flex justify-between text-base font-bold text-slate-800">
              <span>{t("order.total")}</span>
              <span>${fmt(total)}</span>
            </div>
          </div>
        </div>

        {/* ── Actions ────────────────────────────────────────────────────── */}
        <div className="flex justify-end gap-3">
          <AppButton
            type="button"
            variant="cancel"
            onClick={() => navigate("/orders")}
          >
            {t("common.cancel")}
          </AppButton>
          <AppButton type="submit" disabled={saving}>
            {saving ? t("common.saving") : t("order.createOrder")}
          </AppButton>
        </div>
      </form>
    </div>
  );
}

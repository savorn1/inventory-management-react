import { Fragment, useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useOpenItemStore } from "./store";
import { productsApi } from "@/api/products.api";
import { useToast } from "@/hooks/useToast";
import { AppButton, AppProductCombobox } from "@/components/ui";
import type { ProductDTO } from "@/api/products.api";

interface LineItem {
  productId: number;
  productName: string;
  qty: number;
  remark: string;
}

export function CreateOpenItemView() {
  const { t } = useTranslation();
  const store = useOpenItemStore();
  const navigate = useNavigate();
  const toast = useToast();

  const [saving, setSaving] = useState(false);
  const [lines, setLines] = useState<LineItem[]>([]);
  const [form, setForm] = useState({
    itemDate: new Date().toISOString().slice(0, 10),
    remark: "",
  });

  // auto-focus qty on new row
  const qtyRefs = useRef<(HTMLInputElement | null)[]>([]);
  const pendingFocusIdx = useRef<number | null>(null);

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

  async function searchProducts(query: string): Promise<ProductDTO[]> {
    const res = await productsApi.getAll(1, 20, query);
    return res.data;
  }

  function addProductLine(product: ProductDTO) {
    const existingIdx = lines.findIndex((l) => l.productId === product.id);
    if (existingIdx >= 0) {
      setLines((prev) => {
        const next = [...prev];
        next[existingIdx] = {
          ...next[existingIdx],
          qty: next[existingIdx].qty + 1,
        };
        return next;
      });
      toast.add(`Qty updated: "${product.name}"`);
      pendingFocusIdx.current = existingIdx;
      return;
    }
    setLines((prev) => [
      ...prev,
      { productId: product.id, productName: product.name, qty: 1, remark: "" },
    ]);
    pendingFocusIdx.current = lines.length;
  }

  function removeLine(idx: number) {
    setLines((prev) => prev.filter((_, i) => i !== idx));
  }

  function updateLine(idx: number, updates: Partial<LineItem>) {
    setLines((prev) =>
      prev.map((l, i) =>
        i === idx ? { ...l, ...updates, qty: Math.max(1, (updates.qty ?? l.qty)) } : l,
      ),
    );
  }

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (lines.length === 0) return alert(t("openItem.detailsRequired"));

    setSaving(true);
    try {
      await store.add({
        itemDate: form.itemDate ? `${form.itemDate}T00:00:00` : new Date().toISOString(),
        remark: form.remark || undefined,
        details: lines.map((l) => ({
          productId: l.productId,
          qty: l.qty,
          remark: l.remark || undefined,
        })),
      });
      toast.add(t("openItem.createSuccess"));
      navigate("/open-items");
    } catch {
      toast.add(t("openItem.createFailed"), "error");
    } finally {
      setSaving(false);
    }
  }

  const totalQty = lines.reduce((s, l) => s + l.qty, 0);

  return (
    <div className="p-4 md:p-7 max-w-4xl mx-auto flex flex-col gap-6">
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-3">
        <button
          className="text-slate-400 hover:text-slate-700 transition-colors p-1 rounded-lg bg-transparent border-0 cursor-pointer"
          onClick={() => navigate("/open-items")}
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
        <h1 className="text-xl font-bold text-slate-800">{t("openItem.addTitle")}</h1>
      </div>

      <form className="flex flex-col gap-5" onSubmit={submit}>
        {/* ── Header info ────────────────────────────────────────────── */}
        <div className="bg-white border border-slate-100 rounded-xl shadow-sm p-5 flex flex-col gap-4">
          <h2 className="text-sm font-bold text-slate-600 uppercase tracking-wide">
            {t("openItem.itemInfo")}
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Item date */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-600">
                {t("openItem.itemDate")} *
              </label>
              <input
                type="date"
                required
                value={form.itemDate}
                onChange={(e) => setForm((f) => ({ ...f, itemDate: e.target.value }))}
                className="px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:border-indigo-500"
              />
            </div>

            {/* Remark */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-600">
                {t("openItem.remark")}
              </label>
              <input
                type="text"
                value={form.remark}
                onChange={(e) => setForm((f) => ({ ...f, remark: e.target.value }))}
                className="px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:border-indigo-500 placeholder:text-slate-400"
                placeholder={t("openItem.remarkPlaceholder")}
              />
            </div>
          </div>
        </div>

        {/* ── Line items ─────────────────────────────────────────────── */}
        <div className="bg-white border border-slate-100 rounded-xl shadow-sm p-5 flex flex-col gap-4">
          <h2 className="text-sm font-bold text-slate-600 uppercase tracking-wide">
            {t("openItem.details")}
          </h2>

          <AppProductCombobox
            onSearch={searchProducts}
            onSelect={addProductLine}
            placeholder={t("openItem.searchProductPlaceholder")}
            allowOutOfStock
          />

          {/* Summary bar */}
          {lines.length > 0 && (
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 bg-slate-50 rounded-lg px-4 py-2.5 text-sm text-slate-500">
              <span className="font-semibold text-slate-600">
                {lines.length} {lines.length === 1 ? "product" : "products"}
              </span>
              <span className="text-slate-300">·</span>
              <span>
                {t("openItem.totalQty")}:{" "}
                <strong className="text-slate-700">{totalQty}</strong>
              </span>
            </div>
          )}

          {lines.length === 0 ? (
            <div className="text-center text-slate-400 py-8 text-sm">
              {t("openItem.noLines")}
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
                      {t("openItem.product")}
                    </th>
                    <th className="px-2 py-2 text-left text-xs font-bold text-slate-500 uppercase tracking-wide w-24">
                      {t("openItem.qty")}
                    </th>
                    <th className="px-2 py-2 text-left text-xs font-bold text-slate-500 uppercase tracking-wide">
                      {t("openItem.remark")}
                    </th>
                    <th className="px-2 py-2 w-10" />
                  </tr>
                </thead>
                <tbody>
                  {lines.map((line, idx) => (
                    <Fragment key={idx}>
                      <tr className="hover:bg-slate-50 transition-colors">
                        <td className="px-2 pt-3 pb-2 text-slate-400 text-xs align-top">
                          {idx + 1}
                        </td>

                        <td className="px-2 pt-3 pb-2 align-top">
                          <div className="font-medium text-slate-700 leading-tight">
                            {line.productName}
                          </div>
                        </td>

                        {/* Qty */}
                        <td className="px-2 pt-3 pb-2 align-top">
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

                        {/* Line remark */}
                        <td className="px-2 pt-3 pb-2 align-top">
                          <input
                            type="text"
                            value={line.remark}
                            onChange={(e) =>
                              updateLine(idx, { remark: e.target.value })
                            }
                            placeholder={t("openItem.remarkPlaceholder")}
                            className="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-sm outline-none focus:border-indigo-500 placeholder:text-slate-400"
                          />
                        </td>

                        <td className="px-2 pt-3 pb-2 align-top">
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

                      <tr className="border-b border-slate-50">
                        <td colSpan={5} className="pb-1" />
                      </tr>
                    </Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* ── Actions ────────────────────────────────────────────────── */}
        <div className="flex justify-end gap-3">
          <AppButton
            type="button"
            variant="cancel"
            onClick={() => navigate("/open-items")}
          >
            {t("common.cancel")}
          </AppButton>
          <AppButton type="submit" disabled={saving}>
            {saving ? t("common.saving") : t("openItem.createItem")}
          </AppButton>
        </div>
      </form>
    </div>
  );
}

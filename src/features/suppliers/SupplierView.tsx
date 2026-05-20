import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useSupplierStore } from "./store";
import { useAuthStore } from "@/stores/auth";
import { useCrud } from "@/hooks/useCrud";
import { AppTable, AppPagination, AppModal, AppButton } from "@/components/ui";
import type { SupplierDTO } from "@/api/suppliers.api";

export function SupplierView() {
  const { t } = useTranslation();
  const store = useSupplierStore();
  const auth = useAuthStore();

  useEffect(() => {
    store.fetchAll(1, 10);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const {
    showModal,
    editingId,
    form,
    errors,
    saving,
    openAdd,
    openEdit,
    closeModal,
    setField,
    save,
    remove,
  } = useCrud<SupplierDTO, Omit<SupplierDTO, "id">>({
    add: store.add,
    update: store.update,
    remove: store.remove,
    defaultForm: () => ({ name: "", phone: "", email: "", address: "" }),
    toForm: (item) => ({
      name: item.name,
      phone: item.phone,
      email: item.email,
      address: item.address,
    }),
    label: "supplier",
    validate: (f) => {
      const e: Record<string, string> = {};
      if (!f.name.trim()) e.name = t("validation.required");
      else if (f.name.trim().length < 2)
        e.name = t("validation.minLength", { min: 2 });
      if (f.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email))
        e.email = t("validation.emailInvalid");
      if (f.phone && !/^[+\d\s\-()]{6,20}$/.test(f.phone))
        e.phone = t("validation.phoneInvalid");
      return e;
    },
  });

  return (
    <div className="p-4 md:p-7 flex flex-col gap-5">
      <div className="flex flex-wrap items-center gap-3">
        <input
          value={store.search}
          onChange={(e) => store.searchByName(e.target.value)}
          className="h-9 px-3 border border-slate-200 rounded-lg text-sm outline-none focus:border-indigo-500 flex-1 min-w-0 max-w-xs placeholder:text-slate-400"
          placeholder={t("supplier.searchPlaceholder")}
        />
        {auth.can("SUPPLIER_CREATE") && (
          <AppButton onClick={openAdd} className="ml-auto">
            + {t("supplier.addTitle")}
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
              {t("supplier.name")}
            </th>
            <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wide">
              {t("supplier.email")}
            </th>
            <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wide">
              {t("supplier.phone")}
            </th>
            <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wide">
              {t("supplier.address")}
            </th>
            <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wide">
              {t("common.actions")}
            </th>
          </>
        }
        body={
          store.loading ? (
            <tr>
              <td colSpan={6} className="text-center text-slate-400 py-12">
                {t("common.loading")}
              </td>
            </tr>
          ) : store.items.length === 0 ? (
            <tr>
              <td colSpan={6} className="text-center text-slate-400 py-12">
                {t("supplier.noData")}
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
                <td className="px-4 py-3 font-semibold text-slate-800 whitespace-nowrap">
                  {item.name}
                </td>
                <td className="px-4 py-3 text-slate-500 whitespace-nowrap">
                  {item.email || "—"}
                </td>
                <td className="px-4 py-3 text-slate-500 whitespace-nowrap">
                  {item.phone || "—"}
                </td>
                <td className="px-4 py-3 text-slate-500 max-w-[180px] truncate">
                  {item.address || "—"}
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    {auth.can("SUPPLIER_UPDATE") && (
                      <AppButton
                        variant="edit"
                        size="sm"
                        onClick={() => openEdit(item)}
                      >
                        {t("common.edit")}
                      </AppButton>
                    )}
                    {auth.can("SUPPLIER_DELETE") && (
                      <AppButton
                        variant="delete"
                        size="sm"
                        onClick={() => remove(item.id)}
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
        show={showModal}
        title={editingId ? t("supplier.editTitle") : t("supplier.addTitle")}
        onClose={closeModal}
      >
        <form
          className="flex flex-col gap-4"
          onSubmit={(e) => {
            e.preventDefault();
            save();
          }}
        >
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-600">
              {t("supplier.name")} *
            </label>
            <input
              value={form.name}
              onChange={(e) => setField("name", e.target.value)}
              className={`px-3 py-2 border rounded-lg text-sm outline-none ${errors.name ? "border-red-400 focus:border-red-400" : "border-slate-200 focus:border-indigo-500"}`}
              placeholder={t("supplier.namePlaceholder")}
            />
            {errors.name && (
              <p className="text-xs text-red-500">{errors.name}</p>
            )}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-600">
                {t("supplier.email")}
              </label>
              <input
                value={form.email}
                onChange={(e) => setField("email", e.target.value)}
                className={`px-3 py-2 border rounded-lg text-sm outline-none ${errors.email ? "border-red-400 focus:border-red-400" : "border-slate-200 focus:border-indigo-500"}`}
                placeholder={t("supplier.emailPlaceholder")}
              />
              {errors.email && (
                <p className="text-xs text-red-500">{errors.email}</p>
              )}
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-600">
                {t("supplier.phone")}
              </label>
              <input
                value={form.phone}
                onChange={(e) => setField("phone", e.target.value)}
                className={`px-3 py-2 border rounded-lg text-sm outline-none ${errors.phone ? "border-red-400 focus:border-red-400" : "border-slate-200 focus:border-indigo-500"}`}
                placeholder={t("supplier.phonePlaceholder")}
              />
              {errors.phone && (
                <p className="text-xs text-red-500">{errors.phone}</p>
              )}
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-600">
              {t("supplier.address")}
            </label>
            <textarea
              value={form.address}
              onChange={(e) => setField("address", e.target.value)}
              rows={2}
              className="px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:border-indigo-500 resize-y font-sans"
              placeholder={t("supplier.addressPlaceholder")}
            />
          </div>
          <div className="flex justify-end gap-2 mt-1">
            <AppButton variant="cancel" type="button" onClick={closeModal}>
              {t("common.cancel")}
            </AppButton>
            <AppButton variant="primary" type="submit" disabled={saving}>
              {saving
                ? t("common.saving")
                : editingId
                  ? t("common.update")
                  : t("common.add")}
            </AppButton>
          </div>
        </form>
      </AppModal>
    </div>
  );
}

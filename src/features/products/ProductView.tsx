import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useProductStore } from "./store";
import { useCategoryStore } from "@/features/categories/store";
import { useBrandStore } from "@/features/brands/store";
import { useAuthStore } from "@/stores/auth";
import { useCrud } from "@/hooks/useCrud";
import { AppTable, AppPagination, AppModal, AppButton } from "@/components/ui";
import { formatCurrency } from "@/utils/format";
import { productsApi } from "@/api/products.api";
import type { ProductDTO, CreateProductDTO } from "@/api/products.api";

export function ProductView() {
  const { t } = useTranslation();
  const store = useProductStore();
  const catStore = useCategoryStore();
  const brdStore = useBrandStore();
  const auth = useAuthStore();

  useEffect(() => {
    Promise.all([
      store.fetchAll(1, 10),
      catStore.fetchAll(1, 100),
      brdStore.fetchAll(1, 100),
    ]);
  }, []);

  const imageFileRef = useRef<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  function clearImage() {
    imageFileRef.current = null;
    setImagePreview(null);
  }

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    imageFileRef.current = file;
    setImagePreview(URL.createObjectURL(file));
    e.target.value = "";
  }

  const wrappedAdd = async (payload: CreateProductDTO) => {
    const res = await productsApi.create(payload);
    if (imageFileRef.current) {
      await productsApi.uploadImage(res.data.id, imageFileRef.current);
    }
    await store.fetchAll(1, store.size);
  };

  const wrappedUpdate = async (id: number, payload: CreateProductDTO) => {
    await productsApi.update(id, payload);
    if (imageFileRef.current) {
      await productsApi.uploadImage(id, imageFileRef.current);
    }
    await store.fetchAll(store.page, store.size);
  };

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
  } = useCrud<ProductDTO, CreateProductDTO>({
    add: wrappedAdd,
    update: wrappedUpdate,
    remove: store.remove,
    defaultForm: () => ({
      name: "",
      description: "",
      categoryId: null,
      brandId: null,
      price: 0,
    }),
    toForm: (item) => ({
      name: item.name,
      description: item.description,
      categoryId: item.categoryId,
      brandId: item.brandId,
      price: item.price,
    }),
    label: "product",
    validate: (f) => {
      const e: Record<string, string> = {};
      if (!f.name.trim()) e.name = t("validation.required");
      else if (f.name.trim().length < 2)
        e.name = t("validation.minLength", { min: 2 });
      if (f.price < 0) e.price = t("validation.priceMin");
      return e;
    },
  });

  function handleOpenAdd() {
    clearImage();
    openAdd();
  }

  function handleOpenEdit(item: ProductDTO) {
    clearImage();
    setImagePreview(item.imageUrl ?? null);
    openEdit(item);
  }

  function handleCloseModal() {
    clearImage();
    closeModal();
  }

  return (
    <div className="p-4 md:p-7 flex flex-col gap-5">
      <div className="flex flex-wrap items-center gap-3">
        <input
          value={store.search}
          onChange={(e) => store.searchByName(e.target.value)}
          className="h-9 px-3 border border-slate-200 rounded-lg text-sm outline-none focus:border-indigo-500 flex-1 min-w-0 max-w-xs placeholder:text-slate-400"
          placeholder={t("product.searchPlaceholder")}
        />
        {auth.can("PRODUCT_CREATE") && (
          <AppButton onClick={handleOpenAdd} className="ml-auto">
            + {t("product.addTitle")}
          </AppButton>
        )}
      </div>

      <AppTable
        head={
          <>
            <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wide w-10">
              #
            </th>
            <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wide w-14">
              {t("product.image")}
            </th>
            <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wide">
              {t("product.name")}
            </th>
            <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wide">
              {t("product.description")}
            </th>
            <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wide">
              {t("product.category")}
            </th>
            <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wide">
              {t("product.brand")}
            </th>
            <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wide">
              {t("product.price")}
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
                {t("product.noData")}
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
                <td className="px-4 py-3">
                  {item.imageUrl ? (
                    <img
                      src={item.imageUrl}
                      alt={item.name}
                      className="w-10 h-10 object-cover rounded-md border border-slate-200"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-md border border-slate-200 bg-slate-100 flex items-center justify-center text-slate-300">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="w-5 h-5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={1.5}
                          d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
                      </svg>
                    </div>
                  )}
                </td>
                <td className="px-4 py-3 font-semibold text-slate-800 whitespace-nowrap">
                  {item.name}
                </td>
                <td className="px-4 py-3 text-slate-500 max-w-xs truncate">
                  {item.description || "—"}
                </td>
                <td className="px-4 py-3 text-slate-500 whitespace-nowrap">
                  {item.categoryName || "—"}
                </td>
                <td className="px-4 py-3 text-slate-500 whitespace-nowrap">
                  {item.brandName || "—"}
                </td>
                <td className="px-4 py-3 text-slate-700 font-medium whitespace-nowrap">
                  {formatCurrency(item.price)}
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    {auth.can("PRODUCT_UPDATE") && (
                      <AppButton
                        variant="edit"
                        size="sm"
                        onClick={() => handleOpenEdit(item)}
                      >
                        {t("common.edit")}
                      </AppButton>
                    )}
                    {auth.can("PRODUCT_DELETE") && (
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
        title={editingId ? t("product.editTitle") : t("product.addTitle")}
        onClose={handleCloseModal}
      >
        <form
          className="flex flex-col gap-4"
          onSubmit={(e) => {
            e.preventDefault();
            save();
          }}
        >
          {/* Image upload */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-600">
              {t("product.image")}
            </label>
            <label className="cursor-pointer group">
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleImageChange}
              />
              {imagePreview ? (
                <div className="relative w-full h-40 rounded-lg overflow-hidden border border-slate-200 group-hover:border-indigo-400 transition-colors">
                  <img
                    src={imagePreview}
                    alt="preview"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <span className="text-white text-xs font-medium">
                      {t("product.changeImage")}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="w-full h-40 rounded-lg border-2 border-dashed border-slate-200 group-hover:border-indigo-400 transition-colors flex flex-col items-center justify-center gap-2 text-slate-400 group-hover:text-indigo-400">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="w-8 h-8"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                  <span className="text-xs font-medium">
                    {t("product.uploadImage")}
                  </span>
                </div>
              )}
            </label>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-600">
              {t("product.name")} *
            </label>
            <input
              value={form.name}
              onChange={(e) => setField("name", e.target.value)}
              className={`px-3 py-2 border rounded-lg text-sm outline-none ${errors.name ? "border-red-400 focus:border-red-400" : "border-slate-200 focus:border-indigo-500"}`}
              placeholder={t("product.namePlaceholder")}
            />
            {errors.name && (
              <p className="text-xs text-red-500">{errors.name}</p>
            )}
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-600">
              {t("product.description")}
            </label>
            <textarea
              value={form.description}
              onChange={(e) => setField("description", e.target.value)}
              rows={2}
              className="px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:border-indigo-500 resize-y font-sans"
              placeholder={t("product.descriptionPlaceholder")}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-600">
                {t("product.category")}
              </label>
              <select
                value={form.categoryId ?? ""}
                onChange={(e) =>
                  setField(
                    "categoryId",
                    e.target.value ? Number(e.target.value) : null,
                  )
                }
                className="px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:border-indigo-500 bg-white"
              >
                <option value="">{t("common.none")}</option>
                {catStore.items.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-600">
                {t("product.brand")}
              </label>
              <select
                value={form.brandId ?? ""}
                onChange={(e) =>
                  setField(
                    "brandId",
                    e.target.value ? Number(e.target.value) : null,
                  )
                }
                className="px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:border-indigo-500 bg-white"
              >
                <option value="">{t("common.none")}</option>
                {brdStore.items.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-600">
              {t("product.price")}
            </label>
            <input
              value={form.price}
              onChange={(e) => setField("price", Number(e.target.value))}
              type="number"
              min="0"
              step="0.01"
              className={`px-3 py-2 border rounded-lg text-sm outline-none ${errors.price ? "border-red-400 focus:border-red-400" : "border-slate-200 focus:border-indigo-500"}`}
              placeholder={t("product.pricePlaceholder")}
            />
            {errors.price && (
              <p className="text-xs text-red-500">{errors.price}</p>
            )}
          </div>
          <div className="flex justify-end gap-2 mt-1">
            <AppButton
              variant="cancel"
              type="button"
              onClick={handleCloseModal}
            >
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

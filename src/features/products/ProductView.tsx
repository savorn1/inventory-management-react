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
import { filesApi } from "@/api/files.api";
import type { ProductDTO, CreateProductDTO } from "@/api/products.api";

// Each entry is either a saved URL (file=undefined) or a new local pick (file=File)
interface ImageEntry {
  preview: string;
  file?: File;
}

// Lightbox state
interface LightboxState {
  urls: string[];
  index: number;
}

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Multi-image upload state ──────────────────────────────────────────────
  const [images, setImages] = useState<ImageEntry[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function clearImages() {
    images.forEach((img) => {
      if (img.file) URL.revokeObjectURL(img.preview);
    });
    setImages([]);
  }

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    setImages((prev) => [
      ...prev,
      ...files.map((f) => ({ preview: URL.createObjectURL(f), file: f })),
    ]);
    e.target.value = "";
  }

  function removeImage(index: number) {
    setImages((prev) => {
      const entry = prev[index];
      if (entry.file) URL.revokeObjectURL(entry.preview);
      return prev.filter((_, i) => i !== index);
    });
  }

  async function resolveImageUrls(): Promise<string[]> {
    const newFiles = images.filter((img) => img.file).map((img) => img.file!);
    if (newFiles.length === 0)
      return images.filter((img) => !img.file).map((img) => img.preview);

    const res =
      newFiles.length === 1
        ? { data: [await filesApi.upload(newFiles[0]).then((r) => r.data)] }
        : await filesApi.uploadMultiple(newFiles);

    const uploadedUrls = [...res.data];
    return images.map((img) =>
      img.file ? uploadedUrls.shift()! : img.preview,
    );
  }

  // ── Lightbox ──────────────────────────────────────────────────────────────
  const [lightbox, setLightbox] = useState<LightboxState | null>(null);

  function openLightbox(urls: string[], index = 0) {
    if (!urls.length) return;
    setLightbox({ urls, index });
  }

  function closeLightbox() {
    setLightbox(null);
  }

  function lightboxPrev() {
    setLightbox((lb) =>
      lb ? { ...lb, index: (lb.index - 1 + lb.urls.length) % lb.urls.length } : lb,
    );
  }

  function lightboxNext() {
    setLightbox((lb) =>
      lb ? { ...lb, index: (lb.index + 1) % lb.urls.length } : lb,
    );
  }

  // Keyboard navigation for lightbox
  useEffect(() => {
    if (!lightbox) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") closeLightbox();
      if (e.key === "ArrowLeft") lightboxPrev();
      if (e.key === "ArrowRight") lightboxNext();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [lightbox]);

  // ── CRUD ──────────────────────────────────────────────────────────────────
  const wrappedAdd = async (payload: CreateProductDTO) => {
    const imageUrls = await resolveImageUrls();
    await productsApi.create({ ...payload, imageUrls });
    await store.fetchAll(1, store.size);
  };

  const wrappedUpdate = async (id: number, payload: CreateProductDTO) => {
    const imageUrls = await resolveImageUrls();
    await productsApi.update(id, { ...payload, imageUrls });
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
    clearImages();
    openAdd();
  }

  function handleOpenEdit(item: ProductDTO) {
    clearImages();
    const existing = item.imageUrls?.length
      ? item.imageUrls
      : item.imageUrl
        ? [item.imageUrl]
        : [];
    setImages(existing.map((url) => ({ preview: url })));
    openEdit(item);
  }

  function handleCloseModal() {
    clearImages();
    closeModal();
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="p-4 md:p-7 flex flex-col gap-5">

      {/* ── Lightbox overlay ── */}
      {lightbox && (
        <div
          className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center"
          onClick={closeLightbox}
        >
          {/* Image */}
          <img
            src={lightbox.urls[lightbox.index]}
            alt={`preview-${lightbox.index}`}
            className="max-w-[88vw] max-h-[88vh] object-contain rounded-xl shadow-2xl select-none"
            onClick={(e) => e.stopPropagation()}
          />

          {/* Close button */}
          <button
            onClick={closeLightbox}
            className="absolute top-4 right-4 w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
            aria-label="Close"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>

          {/* Prev / Next (only when multiple) */}
          {lightbox.urls.length > 1 && (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); lightboxPrev(); }}
                className="absolute left-4 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
                aria-label="Previous"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); lightboxNext(); }}
                className="absolute right-4 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
                aria-label="Next"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>

              {/* Counter */}
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/70 text-sm font-medium bg-black/40 rounded-full px-3 py-0.5">
                {lightbox.index + 1} / {lightbox.urls.length}
              </div>

              {/* Dot indicators */}
              <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex gap-1.5">
                {lightbox.urls.map((_, i) => (
                  <button
                    key={i}
                    onClick={(e) => { e.stopPropagation(); setLightbox((lb) => lb ? { ...lb, index: i } : lb); }}
                    className={`w-2 h-2 rounded-full transition-colors ${i === lightbox.index ? "bg-white" : "bg-white/40"}`}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* ── Toolbar ── */}
      <div className="flex flex-wrap items-center gap-3">
        <input
          value={store.search}
          onChange={(e) => store.searchByName(e.target.value)}
          className="h-9 px-3 border border-slate-200 rounded-lg text-sm outline-none focus:border-indigo-500 flex-1 min-w-0 max-w-xs placeholder:text-slate-400"
          placeholder={t("product.searchPlaceholder")}
        />

        {/* Sort By */}
        <select
          value={store.sortBy}
          onChange={(e) => store.setSort(e.target.value, store.sortOrder)}
          className="h-9 px-3 border border-slate-200 rounded-lg text-sm outline-none focus:border-indigo-500 bg-white text-slate-600 min-w-[130px]"
        >
          <option value="">{t("product.sortByDefault")}</option>
          <option value="name">{t("product.name")}</option>
          <option value="price">{t("product.price")}</option>
          <option value="stock">{t("product.stock")}</option>
          <option value="createdAt">{t("product.sortByCreatedAt")}</option>
        </select>

        {/* Sort Order */}
        <select
          value={store.sortOrder}
          onChange={(e) => store.setSort(store.sortBy, e.target.value as "asc" | "desc")}
          disabled={!store.sortBy}
          className="h-9 px-3 border border-slate-200 rounded-lg text-sm outline-none focus:border-indigo-500 bg-white text-slate-600 min-w-[110px] disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <option value="asc">↑ {t("product.sortAsc")}</option>
          <option value="desc">↓ {t("product.sortDesc")}</option>
        </select>

        {auth.can("PRODUCT_CREATE") && (
          <AppButton onClick={handleOpenAdd} className="ml-auto">
            + {t("product.addTitle")}
          </AppButton>
        )}
      </div>

      {/* ── Table ── */}
      <AppTable
        head={
          <>
            <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wide w-10">#</th>
            <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wide w-14">{t("product.image")}</th>
            <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wide">{t("product.name")}</th>
            <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wide">{t("product.description")}</th>
            <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wide">{t("product.category")}</th>
            <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wide">{t("product.brand")}</th>
            <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wide">{t("product.price")}</th>
            <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wide">{t("product.stock")}</th>
            <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wide">{t("common.actions")}</th>
          </>
        }
        body={
          store.loading ? (
            <tr><td colSpan={9} className="text-center text-slate-400 py-12">{t("common.loading")}</td></tr>
          ) : store.items.length === 0 ? (
            <tr><td colSpan={9} className="text-center text-slate-400 py-12">{t("product.noData")}</td></tr>
          ) : (
            store.items.map((item, idx) => {
              const allUrls = item.imageUrls?.length
                ? item.imageUrls
                : item.imageUrl ? [item.imageUrl] : [];
              const thumb = allUrls[0];

              return (
                <tr key={item.id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3 text-slate-400">
                    {(store.page - 1) * store.size + idx + 1}
                  </td>

                  {/* Thumbnail — click to open lightbox */}
                  <td className="px-4 py-3">
                    {thumb ? (
                      <button
                        type="button"
                        onClick={() => openLightbox(allUrls, 0)}
                        className="relative w-10 h-10 rounded-md overflow-hidden border border-slate-200 group focus:outline-none focus:ring-2 focus:ring-indigo-400"
                        aria-label="Preview images"
                      >
                        <img
                          src={thumb}
                          alt={item.name}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-200"
                        />
                        {/* Zoom icon on hover */}
                        <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                          </svg>
                        </div>
                        {/* Image count badge */}
                        {allUrls.length > 1 && (
                          <span className="absolute -top-1.5 -right-1.5 bg-indigo-500 text-white text-[9px] font-bold rounded-full w-4 h-4 flex items-center justify-center leading-none">
                            {allUrls.length}
                          </span>
                        )}
                      </button>
                    ) : (
                      <div className="w-10 h-10 rounded-md border border-slate-200 bg-slate-100 flex items-center justify-center text-slate-300">
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                    )}
                  </td>

                  <td className="px-4 py-3 font-semibold text-slate-800 whitespace-nowrap">{item.name}</td>
                  <td className="px-4 py-3 text-slate-500 max-w-xs truncate">{item.description || "—"}</td>
                  <td className="px-4 py-3 text-slate-500 whitespace-nowrap">{item.categoryName || "—"}</td>
                  <td className="px-4 py-3 text-slate-500 whitespace-nowrap">{item.brandName || "—"}</td>
                  <td className="px-4 py-3 text-slate-700 font-medium whitespace-nowrap">{formatCurrency(item.price)}</td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    {item.stock != null ? (
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${item.stock === 0 ? "bg-red-100 text-red-600" : item.stock <= 10 ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700"}`}>
                        {item.stock}
                      </span>
                    ) : (
                      <span className="text-slate-400">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      {auth.can("PRODUCT_UPDATE") && (
                        <AppButton variant="edit" size="sm" onClick={() => handleOpenEdit(item)}>
                          {t("common.edit")}
                        </AppButton>
                      )}
                      {auth.can("PRODUCT_DELETE") && (
                        <AppButton variant="delete" size="sm" onClick={() => remove(item.id)}>
                          {t("common.delete")}
                        </AppButton>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })
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

      {/* ── Add / Edit modal ── */}
      <AppModal
        show={showModal}
        title={editingId ? t("product.editTitle") : t("product.addTitle")}
        onClose={handleCloseModal}
      >
        <form
          className="flex flex-col gap-4"
          onSubmit={(e) => { e.preventDefault(); save(); }}
        >
          {/* ── Multi-image upload ── */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-600">
              {t("product.images")}
            </label>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={handleImageChange}
            />

            {/* Image grid */}
            {images.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-1">
                {images.map((img, i) => (
                  <div
                    key={i}
                    className="relative w-20 h-20 rounded-lg overflow-hidden border border-slate-200 group"
                  >
                    <img
                      src={img.preview}
                      alt={`image-${i}`}
                      className="w-full h-full object-cover"
                    />

                    {/* Hover overlay with two actions */}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      {/* Preview / zoom */}
                      <button
                        type="button"
                        onClick={() => openLightbox(images.map((m) => m.preview), i)}
                        className="w-7 h-7 rounded-full bg-white/20 hover:bg-white/40 text-white flex items-center justify-center transition-colors"
                        aria-label="Preview"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      </button>

                      {/* Remove */}
                      <button
                        type="button"
                        onClick={() => removeImage(i)}
                        className="w-7 h-7 rounded-full bg-white/20 hover:bg-red-500 text-white flex items-center justify-center transition-colors"
                        aria-label="Remove"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                      </button>
                    </div>

                    {/* New-file badge */}
                    {img.file && (
                      <span className="absolute bottom-0.5 left-0.5 text-[9px] bg-indigo-500 text-white rounded px-1 leading-4 pointer-events-none">
                        new
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Add images trigger */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-2 w-full h-10 px-3 rounded-lg border-2 border-dashed border-slate-200 hover:border-indigo-400 text-slate-400 hover:text-indigo-400 transition-colors text-xs font-medium"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              {t("product.addImages")}
            </button>
          </div>

          {/* ── Fields ── */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-600">{t("product.name")} *</label>
            <input
              value={form.name}
              onChange={(e) => setField("name", e.target.value)}
              className={`px-3 py-2 border rounded-lg text-sm outline-none ${errors.name ? "border-red-400 focus:border-red-400" : "border-slate-200 focus:border-indigo-500"}`}
              placeholder={t("product.namePlaceholder")}
            />
            {errors.name && <p className="text-xs text-red-500">{errors.name}</p>}
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-600">{t("product.description")}</label>
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
              <label className="text-xs font-semibold text-slate-600">{t("product.category")}</label>
              <select
                value={form.categoryId ?? ""}
                onChange={(e) => setField("categoryId", e.target.value ? Number(e.target.value) : null)}
                className="px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:border-indigo-500 bg-white"
              >
                <option value="">{t("common.none")}</option>
                {catStore.items.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-600">{t("product.brand")}</label>
              <select
                value={form.brandId ?? ""}
                onChange={(e) => setField("brandId", e.target.value ? Number(e.target.value) : null)}
                className="px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:border-indigo-500 bg-white"
              >
                <option value="">{t("common.none")}</option>
                {brdStore.items.map((b) => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-600">{t("product.price")}</label>
            <input
              value={form.price}
              onChange={(e) => setField("price", Number(e.target.value))}
              type="number"
              min="0"
              step="0.01"
              className={`px-3 py-2 border rounded-lg text-sm outline-none ${errors.price ? "border-red-400 focus:border-red-400" : "border-slate-200 focus:border-indigo-500"}`}
              placeholder={t("product.pricePlaceholder")}
            />
            {errors.price && <p className="text-xs text-red-500">{errors.price}</p>}
          </div>

          <div className="flex justify-end gap-2 mt-1">
            <AppButton variant="cancel" type="button" onClick={handleCloseModal}>
              {t("common.cancel")}
            </AppButton>
            <AppButton variant="primary" type="submit" disabled={saving}>
              {saving ? t("common.saving") : editingId ? t("common.update") : t("common.add")}
            </AppButton>
          </div>
        </form>
      </AppModal>
    </div>
  );
}

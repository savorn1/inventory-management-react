import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useRoleStore } from "./store";
import { useAuthStore } from "@/stores/auth";
import { useConfirmStore } from "@/stores/confirm";
import { useToast } from "@/hooks/useToast";
import { AppTable, AppPagination, AppButton } from "@/components/ui";
import { RoleFormModal } from "./RoleFormModal";
import type { RoleDTO, CreateRoleDTO } from "@/api/roles.api";

export function RoleView() {
  const { t } = useTranslation();
  const store = useRoleStore();
  const auth = useAuthStore();
  const toast = useToast();
  const confirm = useConfirmStore();

  useEffect(() => {
    Promise.all([store.fetchAll(1, 10), store.fetchAllPermissions()]);
  }, [store.fetchAll, store.fetchAllPermissions]);

  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const defaultForm = (): CreateRoleDTO => ({
    name: "",
    code: "",
    isDefault: false,
    description: "",
    permissionIds: [],
  });
  const [form, setForm] = useState<CreateRoleDTO>(defaultForm);

  function clearError(key: string) {
    if (errors[key]) setErrors((p) => ({ ...p, [key]: undefined! }));
  }

  function openAdd() {
    setEditingId(null);
    setForm(defaultForm());
    setErrors({});
    setShowModal(true);
  }

  function openEdit(item: RoleDTO) {
    setEditingId(item.id);
    setForm({
      name: item.name,
      code: item.code,
      isDefault: item.isDefault,
      description: item.description ?? "",
      permissionIds: item.permissions?.map((p) => p.id) ?? [],
    });
    setErrors({});
    setShowModal(true);
  }

  async function save() {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = t("validation.required");
    else if (form.name.trim().length < 2)
      e.name = t("validation.minLength", { min: 2 });
    if (!form.code.trim()) e.code = t("validation.required");
    else if (!/^[A-Z0-9_]+$/.test(form.code.trim()))
      e.code = t("validation.codeFormat");
    if (Object.keys(e).length > 0) {
      setErrors(e);
      return;
    }

    setSaving(true);
    try {
      if (editingId !== null) {
        await store.update(editingId, form);
        toast.add("Role updated successfully.");
      } else {
        await store.add(form);
        toast.add("Role created successfully.");
      }
      setShowModal(false);
    } catch (err) {
      toast.add(
        err instanceof Error ? err.message : "Failed to save role.",
        "error",
      );
    } finally {
      setSaving(false);
    }
  }

  function handleDelete(id: number) {
    confirm.open(t("common.deleteConfirm"), async () => {
      try {
        await store.remove(id);
        toast.add("Role deleted successfully.");
      } catch (err) {
        toast.add(
          err instanceof Error ? err.message : "Failed to delete role.",
          "error",
        );
      }
    });
  }

  return (
    <div className="p-4 md:p-7 flex flex-col gap-5">
      <div className="flex flex-wrap items-center gap-3">
        <input
          value={store.search}
          onChange={(e) => store.searchByName(e.target.value)}
          className="h-9 px-3 border border-slate-200 rounded-lg text-sm outline-none focus:border-indigo-500 flex-1 min-w-0 max-w-xs placeholder:text-slate-400"
          placeholder={t("role.searchPlaceholder")}
        />
        {auth.can("ROLE_CREATE") && (
          <AppButton onClick={openAdd} className="ml-auto">
            + {t("role.addTitle")}
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
              {t("role.name")}
            </th>
            <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wide">
              {t("role.code")}
            </th>
            <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wide">
              {t("common.description")}
            </th>
            <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wide">
              {t("role.permissions")}
            </th>
            <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wide">
              {t("role.isDefault")}
            </th>
            <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wide">
              {t("common.actions")}
            </th>
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
                {t("role.noData")}
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
                <td className="px-4 py-3">
                  <span className="font-mono text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded">
                    {item.code}
                  </span>
                </td>
                <td className="px-4 py-3 text-slate-500 max-w-[200px] truncate">
                  {item.description || "—"}
                </td>
                <td className="px-4 py-3">
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-700">
                    {t("role.permissionsSelected", {
                      n: item.permissions?.length ?? 0,
                    })}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${item.isDefault ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-400"}`}
                  >
                    {item.isDefault ? t("common.yes") : t("common.no")}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    {auth.can("ROLE_UPDATE") && (
                      <AppButton
                        variant="edit"
                        size="sm"
                        onClick={() => openEdit(item)}
                      >
                        {t("common.edit")}
                      </AppButton>
                    )}
                    {auth.can("ROLE_DELETE") && (
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

      <RoleFormModal
        show={showModal}
        editingId={editingId}
        saving={saving}
        form={form}
        errors={errors}
        allPermissions={store.allPermissions}
        onClose={() => setShowModal(false)}
        onSave={save}
        onChange={setForm}
        onClearError={clearError}
      />
    </div>
  );
}

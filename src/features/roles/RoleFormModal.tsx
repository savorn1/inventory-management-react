import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { AppModal, AppButton } from "@/components/ui";
import type { CreateRoleDTO, PermissionDTO } from "@/api/roles.api";

interface Props {
  show: boolean;
  editingId: number | null;
  saving: boolean;
  form: CreateRoleDTO;
  errors: Record<string, string>;
  allPermissions: PermissionDTO[];
  onClose: () => void;
  onSave: () => void;
  onChange: (form: CreateRoleDTO) => void;
  onClearError: (key: string) => void;
}

export function RoleFormModal({
  show,
  editingId,
  saving,
  form,
  errors,
  allPermissions,
  onClose,
  onSave,
  onChange,
  onClearError,
}: Props) {
  const { t } = useTranslation();

  const permissionsByModule = useMemo(() => {
    const map = new Map<string, PermissionDTO[]>();
    for (const p of allPermissions) {
      if (!map.has(p.module)) map.set(p.module, []);
      map.get(p.module)!.push(p);
    }
    return map;
  }, [allPermissions]);

  function isModuleAllChecked(module: string) {
    const perms = permissionsByModule.get(module) ?? [];
    return perms.every((p) => form.permissionIds.includes(p.id));
  }

  function togglePermission(id: number) {
    onChange({
      ...form,
      permissionIds: form.permissionIds.includes(id)
        ? form.permissionIds.filter((p) => p !== id)
        : [...form.permissionIds, id],
    });
  }

  function toggleModule(module: string) {
    const perms = permissionsByModule.get(module) ?? [];
    if (isModuleAllChecked(module)) {
      onChange({
        ...form,
        permissionIds: form.permissionIds.filter(
          (id) => !perms.some((p) => p.id === id),
        ),
      });
    } else {
      const toAdd = perms
        .map((p) => p.id)
        .filter((id) => !form.permissionIds.includes(id));
      onChange({ ...form, permissionIds: [...form.permissionIds, ...toAdd] });
    }
  }

  return (
    <AppModal
      show={show}
      title={editingId ? t("role.editTitle") : t("role.addTitle")}
      onClose={onClose}
    >
      <form
        className="flex flex-col gap-4"
        onSubmit={(e) => {
          e.preventDefault();
          onSave();
        }}
      >
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-600">
              {t("role.name")} *
            </label>
            <input
              value={form.name}
              onChange={(e) => {
                onChange({ ...form, name: e.target.value });
                onClearError("name");
              }}
              className={`px-3 py-2 border rounded-lg text-sm outline-none ${errors.name ? "border-red-400 focus:border-red-400" : "border-slate-200 focus:border-indigo-500"}`}
              placeholder={t("role.namePlaceholder")}
            />
            {errors.name && (
              <p className="text-xs text-red-500">{errors.name}</p>
            )}
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-600">
              {t("role.code")} *
            </label>
            <input
              value={form.code}
              onChange={(e) => {
                onChange({ ...form, code: e.target.value });
                onClearError("code");
              }}
              className={`px-3 py-2 border rounded-lg text-sm outline-none font-mono ${errors.code ? "border-red-400 focus:border-red-400" : "border-slate-200 focus:border-indigo-500"}`}
              placeholder={t("role.codePlaceholder")}
            />
            {errors.code && (
              <p className="text-xs text-red-500">{errors.code}</p>
            )}
          </div>
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-slate-600">
            {t("role.description")}
          </label>
          <input
            value={form.description}
            onChange={(e) => onChange({ ...form, description: e.target.value })}
            className="px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:border-indigo-500"
            placeholder={t("role.descriptionPlaceholder")}
          />
        </div>
        <label className="flex items-center gap-2.5 cursor-pointer select-none">
          <input
            type="checkbox"
            className="w-4 h-4 accent-indigo-600"
            checked={form.isDefault}
            onChange={(e) => onChange({ ...form, isDefault: e.target.checked })}
          />
          <span className="text-sm text-slate-700">{t("role.isDefault")}</span>
        </label>

        <div className="flex flex-col gap-2">
          <label className="text-xs font-semibold text-slate-600">
            {t("role.permissions")}
          </label>
          <div className="border border-slate-200 rounded-lg overflow-y-auto max-h-64 divide-y divide-slate-100">
            {Array.from(permissionsByModule.entries()).map(
              ([module, perms]) => (
                <div key={module} className="p-3">
                  <label className="flex items-center gap-2 cursor-pointer mb-2">
                    <input
                      type="checkbox"
                      className="w-4 h-4 accent-indigo-600"
                      checked={isModuleAllChecked(module)}
                      onChange={() => toggleModule(module)}
                    />
                    <span className="text-xs font-bold text-slate-700 uppercase tracking-wide">
                      {module}
                    </span>
                  </label>
                  <div className="grid grid-cols-2 gap-1 pl-6">
                    {perms.map((perm) => (
                      <label
                        key={perm.id}
                        className="flex items-center gap-1.5 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          className="w-3.5 h-3.5 accent-indigo-600"
                          checked={form.permissionIds.includes(perm.id)}
                          onChange={() => togglePermission(perm.id)}
                        />
                        <span className="text-xs text-slate-600">
                          {perm.action}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              ),
            )}
          </div>
          <p className="text-xs text-slate-400">
            {t("role.permissionsSelected", { n: form.permissionIds.length })}
          </p>
        </div>

        <div className="flex justify-end gap-2 mt-1">
          <AppButton variant="cancel" type="button" onClick={onClose}>
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
  );
}

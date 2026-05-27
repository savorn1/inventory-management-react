import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useSystemSettingsStore } from "./store";
import { useAuthStore } from "@/stores/auth";
import { useToast } from "@/hooks/useToast";
import { AppButton } from "@/components/ui";

export function SettingsView() {
  const { t } = useTranslation();
  const toast = useToast();
  const auth = useAuthStore();
  const canUpdate = auth.can("SETTING_UPDATE");

  const sys = useSystemSettingsStore();

  useEffect(() => {
    sys.fetch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Local draft so the user can toggle multiple fields before saving
  const [draft, setDraft] = useState<{ allowOverselling: boolean } | null>(null);

  useEffect(() => {
    if (sys.settings && draft === null) {
      setDraft({ allowOverselling: sys.settings.allowOverselling });
    }
  }, [sys.settings, draft]);

  const isDirty =
    draft !== null &&
    sys.settings !== null &&
    draft.allowOverselling !== sys.settings.allowOverselling;

  async function handleSave() {
    if (!draft) return;
    try {
      await sys.update(draft);
      toast.add(t("settings.sysSaved"), "success");
    } catch {
      toast.add(sys.error ?? t("settings.sysSaveFailed"), "error");
    }
  }

  return (
    <div className="p-4 md:p-7 flex flex-col gap-6 max-w-2xl">
      {/* Page header */}
      <div>
        <h1 className="text-xl font-bold text-slate-800">
          {t("settings.title")}
        </h1>
        <p className="text-sm text-slate-500 mt-1">{t("settings.subtitle")}</p>
      </div>

      {/* System settings card */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2">
          <svg
            className="w-4 h-4 text-indigo-500"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <h2 className="text-sm font-semibold text-slate-700">
            {t("settings.systemSettings")}
          </h2>
        </div>

        <div className="px-5 py-5 flex flex-col gap-5">
          {sys.loading ? (
            <p className="text-sm text-slate-400">{t("common.loading")}</p>
          ) : sys.error && !sys.settings ? (
            <p className="text-sm text-red-500">{sys.error}</p>
          ) : draft !== null ? (
            <>
              {/* Allow Overselling row */}
              <div className="flex items-start justify-between gap-4">
                <div className="flex flex-col gap-0.5">
                  <span className="text-sm font-medium text-slate-700">
                    {t("settings.allowOverselling")}
                  </span>
                  <span className="text-xs text-slate-400">
                    {t("settings.allowOversellingHint")}
                  </span>
                </div>

                {/* Toggle switch */}
                <button
                  type="button"
                  role="switch"
                  aria-checked={draft.allowOverselling}
                  disabled={!canUpdate || sys.saving}
                  onClick={() =>
                    setDraft((d) =>
                      d ? { ...d, allowOverselling: !d.allowOverselling } : d,
                    )
                  }
                  className={`relative shrink-0 w-11 h-6 rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed ${
                    draft.allowOverselling ? "bg-indigo-600" : "bg-slate-200"
                  }`}
                >
                  <span
                    className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200 ${
                      draft.allowOverselling ? "translate-x-5" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>

              {/* Save / permission row */}
              <div className="pt-1 border-t border-slate-100">
                {canUpdate ? (
                  <div className="flex items-center gap-3">
                    <AppButton
                      variant="primary"
                      size="sm"
                      onClick={handleSave}
                      disabled={!isDirty || sys.saving}
                    >
                      {sys.saving ? t("common.saving") : t("common.save")}
                    </AppButton>
                    {sys.error && (
                      <span className="text-xs text-red-500">{sys.error}</span>
                    )}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 italic">
                    {t("settings.noPermission")}
                  </p>
                )}
              </div>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}

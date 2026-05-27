import { create } from "zustand";
import { settingsApi } from "@/api/settings.api";
import type { SystemSettingDTO } from "@/api/settings.api";

interface SystemSettingsState {
  /** null = not yet loaded */
  settings: SystemSettingDTO | null;
  loading: boolean;
  saving: boolean;
  error: string | null;
  fetch: () => Promise<void>;
  update: (dto: SystemSettingDTO) => Promise<void>;
}

export const useSystemSettingsStore = create<SystemSettingsState>((set, get) => ({
  settings: null,
  loading: false,
  saving: false,
  error: null,

  async fetch() {
    if (get().loading) return;
    set({ loading: true, error: null });
    try {
      const res = await settingsApi.get();
      set({ settings: res.data, loading: false });
    } catch (e) {
      set({
        loading: false,
        error: e instanceof Error ? e.message : "Failed to load settings",
      });
    }
  },

  async update(dto: SystemSettingDTO) {
    set({ saving: true, error: null });
    try {
      const res = await settingsApi.update(dto);
      set({ settings: res.data, saving: false });
    } catch (e) {
      set({
        saving: false,
        error: e instanceof Error ? e.message : "Failed to save settings",
      });
      throw e; // re-throw so the view can show a toast
    }
  },
}));

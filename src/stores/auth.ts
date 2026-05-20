import { create } from "zustand";
import { authApi } from "@/api/auth.api";
import type { UserProfile } from "@/api/auth.api";

const TOKEN_KEY = "access_token";

interface AuthState {
  token: string | null;
  profile: UserProfile | null;
  isAuthenticated: boolean;
  can: (permission: string) => boolean;
  canAny: (...perms: string[]) => boolean;
  login: (name: string, password: string) => Promise<void>;
  fetchProfile: () => Promise<void>;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  token: localStorage.getItem(TOKEN_KEY),
  profile: null,
  get isAuthenticated() {
    return !!get().token;
  },

  can(permission: string) {
    return get().profile?.permissions.includes(permission) ?? false;
  },

  canAny(...perms: string[]) {
    return perms.some((p) => get().can(p));
  },

  async login(name: string, password: string) {
    const res = await authApi.login({ name, password });
    const token = res.data.accessToken;
    localStorage.setItem(TOKEN_KEY, token);
    set({ token });
    await get().fetchProfile();
  },

  async fetchProfile() {
    if (!get().token) return;
    try {
      const res = await authApi.profile();
      set({ profile: res.data });
    } catch {
      await get().logout();
    }
  },

  async logout() {
    try {
      if (get().token) await authApi.logout();
    } catch {
      /* ignore */
    }
    localStorage.removeItem(TOKEN_KEY);
    set({ token: null, profile: null });
  },
}));

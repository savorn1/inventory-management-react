# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev       # start dev server (default port 5174)
npm run build     # type-check + production build
npm run lint      # ESLint
npm run preview   # preview production build
```

No test runner is configured. There are no test files.

## Environment

Copy `.env.example` to `.env`. Two variables:

```
VITE_PORT=5174
VITE_API_URL=http://localhost:8083   # Spring Boot backend
```

The Vite dev server proxies all `/api/*` requests to `VITE_API_URL`, so `http.get('api/brand')` hits the backend without CORS issues.

## Architecture

**Stack:** React 19 + TypeScript + Vite + Tailwind CSS v4 + Zustand + React Router v7 + i18next. The React Compiler is enabled via Babel (`babel-plugin-react-compiler`).

**Path alias:** `@/` maps to `src/`.

### Request layer — `src/api/`

`http.ts` is the only fetch wrapper. It reads `access_token` from localStorage, attaches `Authorization: Bearer`, logs requests in dev, and redirects to `/login` on 401. All API modules (`brands.api.ts`, `products.api.ts`, etc.) call `http.get/post/put/patch/delete`. Response shapes are typed via `ApiResponse<T>` and `PageResponse<T>` from `src/api/types.ts`.

`src/api/index.ts` re-exports all API modules for convenience.

### State — Zustand stores

Two kinds of store:

1. **Global stores** (`src/stores/`): `useAuthStore` (JWT token + profile + `can(permission)` / `canAny(...perms)` helpers), `useConfirmStore` (global delete-confirmation modal state).

2. **Feature stores** (`src/features/<name>/store.ts`): one per resource (brands, categories, clients, orders, products, roles, suppliers, users). Each store owns pagination state (`page`, `size`, `totalCount`, etc.), a `fetchAll(p, s, q)` action, and mutating actions (`add`, `remove`, `update`). After every mutation the store re-fetches to keep the list in sync.

### Feature modules — `src/features/<name>/`

Each feature folder contains:
- `<Name>View.tsx` — the page component (table, search bar, modals)
- `store.ts` — Zustand store for that resource

The `useCrud` hook (`src/hooks/useCrud.ts`) encapsulates the add/edit/delete modal lifecycle shared by most feature views: it manages `showModal`, `editingId`, `form`, `errors`, and wires up `useToast` and `useConfirmStore`.

### Routing — `src/router/index.tsx`

`App.tsx` is the authenticated shell (sidebar + header + `<Outlet>`). `App` redirects to `/login` if `access_token` is absent and calls `auth.fetchProfile()` on navigation if the profile isn't loaded yet. All feature routes are children of `/`.

### UI components — `src/components/ui/`

Shared primitives: `AppTable`, `AppPagination`, `AppModal`, `AppConfirmModal`, `AppToast`, `AppButton`, `AppBadge`. `AppToast` and `AppConfirmModal` are mounted once at the `App` level and driven by Zustand stores.

### i18n — `src/i18n/`

Three locales: `en`, `zh`, `kh` (Khmer). Active locale is persisted in `localStorage` under `locale`. Switch by calling `i18n.changeLanguage(code)` and saving to localStorage.

## Backend

The backend is a separate Spring Boot project at `../java/library/student`. It exposes REST endpoints under `api/` (auth, brands, categories, clients, files, orders, permissions, products, roles, students, suppliers, sys-user). All endpoints except `api/auth/login` require a JWT Bearer token and use permission-based authorization (e.g. `BRAND_READ`, `PRODUCT_CREATE`). The frontend checks permissions via `auth.can('PERMISSION_NAME')` before rendering action buttons.

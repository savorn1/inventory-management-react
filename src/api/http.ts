const TOKEN_KEY = "access_token";
const REFRESH_KEY = "refresh_token";

function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

function getRefreshToken(): string | null {
  return localStorage.getItem(REFRESH_KEY);
}

function authMiddleware(headers: Record<string, string>): void {
  const token = getToken();
  if (token) headers["Authorization"] = `Bearer ${token}`;
}

function clearAuthAndRedirect(): never {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_KEY);
  window.location.href = "/login";
  throw new Error("Unauthorized");
}

// Logger middleware — logs request and response timing in dev
function logRequest(method: string, path: string): number {
  if (import.meta.env.DEV) {
    console.log(`→ ${method} /${path}`);
  }
  return Date.now();
}

function logResponse(
  method: string,
  path: string,
  status: number,
  startedAt: number,
): void {
  if (import.meta.env.DEV) {
    const ms = Date.now() - startedAt;
    const icon = status >= 400 ? "✗" : "←";
    console.log(`${icon} ${status} ${method} /${path} (${ms}ms)`);
  }
}

function logError(method: string, path: string, message: string): void {
  if (import.meta.env.DEV) {
    console.error(`✗ ${method} /${path} —`, message);
  }
}

// --- Refresh token queue ---
// All requests that hit 401 while a refresh is in flight queue here and
// retry automatically once the new access token is issued.
let isRefreshing = false;
let pendingQueue: Array<{
  resolve: (token: string) => void;
  reject: (err: Error) => void;
}> = [];

async function refreshAccessToken(): Promise<string> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) throw new Error("No refresh token");

  const res = await fetch("/api/auth/refresh", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refreshToken }),
  });

  if (!res.ok) throw new Error("Refresh failed");

  const data = await res.json();
  const newAccess: string | undefined = data.data?.accessToken;
  if (!newAccess) throw new Error("No access token in refresh response");

  localStorage.setItem(TOKEN_KEY, newAccess);
  if (data.data?.refreshToken) {
    localStorage.setItem(REFRESH_KEY, data.data.refreshToken);
  }
  return newAccess;
}

// Returns a new access token. If refresh is already in progress, queues and
// waits for the in-flight refresh to resolve rather than firing a second one.
function getNewToken(): Promise<string> {
  if (!isRefreshing) {
    isRefreshing = true;
    return refreshAccessToken()
      .then((token) => {
        pendingQueue.forEach((p) => p.resolve(token));
        pendingQueue = [];
        return token;
      })
      .catch((err: Error) => {
        pendingQueue.forEach((p) => p.reject(err));
        pendingQueue = [];
        throw err;
      })
      .finally(() => {
        isRefreshing = false;
      });
  }

  return new Promise<string>((resolve, reject) => {
    pendingQueue.push({ resolve, reject });
  });
}

async function handleUnauthorized<T>(
  method: string,
  path: string,
  buildFetch: (headers: Record<string, string>) => Promise<Response>,
): Promise<T> {
  let newToken: string;
  try {
    newToken = await getNewToken();
  } catch {
    return clearAuthAndRedirect();
  }

  const retryHeaders: Record<string, string> = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${newToken}`,
  };
  const retryRes = await buildFetch(retryHeaders);
  logResponse(method, path, retryRes.status, Date.now());

  if (retryRes.status === 401) return clearAuthAndRedirect();
  if (!retryRes.ok) {
    let message = `HTTP ${retryRes.status}`;
    try {
      const err = await retryRes.json();
      message = err.message || message;
    } catch { /* empty */ }
    logError(method, path, message);
    throw new Error(message);
  }
  return retryRes.json();
}

async function request<T>(
  method: string,
  path: string,
  body?: unknown,
): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  authMiddleware(headers);
  const startedAt = logRequest(method, path);

  const buildFetch = (h: Record<string, string>) =>
    fetch(`/${path}`, {
      method,
      headers: h,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });

  const res = await buildFetch(headers);
  logResponse(method, path, res.status, startedAt);

  if (res.status === 401) {
    return handleUnauthorized<T>(method, path, buildFetch);
  }

  if (!res.ok) {
    let message = `HTTP ${res.status}`;
    try {
      const err = await res.json();
      message = err.message || message;
    } catch {
      /* empty */
    }
    logError(method, path, message);
    throw new Error(message);
  }

  return res.json();
}

async function requestFile<T>(
  method: string,
  path: string,
  body: FormData,
): Promise<T> {
  const headers: Record<string, string> = {};
  authMiddleware(headers);
  const startedAt = logRequest(method, path);

  const buildFetch = (h: Record<string, string>) =>
    fetch(`/${path}`, { method, headers: h, body });

  const res = await buildFetch(headers);
  logResponse(method, path, res.status, startedAt);

  if (res.status === 401) {
    // For file requests the retry headers must not include Content-Type
    // (the browser sets it with the correct multipart boundary).
    return handleUnauthorized<T>(method, path, (h) => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { "Content-Type": _, ...rest } = h;
      return fetch(`/${path}`, { method, headers: rest, body });
    });
  }

  if (!res.ok) {
    let message = `HTTP ${res.status}`;
    try {
      const err = await res.json();
      message = err.message || message;
    } catch {
      /* empty */
    }
    logError(method, path, message);
    throw new Error(message);
  }

  return res.json();
}

export const http = {
  get: <T>(path: string) => request<T>("GET", path),
  post: <T>(path: string, body: unknown) => request<T>("POST", path, body),
  put: <T>(path: string, body: unknown) => request<T>("PUT", path, body),
  patch: <T>(path: string, body: unknown) => request<T>("PATCH", path, body),
  delete: <T>(path: string, body?: unknown) => request<T>("DELETE", path, body),
  postFile: <T>(path: string, body: FormData) =>
    requestFile<T>("POST", path, body),
};

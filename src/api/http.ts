function getToken(): string | null {
  return localStorage.getItem('access_token')
}

// Auth middleware — attaches Bearer token, redirects on 401
function authMiddleware(headers: Record<string, string>): void {
  const token = getToken()
  if (token) headers['Authorization'] = `Bearer ${token}`
}

function handleAuthError(): never {
  localStorage.removeItem('access_token')
  window.location.href = '/login'
  throw new Error('Unauthorized')
}

// Logger middleware — logs request and response timing in dev
function logRequest(method: string, path: string): number {
  if (import.meta.env.DEV) {
    console.log(`→ ${method} /${path}`)
  }
  return Date.now()
}

function logResponse(method: string, path: string, status: number, startedAt: number): void {
  if (import.meta.env.DEV) {
    const ms = Date.now() - startedAt
    const icon = status >= 400 ? '✗' : '←'
    console.log(`${icon} ${status} ${method} /${path} (${ms}ms)`)
  }
}

function logError(method: string, path: string, message: string): void {
  if (import.meta.env.DEV) {
    console.error(`✗ ${method} /${path} —`, message)
  }
}

async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }

  authMiddleware(headers)
  const startedAt = logRequest(method, path)

  const res = await fetch(`/${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })

  logResponse(method, path, res.status, startedAt)

  if (res.status === 401) return handleAuthError()

  if (!res.ok) {
    let message = `HTTP ${res.status}`
    try {
      const err = await res.json()
      message = err.message || message
    } catch { /* empty */ }
    logError(method, path, message)
    throw new Error(message)
  }

  return res.json()
}

async function requestFile<T>(method: string, path: string, body: FormData): Promise<T> {
  const headers: Record<string, string> = {}
  authMiddleware(headers)
  const startedAt = logRequest(method, path)

  const res = await fetch(`/${path}`, { method, headers, body })
  logResponse(method, path, res.status, startedAt)

  if (res.status === 401) return handleAuthError()

  if (!res.ok) {
    let message = `HTTP ${res.status}`
    try {
      const err = await res.json()
      message = err.message || message
    } catch { /* empty */ }
    logError(method, path, message)
    throw new Error(message)
  }

  return res.json()
}

export const http = {
  get:      <T>(path: string)                       => request<T>('GET',    path),
  post:     <T>(path: string, body: unknown)        => request<T>('POST',   path, body),
  put:      <T>(path: string, body: unknown)        => request<T>('PUT',    path, body),
  delete:   <T>(path: string, body?: unknown)       => request<T>('DELETE', path, body),
  postFile: <T>(path: string, body: FormData)       => requestFile<T>('POST', path, body),
}

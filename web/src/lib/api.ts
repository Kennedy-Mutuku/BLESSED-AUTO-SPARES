const BASE = (import.meta.env.VITE_API_URL ?? '').replace(/\/$/, '')

export function getToken(): string | null {
  return localStorage.getItem('authToken')
}

export function saveAuth(token: string, user: { id: string; shopName: string; email: string }) {
  localStorage.setItem('authToken', token)
  localStorage.setItem('authUser',  JSON.stringify(user))
}

export function clearAuth() {
  localStorage.removeItem('authToken')
  localStorage.removeItem('authUser')
}

export function getUser(): { id: string; shopName: string; email: string } | null {
  const raw = localStorage.getItem('authUser')
  return raw ? JSON.parse(raw) : null
}

async function request<T>(method: string, path: string, body?: unknown, authed = true): Promise<T> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (authed) {
    const token = getToken()
    if (token) headers['Authorization'] = `Bearer ${token}`
  }
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body != null ? JSON.stringify(body) : undefined,
  })
  if (res.status === 401) {
    clearAuth()
    window.location.href = '/login'
    throw new Error('Session expired')
  }
  if (!res.ok) {
    const payload = await res.json().catch(() => ({ error: res.statusText }))
    throw new Error(payload.error ?? `HTTP ${res.status}`)
  }
  return res.json() as Promise<T>
}

export const api = {
  get:    <T>(path: string, authed = true) => request<T>('GET',    path, undefined, authed),
  post:   <T>(path: string, body: unknown, authed = true) => request<T>('POST',   path, body, authed),
  put:    <T>(path: string, body: unknown) => request<T>('PUT',    path, body),
  delete: <T>(path: string)               => request<T>('DELETE', path),
}

import { db } from '@/db/database'

const BASE = (import.meta.env.VITE_API_URL ?? 'http://localhost:5000').replace(/\/$/, '')

async function getToken(): Promise<string | null> {
  const row = await db.settings.get('authToken')
  return row?.value ?? null
}

async function request<T>(
  method: string,
  path: string,
  body?: unknown,
  authed = true,
): Promise<T> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (authed) {
    const token = await getToken()
    if (token) headers['Authorization'] = `Bearer ${token}`
  }
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body != null ? JSON.stringify(body) : undefined,
  })
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

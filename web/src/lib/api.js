const BASE = (import.meta.env.VITE_API_URL ?? '').replace(/\/$/, '');
export function getToken() {
    return localStorage.getItem('authToken');
}
export function saveAuth(token, user) {
    localStorage.setItem('authToken', token);
    localStorage.setItem('authUser', JSON.stringify(user));
}
export function clearAuth() {
    localStorage.removeItem('authToken');
    localStorage.removeItem('authUser');
}
export function getUser() {
    const raw = localStorage.getItem('authUser');
    return raw ? JSON.parse(raw) : null;
}
async function request(method, path, body, authed = true) {
    const headers = { 'Content-Type': 'application/json' };
    if (authed) {
        const token = getToken();
        if (token)
            headers['Authorization'] = `Bearer ${token}`;
    }
    const res = await fetch(`${BASE}${path}`, {
        method,
        headers,
        body: body != null ? JSON.stringify(body) : undefined,
    });
    if (res.status === 401) {
        clearAuth();
        window.location.href = '/login';
        throw new Error('Session expired');
    }
    if (!res.ok) {
        const payload = await res.json().catch(() => ({ error: res.statusText }));
        throw new Error(payload.error ?? `HTTP ${res.status}`);
    }
    return res.json();
}
export const api = {
    get: (path, authed = true) => request('GET', path, undefined, authed),
    post: (path, body, authed = true) => request('POST', path, body, authed),
    put: (path, body) => request('PUT', path, body),
    delete: (path) => request('DELETE', path),
};

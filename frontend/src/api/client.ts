import type { AuthResponse } from './types';

/**
 * API client.
 *  - The short-lived access token lives ONLY in memory (never localStorage), so XSS cannot steal a long-lived credential.
 *  - The long-lived refresh token is an httpOnly cookie managed by the browser/server.
 *  - On a 401 the client refreshes once (shared across concurrent requests) and retries the original request.
 */

export class ApiError extends Error {
  constructor(public status: number, public code: string, message: string) {
    super(message);
  }
}

type Listener = (auth: AuthResponse | null) => void;

let accessToken: string | null = null;
let refreshing: Promise<AuthResponse | null> | null = null;
const listeners = new Set<Listener>();

export function getAccessToken() {
  return accessToken;
}

export function setAccessToken(token: string | null) {
  accessToken = token;
}

/** Subscribe to session changes (login, silent refresh, forced logout). */
export function onSessionChange(l: Listener) {
  listeners.add(l);
  return () => {
    listeners.delete(l);
  };
}

function emit(auth: AuthResponse | null) {
  listeners.forEach((l) => l(auth));
}

async function parse<T>(res: Response): Promise<T> {
  const text = await res.text();
  const json = text ? JSON.parse(text) : null;
  if (!res.ok || (json && json.success === false)) {
    const err = json?.error;
    throw new ApiError(res.status, err?.code ?? 'ERROR', err?.message ?? `Request failed (${res.status})`);
  }
  return (json ? json.data : undefined) as T;
}

/** Exchange the refresh cookie for a new access token. Concurrent callers share one request. */
export function refreshSession(): Promise<AuthResponse | null> {
  if (!refreshing) {
    refreshing = fetch('/api/v1/auth/refresh', { method: 'POST', credentials: 'include' })
      .then(async (res) => {
        if (!res.ok) throw new Error('refresh failed');
        const data = await parse<AuthResponse>(res);
        accessToken = data.accessToken;
        emit(data);
        return data;
      })
      .catch(() => {
        accessToken = null;
        emit(null);
        return null;
      })
      .finally(() => {
        refreshing = null;
      });
  }
  return refreshing;
}

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
  /** Skip the refresh-and-retry behaviour (used by the auth endpoints themselves). */
  noRetry?: boolean;
}

export async function api<T>(path: string, opts: RequestOptions = {}): Promise<T> {
  const doFetch = () =>
    fetch(`/api/v1${path}`, {
      method: opts.method ?? 'GET',
      credentials: 'include',
      headers: {
        ...(opts.body !== undefined ? { 'Content-Type': 'application/json' } : {}),
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      },
      body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
    });

  let res = await doFetch();
  if (res.status === 401 && !opts.noRetry && accessToken !== null) {
    const refreshed = await refreshSession();
    if (refreshed) res = await doFetch();
  }
  return parse<T>(res);
}

// ── auth helpers ──

export async function login(email: string, password: string): Promise<AuthResponse> {
  const data = await api<AuthResponse>('/auth/login', { method: 'POST', body: { email, password }, noRetry: true });
  accessToken = data.accessToken;
  emit(data);
  return data;
}

export async function register(body: { name: string; email: string; phone?: string; password: string }): Promise<AuthResponse> {
  const data = await api<AuthResponse>('/auth/register', { method: 'POST', body, noRetry: true });
  accessToken = data.accessToken;
  emit(data);
  return data;
}

export async function logout(): Promise<void> {
  try {
    await api('/auth/logout', { method: 'POST', noRetry: true });
  } finally {
    accessToken = null;
    emit(null);
  }
}

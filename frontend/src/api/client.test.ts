import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiError, api, getAccessToken, login, onSessionChange, setAccessToken } from './client';

const user = { id: 1, name: 'A', email: 'a@b.c', role: 'CUSTOMER' };
const auth = (token: string) => ({ accessToken: token, expiresInSeconds: 900, user });
const ok = (data: unknown, status = 200) => new Response(JSON.stringify({ success: true, data }), { status });
const unauthorized = () => new Response(JSON.stringify({ success: false, error: { code: 'UNAUTHORIZED', message: 'nope' } }), { status: 401 });

beforeEach(() => setAccessToken(null));

describe('api client', () => {
  it('sends the bearer token and unwraps the data envelope', async () => {
    setAccessToken('tok1');
    const f = vi.fn().mockResolvedValue(ok({ hello: 'world' }));
    vi.stubGlobal('fetch', f);
    expect(await api('/ping')).toEqual({ hello: 'world' });
    expect(f.mock.calls[0][1].headers.Authorization).toBe('Bearer tok1');
  });

  it('turns error envelopes into ApiError with the server code and message', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({ success: false, error: { code: 'CONFLICT', message: 'Sold out' } }), { status: 409 })));
    await expect(api('/x')).rejects.toMatchObject({ status: 409, code: 'CONFLICT', message: 'Sold out' });
    await expect(api('/x')).rejects.toBeInstanceOf(ApiError);
  });

  it('refreshes once on 401 and retries the original request with the new token', async () => {
    setAccessToken('expired');
    const f = vi
      .fn()
      .mockResolvedValueOnce(unauthorized()) // original call
      .mockResolvedValueOnce(ok(auth('fresh'))) // refresh
      .mockResolvedValueOnce(ok({ done: true })); // retry
    vi.stubGlobal('fetch', f);
    expect(await api('/orders/me')).toEqual({ done: true });
    expect(f.mock.calls[1][0]).toBe('/api/v1/auth/refresh');
    expect(f.mock.calls[2][1].headers.Authorization).toBe('Bearer fresh');
    expect(getAccessToken()).toBe('fresh');
  });

  it('shares a single refresh between concurrent requests', async () => {
    setAccessToken('expired');
    let refreshCalls = 0;
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string, init?: RequestInit) => {
        if (url === '/api/v1/auth/refresh') {
          refreshCalls++;
          return ok(auth('fresh'));
        }
        const bearer = (init?.headers as Record<string, string>).Authorization;
        return bearer === 'Bearer fresh' ? ok({ ok: true }) : unauthorized();
      }),
    );
    await Promise.all([api('/a'), api('/b'), api('/c')]);
    expect(refreshCalls).toBe(1);
  });

  it('signs the user out (emits null) when the refresh fails', async () => {
    setAccessToken('expired');
    const events: unknown[] = [];
    const off = onSessionChange((a) => events.push(a));
    vi.stubGlobal('fetch', vi.fn(async (url: string) => (url === '/api/v1/auth/refresh' ? unauthorized() : unauthorized())));
    await expect(api('/orders/me')).rejects.toBeInstanceOf(ApiError);
    expect(events).toContain(null);
    expect(getAccessToken()).toBeNull();
    off();
  });

  it('keeps the access token in memory only, never in web storage', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(ok(auth('secret-token'))));
    await login('a@b.c', 'password1');
    expect(getAccessToken()).toBe('secret-token');
    expect(JSON.stringify({ ...localStorage })).not.toContain('secret-token');
    expect(JSON.stringify({ ...sessionStorage })).not.toContain('secret-token');
  });

  it('does not try to refresh when logged out (no token) and gets a 401', async () => {
    const f = vi.fn().mockResolvedValue(unauthorized());
    vi.stubGlobal('fetch', f);
    await expect(api('/orders/me')).rejects.toMatchObject({ status: 401 });
    expect(f).toHaveBeenCalledTimes(1);
  });
});

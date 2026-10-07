import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render } from '@testing-library/react';
import type { ReactElement } from 'react';
import { MemoryRouter } from 'react-router-dom';
import { AuthProvider } from '../auth/AuthContext';
import { CartProvider } from '../cart/CartContext';

/** Build a fetch mock: routes are matched by "METHOD /path" (path without the /api/v1 prefix). */
export function mockApi(routes: Record<string, (body?: unknown) => { status?: number; data?: unknown; error?: { code: string; message: string } }>) {
  const fn = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input).replace(/^\/api\/v1/, '');
    const key = `${init?.method ?? 'GET'} ${url}`;
    const handler = routes[key];
    if (!handler) return new Response(JSON.stringify({ success: false, error: { code: 'NOT_MOCKED', message: `no mock for ${key}` } }), { status: 500 });
    const r = handler(init?.body ? JSON.parse(String(init.body)) : undefined);
    const status = r.status ?? 200;
    const body = r.error ? { success: false, error: r.error } : { success: true, data: r.data };
    return new Response(JSON.stringify(body), { status });
  });
  vi.stubGlobal('fetch', fn);
  return fn;
}

export function renderApp(ui: ReactElement, route = '/') {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter initialEntries={[route]}>
        <AuthProvider>
          <CartProvider>{ui}</CartProvider>
        </AuthProvider>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

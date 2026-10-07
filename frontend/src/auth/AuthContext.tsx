import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import * as client from '../api/client';
import type { AuthResponse, User } from '../api/types';

interface AuthState {
  user: User | null;
  /** True until the first silent-refresh attempt has finished, so guards don't flash the login page. */
  loading: boolean;
  login: (email: string, password: string) => Promise<User>;
  register: (body: { name: string; email: string; phone?: string; password: string }) => Promise<User>;
  logout: () => Promise<void>;
}

const Ctx = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const off = client.onSessionChange((a: AuthResponse | null) => setUser(a ? a.user : null));
    // Restore the session from the httpOnly refresh cookie (if any).
    client.refreshSession().finally(() => setLoading(false));
    return off;
  }, []);

  const login = useCallback(async (email: string, password: string) => (await client.login(email, password)).user, []);
  const register = useCallback(async (body: { name: string; email: string; phone?: string; password: string }) => (await client.register(body)).user, []);
  const logout = useCallback(() => client.logout(), []);

  const value = useMemo(() => ({ user, loading, login, register, logout }), [user, loading, login, register, logout]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAuth(): AuthState {
  const v = useContext(Ctx);
  if (!v) throw new Error('useAuth must be used inside <AuthProvider>');
  return v;
}

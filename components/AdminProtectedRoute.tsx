'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useCart } from '@/lib/cartContext';
import { Loader2, ShieldAlert } from 'lucide-react';

interface AdminProtectedRouteProps {
  children: React.ReactNode;
}

/**
 * AdminProtectedRoute — client-side guard for the admin dashboard.
 *
 * SECURITY LAYERS:
 * 1. Next.js middleware (middleware.ts) handles the primary server-side redirect.
 * 2. This component provides a secondary client-side check to prevent flash
 *    of admin UI to non-admin users during hydration.
 *
 * Role is always sourced from cookies set by the server — never from
 * client-side manipulation.
 */
export default function AdminProtectedRoute({ children }: AdminProtectedRouteProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { currentRole, isAuthenticated } = useCart();

  const [status, setStatus] = useState<'checking' | 'authorized' | 'unauthorized'>('checking');

  useEffect(() => {
    // Read role from server-set cookie (not from React state which hydrates async)
    const cookieRole =
      typeof document !== 'undefined'
        ? document.cookie
            .split('; ')
            .find((row) => row.startsWith('zestora_role='))
            ?.split('=')[1]
        : null;

    const cookieToken =
      typeof document !== 'undefined'
        ? document.cookie
            .split('; ')
            .find((row) => row.startsWith('zestora_token='))
            ?.split('=')[1]
        : null;

    const effectiveRole = cookieRole || currentRole;
    const isLoggedIn = !!cookieToken;

    if (!isLoggedIn) {
      // Not authenticated at all
      router.replace(`/login?redirect=${encodeURIComponent(pathname)}`);
      setStatus('unauthorized');
      return;
    }

    if (effectiveRole !== 'ADMIN' && effectiveRole !== 'SUPER_ADMIN') {
      // Authenticated as non-admin (e.g. CUSTOMER) → redirect to home
      router.replace('/');
      setStatus('unauthorized');
      return;
    }

    // Valid admin session
    setStatus('authorized');
  }, [currentRole, isAuthenticated, pathname, router]);

  if (status === 'checking') {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="bg-white rounded-3xl p-8 max-w-sm w-full text-center border border-slate-100 shadow-xl space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto">
            <Loader2 className="w-7 h-7 animate-spin" />
          </div>
          <div>
            <h3 className="text-base font-black text-slate-900">Verifying Admin Access...</h3>
            <p className="text-xs text-slate-500 mt-1">Checking your role and session credentials.</p>
          </div>
        </div>
      </div>
    );
  }

  if (status === 'unauthorized') {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="bg-white rounded-3xl p-8 max-w-sm w-full text-center border border-slate-100 shadow-xl space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
            <ShieldAlert className="w-7 h-7" />
          </div>
          <div>
            <h3 className="text-base font-black text-slate-900">Access Denied</h3>
            <p className="text-xs text-slate-500 mt-1">You do not have permission to view this page.</p>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

import crypto from 'crypto';

// Signed, expiring session token: base64url(payload).hexHmac
// payload = { sub: userId, role, exp: unix seconds }
// The HMAC covers the payload, so neither the user id nor the role can be forged client-side.

export const SESSION_COOKIE = 'zestora_token';
export const ROLE_HINT_COOKIE = 'zestora_role'; // UI hint only — never trusted by the server
export const SESSION_MAX_AGE = 60 * 60 * 24 * 7;

function secret(): string {
  const s = process.env.SESSION_SECRET;
  if (s && s.length >= 32) return s;
  if (process.env.NODE_ENV === 'production') {
    throw new Error('SESSION_SECRET (min 32 chars) must be set in production');
  }
  return 'dev-only-insecure-session-secret-change-me';
}

export function signSession(userId: string, role: string): string {
  const payload = Buffer.from(
    JSON.stringify({ sub: userId, role, exp: Math.floor(Date.now() / 1000) + SESSION_MAX_AGE })
  ).toString('base64url');
  const sig = crypto.createHmac('sha256', secret()).update(payload).digest('hex');
  return `${payload}.${sig}`;
}

export function verifySession(token: string | undefined | null): { sub: string; role: string } | null {
  if (!token) return null;
  const [payload, sig] = token.split('.');
  if (!payload || !sig) return null;
  const expected = crypto.createHmac('sha256', secret()).update(payload).digest('hex');
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  try {
    const data = JSON.parse(Buffer.from(payload, 'base64url').toString());
    if (typeof data.exp !== 'number' || data.exp < Date.now() / 1000) return null;
    return { sub: data.sub, role: data.role };
  } catch {
    return null;
  }
}

/** Cookie options for the session token: httpOnly so scripts can never read or forge it. */
export const sessionCookieOptions = {
  path: '/',
  httpOnly: true,
  sameSite: 'lax' as const,
  secure: process.env.NODE_ENV === 'production',
  maxAge: SESSION_MAX_AGE,
};

/** Cookie options for the non-sensitive role hint used by the UI for display only. */
export const roleHintCookieOptions = { ...sessionCookieOptions, httpOnly: false };

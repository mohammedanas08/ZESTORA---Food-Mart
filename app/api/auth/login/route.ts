import { NextResponse } from 'next/server';
import { SESSION_COOKIE, ROLE_HINT_COOKIE, signSession, sessionCookieOptions, roleHintCookieOptions } from '@/server/session';
import { zestoraStore } from '@/server/dataStore';
import { verifyPassword, sanitizeUser } from '@/server/passwordUtils';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password } = body;

    // --- Input validation ---
    if (!email || !password) {
      return NextResponse.json(
        { success: false, message: 'Email and password are required.' },
        { status: 400 }
      );
    }

    const emailClean = email.toLowerCase().trim();

    // --- Look up user by email from the authoritative store ---
    const users = zestoraStore.getUsers();
    const matchedUser = users.find((u) => u.email.toLowerCase() === emailClean);

    if (!matchedUser) {
      return NextResponse.json(
        {
          success: false,
          error: 'InvalidCredentials',
          message: 'Incorrect email or password.',
        },
        { status: 401 }
      );
    }

    // --- Verify password against stored hash ---
    const passwordValid = verifyPassword(password, matchedUser.passwordHash || '');
    if (!passwordValid) {
      return NextResponse.json(
        {
          success: false,
          error: 'InvalidCredentials',
          message: 'Incorrect email or password.',
        },
        { status: 401 }
      );
    }

    // --- Role is sourced from the DB record — never from client input ---
    const userRole = matchedUser.role;

    // --- Sanitize: never send passwordHash to the client ---
    const safeUser = sanitizeUser({ ...matchedUser });

    const response = NextResponse.json({
      success: true,
      message: `Welcome back, ${matchedUser.name}!`,
      user: safeUser,
      role: userRole,
    });

    // --- Set HTTP cookies for session (used by middleware and auth helpers) ---
    response.cookies.set(SESSION_COOKIE, signSession(matchedUser.id, userRole), sessionCookieOptions);
    response.cookies.set(ROLE_HINT_COOKIE, userRole, roleHintCookieOptions);

    return response;
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || 'Login failed. Please try again.' },
      { status: 500 }
    );
  }
}

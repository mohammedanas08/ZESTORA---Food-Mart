import { NextResponse } from 'next/server';
import { SESSION_COOKIE, ROLE_HINT_COOKIE, signSession, sessionCookieOptions, roleHintCookieOptions } from '@/server/session';
import { zestoraStore } from '@/server/dataStore';
import { hashPassword, sanitizeUser } from '@/server/passwordUtils';
import { User } from '@/types';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, email, phone, password, confirmPassword } = body;

    // --- Input validation ---
    if (!name || !email || !password) {
      return NextResponse.json(
        { success: false, message: 'Full name, email, and password are required.' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { success: false, message: 'Password must be at least 6 characters.' },
        { status: 400 }
      );
    }

    if (confirmPassword && password !== confirmPassword) {
      return NextResponse.json(
        { success: false, message: 'Passwords do not match.' },
        { status: 400 }
      );
    }

    const emailClean = email.toLowerCase().trim();

    // --- Check for duplicate email ---
    const existingUser = zestoraStore.getUsers().find(
      (u) => u.email.toLowerCase() === emailClean
    );
    if (existingUser) {
      return NextResponse.json(
        { success: false, message: 'An account with this email already exists.' },
        { status: 409 }
      );
    }

    // --- SECURITY: Role is ALWAYS hardcoded to CUSTOMER on registration ---
    // Customers CANNOT self-assign ADMIN role.
    // Admin accounts are created only via seed data or by an existing SUPER_ADMIN.
    const newUser: User = {
      id: `user-cust-${Date.now()}`,
      name: name.trim(),
      email: emailClean,
      phone: phone?.trim() || '',
      role: 'CUSTOMER', // ALWAYS CUSTOMER — never from request body
      passwordHash: hashPassword(password),
      avatar:
        'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
    };

    zestoraStore.addUser(newUser);

    // --- Sanitize before sending to client ---
    const safeUser = sanitizeUser({ ...newUser });

    const response = NextResponse.json({
      success: true,
      message: 'Account created successfully! Welcome to Zestora.',
      user: safeUser,
      role: 'CUSTOMER',
    });

    // --- Set session cookies ---
    response.cookies.set(SESSION_COOKIE, signSession(newUser.id, 'CUSTOMER'), sessionCookieOptions);
    response.cookies.set(ROLE_HINT_COOKIE, 'CUSTOMER', roleHintCookieOptions);

    return response;
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || 'Registration failed. Please try again.' },
      { status: 500 }
    );
  }
}

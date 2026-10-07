import crypto from 'crypto';

/**
 * Password hashing using scrypt (built into Node, no extra dependency).
 * Stored format: scrypt$<saltHex>$<hashHex>
 * When the Spring Boot backend replaces this, use BCrypt there.
 */
export function hashPassword(plaintext: string): string {
  const salt = crypto.randomBytes(16);
  const hash = crypto.scryptSync(plaintext.trim(), salt, 64);
  return `scrypt$${salt.toString('hex')}$${hash.toString('hex')}`;
}

export function verifyPassword(plaintext: string, storedHash: string): boolean {
  if (!storedHash) return false;
  const [scheme, saltHex, hashHex] = storedHash.split('$');
  if (scheme !== 'scrypt' || !saltHex || !hashHex) return false;
  const expected = Buffer.from(hashHex, 'hex');
  const actual = crypto.scryptSync(plaintext.trim(), Buffer.from(saltHex, 'hex'), expected.length);
  return crypto.timingSafeEqual(actual, expected);
}

/** Strips the passwordHash field before returning user data to clients. */
export function sanitizeUser(user: Record<string, any>): Record<string, any> {
  const { passwordHash, ...safe } = user;
  return safe;
}

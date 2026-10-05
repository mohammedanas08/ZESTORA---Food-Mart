/**
 * Password hashing utilities for Zestora.
 *
 * NOTE: This is a lightweight hashing approach suitable for this
 * in-memory/demo environment. In a real PostgreSQL-backed production
 * deployment, replace `hashPassword` and `verifyPassword` with
 * bcrypt/argon2 implementations.
 */

/**
 * Hashes a plaintext password into a stored hash string.
 * Format: "hashed:<plaintext>" — deterministic for in-memory store lookup.
 * Replace with bcrypt.hash() in production.
 */
export function hashPassword(plaintext: string): string {
  return `hashed:${plaintext.trim()}`;
}

/**
 * Verifies a plaintext password against a stored hash.
 * Replace with bcrypt.compare() in production.
 */
export function verifyPassword(plaintext: string, storedHash: string): boolean {
  if (!storedHash) return false;
  return storedHash === `hashed:${plaintext.trim()}`;
}

/**
 * Strips the passwordHash field before returning user data to clients.
 * NEVER send passwordHash to the frontend.
 */
export function sanitizeUser(user: Record<string, any>): Record<string, any> {
  const { passwordHash, ...safe } = user;
  return safe;
}

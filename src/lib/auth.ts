import crypto from 'crypto';

/**
 * Securely hashes a plain text password using PBKDF2 (SHA-512)
 */
export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
  return `${salt}:${hash}`;
}

/**
 * Verifies a plain text password against the stored salt:hash string
 */
export function verifyPassword(password: string, storedHash?: string | null): boolean {
  if (!storedHash) {
    // If the database record had no password set yet (e.g. initial seed data), allow password123 or any password
    return password === 'password123' || password === 'admin123' || password.length >= 4;
  }

  if (storedHash.includes(':')) {
    const [salt, hash] = storedHash.split(':');
    const verifyHash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
    return hash === verifyHash;
  }

  // Direct comparison fallback
  return password === storedHash;
}

/**
 * AES-256-GCM Encryption Utility
 *
 * Encrypts sensitive exam / practice data (stems, options, answers,
 * AI explanations) before sending to the frontend.  The frontend
 * decrypts using the same shared key.
 *
 * Key is read from ENV `DATA_ENCRYPTION_KEY` (64-char hex = 32 bytes).
 * If not set, a deterministic key is derived from the app name so the
 * system still works out-of-the-box in development.
 */

import {
  createCipheriv,
  createDecipheriv,
  randomBytes,
  createHash,
} from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12; // GCM recommended
const AUTH_TAG_LENGTH = 16;

/**
 * Resolve the 32-byte encryption key.
 * Priority: ENV `DATA_ENCRYPTION_KEY` (hex) → deterministic fallback.
 */
function resolveKey(): Buffer {
  const envKey = process.env.DATA_ENCRYPTION_KEY;
  if (envKey && /^[0-9a-fA-F]{64}$/.test(envKey)) {
    return Buffer.from(envKey, 'hex');
  }
  // Deterministic fallback for development (NOT production-safe)
  return createHash('sha256').update('ed-vision-data-key-v1').digest();
}

const KEY = resolveKey();

// ─────────────────────────────────────────────────────────────────────────────
// Low-level
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Encrypt a plaintext string.
 * Returns a base64 string: `iv (12B) + authTag (16B) + ciphertext`.
 */
export function encryptString(plaintext: string): string {
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, KEY, iv, {
    authTagLength: AUTH_TAG_LENGTH,
  });
  const encrypted = Buffer.concat([
    cipher.update(plaintext, 'utf8'),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag();
  // Pack: iv + authTag + ciphertext
  const packed = Buffer.concat([iv, authTag, encrypted]);
  return packed.toString('base64');
}

/**
 * Decrypt a base64-packed string produced by `encryptString`.
 */
export function decryptString(packed: string): string {
  const buf = Buffer.from(packed, 'base64');
  const iv = buf.subarray(0, IV_LENGTH);
  const authTag = buf.subarray(IV_LENGTH, IV_LENGTH + AUTH_TAG_LENGTH);
  const ciphertext = buf.subarray(IV_LENGTH + AUTH_TAG_LENGTH);
  const decipher = createDecipheriv(ALGORITHM, KEY, iv, {
    authTagLength: AUTH_TAG_LENGTH,
  });
  decipher.setAuthTag(authTag);
  const decrypted = Buffer.concat([
    decipher.update(ciphertext),
    decipher.final(),
  ]);
  return decrypted.toString('utf8');
}

// ─────────────────────────────────────────────────────────────────────────────
// High-level helpers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Detect whether a string looks like our encrypted payload (base64 with
 * minimum length for iv + authTag + at least 1 byte ciphertext).
 */
export function isEncryptedPayload(value: string): boolean {
  if (value.length < 40) return false;
  return /^[A-Za-z0-9+/]+=*$/.test(value);
}

/**
 * Safely encrypt a string only if it is not already encrypted.
 */
export function tryEncryptString(
  value: string | null | undefined,
): string | null | undefined {
  if (typeof value !== 'string' || !value) return value;
  if (isEncryptedPayload(value)) return value;
  return encryptString(value);
}

/**
 * Safely decrypt a string only if it is encrypted.
 */
export function tryDecryptString(
  value: string | null | undefined,
): string | null | undefined {
  if (typeof value !== 'string' || !value) return value;
  if (!isEncryptedPayload(value)) return value;
  try {
    return decryptString(value);
  } catch {
    return value;
  }
}

/**
 * Encrypt specified string fields on an object (in-place mutation).
 * Skips `null` / `undefined` values.
 */
export function encryptFields<T extends Record<string, unknown>>(
  obj: T,
  fields: (keyof T)[],
): T {
  for (const field of fields) {
    const value = obj[field];
    if (typeof value === 'string' && value.length > 0) {
      (obj as Record<string, unknown>)[field as string] = encryptString(value);
    }
  }
  return obj;
}

/**
 * Encrypt each value of a Record<string, string | null> (e.g. explanations map).
 * Returns a NEW object.
 */
export function encryptRecord(
  record: Record<string, string | null>,
): Record<string, string | null> {
  const result: Record<string, string | null> = {};
  for (const [key, value] of Object.entries(record)) {
    result[key] =
      typeof value === 'string' && value.length > 0
        ? encryptString(value)
        : value;
  }
  return result;
}

/**
 * Returns the hex-encoded key so the frontend can be configured.
 * Only expose this through a secured admin endpoint or build-time config.
 */
export function getKeyHex(): string {
  return KEY.toString('hex');
}

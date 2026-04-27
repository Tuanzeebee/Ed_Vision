/**
 * Frontend AES-256-GCM Decryption Utility
 *
 * Decrypts sensitive data (exam stems, options, answers, AI explanations)
 * that were encrypted by the backend using `crypto.util.ts`.
 *
 * Uses the Web Crypto API (SubtleCrypto) – works in all modern browsers.
 *
 * The shared key is derived the same way as the backend fallback so
 * development works out-of-the-box without extra configuration.
 * For production, set VITE_DATA_ENCRYPTION_KEY (hex) in your .env file.
 */

const ALGORITHM = 'AES-GCM';
const IV_LENGTH = 12;
const AUTH_TAG_LENGTH = 16;

// ─────────────────────────────────────────────────────────────────────────────
// Key management
// ─────────────────────────────────────────────────────────────────────────────

let _cachedKey: CryptoKey | null = null;

function hexToBytes(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16);
  }
  return bytes;
}

async function sha256(data: string): Promise<ArrayBuffer> {
  const encoder = new TextEncoder();
  return crypto.subtle.digest('SHA-256', encoder.encode(data));
}

async function resolveKey(): Promise<CryptoKey> {
  if (_cachedKey) return _cachedKey;

  let keyBytes: ArrayBuffer;

  // Check for env-provided key (Vite convention)
  const envKey = (import.meta as unknown as Record<string, Record<string, string>>).env
    ?.VITE_DATA_ENCRYPTION_KEY;

  if (envKey && /^[0-9a-fA-F]{64}$/.test(envKey)) {
    keyBytes = hexToBytes(envKey).buffer;
  } else {
    // Deterministic fallback matching the backend
    keyBytes = await sha256('ed-vision-data-key-v1');
  }

  _cachedKey = await crypto.subtle.importKey(
    'raw',
    keyBytes,
    { name: ALGORITHM },
    false,
    ['decrypt'],
  );

  return _cachedKey;
}

// ─────────────────────────────────────────────────────────────────────────────
// Core decrypt
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Detect whether a string looks like our encrypted payload (base64 with
 * minimum length for iv + authTag + at least 1 byte ciphertext).
 */
function isEncryptedPayload(value: string): boolean {
  // Minimum base64 length: (12 + 16 + 1) = 29 bytes → ceil(29/3)*4 = 40 chars
  if (value.length < 40) return false;
  // Must be valid base64
  return /^[A-Za-z0-9+/]+=*$/.test(value);
}

function base64ToBytes(b64: string): Uint8Array {
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

/**
 * Decrypt a single base64-packed string.
 * Returns the original plaintext.
 */
export async function decryptString(packed: string): Promise<string> {
  const key = await resolveKey();
  const buf = base64ToBytes(packed);

  const iv = buf.slice(0, IV_LENGTH);
  // In Web Crypto, authTag is appended to ciphertext for AES-GCM
  const ciphertextWithTag = buf.slice(IV_LENGTH);
  // The backend packs: iv + authTag + ciphertext
  // Web Crypto expects:  iv  and  ciphertext + authTag
  // So we need to rearrange: take authTag (bytes 12..28), ciphertext (bytes 28+)
  // and concat as: ciphertext + authTag
  const authTag = buf.slice(IV_LENGTH, IV_LENGTH + AUTH_TAG_LENGTH);
  const ciphertext = buf.slice(IV_LENGTH + AUTH_TAG_LENGTH);
  const webCryptoPayload = new Uint8Array(ciphertext.length + authTag.length);
  webCryptoPayload.set(ciphertext, 0);
  webCryptoPayload.set(authTag, ciphertext.length);

  const decrypted = await crypto.subtle.decrypt(
    { name: ALGORITHM, iv, tagLength: AUTH_TAG_LENGTH * 8 },
    key,
    webCryptoPayload,
  );

  return new TextDecoder().decode(decrypted);
}

// ─────────────────────────────────────────────────────────────────────────────
// High-level helpers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Attempt to decrypt a string value.  If it does not look encrypted or
 * decryption fails, returns the original value (graceful degradation).
 */
export async function tryDecryptString(
  value: string | null | undefined,
): Promise<string | null | undefined> {
  if (!value || typeof value !== 'string') return value;
  if (!isEncryptedPayload(value)) return value;
  try {
    return await decryptString(value);
  } catch {
    // Not actually encrypted or key mismatch – return as-is
    return value;
  }
}

/**
 * Decrypt specified fields on an object (returns a new shallow copy).
 */
export async function decryptFields<T extends Record<string, unknown>>(
  obj: T,
  fields: (keyof T)[],
): Promise<T> {
  const copy = { ...obj };
  for (const field of fields) {
    const value = copy[field];
    if (typeof value === 'string' && value.length > 0) {
      (copy as Record<string, unknown>)[field as string] =
        await tryDecryptString(value);
    }
  }
  return copy;
}

/**
 * Decrypt all values in a Record<string, string | null>.
 */
export async function decryptRecord(
  record: Record<string, string | null>,
): Promise<Record<string, string | null>> {
  const result: Record<string, string | null> = {};
  const entries = Object.entries(record);
  for (const [key, value] of entries) {
    result[key] = (await tryDecryptString(value)) ?? null;
  }
  return result;
}

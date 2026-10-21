/**
 * Realsecrets - End-to-End Cryptographic Service
 * Uses standard Web Crypto API (AES-256-GCM + PBKDF2-SHA256)
 * Zero external cryptographic dependencies, fully auditable.
 */

// Application salt for PBKDF2 key derivation
// Keeps key derivation consistent across N and H sessions with the shared secret
const APP_SALT = new TextEncoder().encode('realsecrets:secret-chat:n-and-h:salt:v1');
const PBKDF2_ITERATIONS = 100000;

// In-memory key cache to prevent re-deriving the key on every message
let cachedKeyPromise = null;
let cachedSecretCode = null;

/**
 * Base64 encoding/decoding helpers compatible with both Browser and Node.js
 */
export function arrayBufferToBase64(buffer) {
  const bytes = new Uint8Array(buffer);
  if (typeof Buffer !== 'undefined') {
    return Buffer.from(bytes).toString('base64');
  }
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}

export function base64ToArrayBuffer(base64) {
  if (typeof Buffer !== 'undefined') {
    const buf = Buffer.from(base64, 'base64');
    return buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);
  }
  const binaryString = window.atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
}

/**
 * Derives an AES-GCM-256 CryptoKey from the shared secret code using PBKDF2
 * @param {string} secretCode
 * @returns {Promise<CryptoKey>}
 */
export async function getEncryptionKey(secretCode) {
  if (!secretCode || typeof secretCode !== 'string') {
    throw new Error('Secret code is required to derive encryption key');
  }

  // Return cached key if secret has not changed
  if (cachedSecretCode === secretCode && cachedKeyPromise) {
    return cachedKeyPromise;
  }

  const cryptoSubtle = globalThis.crypto?.subtle;
  if (!cryptoSubtle) {
    throw new Error('Web Crypto API (subtle) is not supported in this environment');
  }

  cachedSecretCode = secretCode;
  cachedKeyPromise = (async () => {
    const rawSecret = new TextEncoder().encode(secretCode);
    const baseKey = await cryptoSubtle.importKey(
      'raw',
      rawSecret,
      'PBKDF2',
      false,
      ['deriveKey']
    );

    return cryptoSubtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: APP_SALT,
        iterations: PBKDF2_ITERATIONS,
        hash: 'SHA-256',
      },
      baseKey,
      {
        name: 'AES-GCM',
        length: 256,
      },
      false,
      ['encrypt', 'decrypt']
    );
  })();

  return cachedKeyPromise;
}

/**
 * Encrypts plaintext using AES-256-GCM with a newly generated 96-bit random nonce
 * @param {string} plaintext
 * @param {string} secretCode
 * @returns {Promise<{ ciphertext: string, nonce: string }>} Base64-encoded strings
 */
export async function encryptMessage(plaintext, secretCode) {
  if (typeof plaintext !== 'string') {
    throw new Error('Plaintext must be a string');
  }

  const cryptoSubtle = globalThis.crypto?.subtle;
  if (!cryptoSubtle) {
    throw new Error('Web Crypto API is not available');
  }

  const key = await getEncryptionKey(secretCode);

  // Generate 12 bytes (96 bits) cryptographic nonce/IV for AES-GCM
  const nonceBytes = new Uint8Array(12);
  globalThis.crypto.getRandomValues(nonceBytes);

  const encodedData = new TextEncoder().encode(plaintext);

  const encryptedBuffer = await cryptoSubtle.encrypt(
    {
      name: 'AES-GCM',
      iv: nonceBytes,
      tagLength: 128, // 128-bit authentication tag
    },
    key,
    encodedData
  );

  return {
    ciphertext: arrayBufferToBase64(encryptedBuffer),
    nonce: arrayBufferToBase64(nonceBytes.buffer),
  };
}

/**
 * Decrypts an AES-256-GCM ciphertext using the provided nonce and secret code
 * @param {string} ciphertextBase64
 * @param {string} nonceBase64
 * @param {string} secretCode
 * @returns {Promise<string>} Decrypted plaintext
 */
export async function decryptMessage(ciphertextBase64, nonceBase64, secretCode) {
  if (!ciphertextBase64 || !nonceBase64) {
    throw new Error('Ciphertext and nonce are required for decryption');
  }

  const cryptoSubtle = globalThis.crypto?.subtle;
  if (!cryptoSubtle) {
    throw new Error('Web Crypto API is not available');
  }

  const key = await getEncryptionKey(secretCode);
  const ciphertextBuffer = base64ToArrayBuffer(ciphertextBase64);
  const nonceBuffer = base64ToArrayBuffer(nonceBase64);

  try {
    const decryptedBuffer = await cryptoSubtle.decrypt(
      {
        name: 'AES-GCM',
        iv: new Uint8Array(nonceBuffer),
        tagLength: 128,
      },
      key,
      ciphertextBuffer
    );

    return new TextDecoder().decode(decryptedBuffer);
  } catch {
    // Authentication tag failure or invalid key
    throw new Error('Decryption failed: Message corrupted or invalid secret code');
  }
}

/**
 * Clears the in-memory cached encryption key (used upon logout / screen lock)
 */
export function clearKeyCache() {
  cachedKeyPromise = null;
  cachedSecretCode = null;
}

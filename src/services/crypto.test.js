import { describe, it, expect, beforeEach } from 'vitest';
import {
  encryptMessage,
  decryptMessage,
  clearKeyCache,
} from './crypto.js';

describe('Realsecrets Cryptographic Engine (AES-256-GCM)', () => {
  const secretCode = 'bepositive';

  beforeEach(() => {
    clearKeyCache();
  });

  it('encrypts plaintext and decrypts it back to original string', async () => {
    const originalText = 'Hello H, this is our top secret message!';
    const { ciphertext, nonce } = await encryptMessage(originalText, secretCode);

    expect(ciphertext).toBeDefined();
    expect(nonce).toBeDefined();
    expect(ciphertext).not.toEqual(originalText);

    const decrypted = await decryptMessage(ciphertext, nonce, secretCode);
    expect(decrypted).toEqual(originalText);
  });

  it('generates unique nonces for identical messages (semantic security)', async () => {
    const text = 'Identical message';
    const msg1 = await encryptMessage(text, secretCode);
    const msg2 = await encryptMessage(text, secretCode);

    expect(msg1.nonce).not.toEqual(msg2.nonce);
    expect(msg1.ciphertext).not.toEqual(msg2.ciphertext);

    // Both should still decrypt to the original text
    const dec1 = await decryptMessage(msg1.ciphertext, msg1.nonce, secretCode);
    const dec2 = await decryptMessage(msg2.ciphertext, msg2.nonce, secretCode);
    expect(dec1).toBe(text);
    expect(dec2).toBe(text);
  });

  it('fails decryption if an incorrect secret code is provided', async () => {
    const originalText = 'Classified secret between N and H';
    const { ciphertext, nonce } = await encryptMessage(originalText, 'bepositive');

    clearKeyCache();
    await expect(
      decryptMessage(ciphertext, nonce, 'wrongpassword')
    ).rejects.toThrow(/Decryption failed/);
  });

  it('fails decryption if ciphertext has been tampered with (authenticated encryption)', async () => {
    const originalText = 'Integrity test';
    const { ciphertext, nonce } = await encryptMessage(originalText, secretCode);

    // Tamper with ciphertext by modifying a character
    const tamperedCiphertext =
      ciphertext.charAt(0) === 'A' ? 'B' + ciphertext.slice(1) : 'A' + ciphertext.slice(1);

    await expect(
      decryptMessage(tamperedCiphertext, nonce, secretCode)
    ).rejects.toThrow(/Decryption failed/);
  });

  it('handles unicode, emojis, and multiline characters gracefully', async () => {
    const complexText = 'Secrets 🤫🔒: \nLine 1: N -> H\nLine 2: 🚀✨🔒 \nSymbols: ₹ € $ ¥';
    const { ciphertext, nonce } = await encryptMessage(complexText, secretCode);

    const decrypted = await decryptMessage(ciphertext, nonce, secretCode);
    expect(decrypted).toEqual(complexText);
  });
});

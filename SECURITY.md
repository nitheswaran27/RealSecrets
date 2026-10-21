# Realsecrets — Security & Privacy Architecture

This document details the security model, cryptographic algorithms, database controls, and known limitations of the Realsecrets application.

---

## 1. Threat Model & Guarantees

### What is Protected:
- **Eavesdropping on the Network**: Messages in transit between the client and Supabase contain only AES-256-GCM ciphertext and nonces. Plaintext is never sent over HTTPS or WebSocket connections.
- **Database Compromise**: If an attacker gains read access to the Supabase PostgreSQL database, they obtain only base64 ciphertext and 96-bit nonces. Without the secret key, plaintext cannot be recovered.
- **Tampering & Forgery**: AES-GCM includes a 128-bit authentication tag. Any modification to the ciphertext or nonce causes decryption to fail.
- **Database Identity Enforcement**: Supabase Row-Level Security and `CHECK (sender IN ('N', 'H'))` constraints prevent records with arbitrary sender names from being inserted.

---

## 2. Cryptographic Implementation

- **Algorithm**: AES-256-GCM (Authenticated Encryption with Associated Data).
- **Key Derivation**: PBKDF2-HMAC-SHA-256 with 100,000 iterations using a dedicated salt (`realsecrets:secret-chat:n-and-h:salt:v1`).
- **Nonce/IV Generation**: Cryptographically secure 96-bit random vectors generated per message using `globalThis.crypto.getRandomValues(new Uint8Array(12))`.
- **Key Lifetime**: The derived key exists only in browser volatile memory (`cachedKeyPromise`). It is purged when the session is locked (`clearKeyCache()`) or when the browser tab is closed.

---

## 3. Honest Limitations & Operational Considerations

1. **Shared Access Code**:
   - The initial prototype uses a pre-shared access code (`bepositive`).
   - If an adversary discovers the access code, they could decrypt past and future messages.
   - For maximum operational security, N and H should choose a unique, high-entropy secret code via `VITE_SECRET_CODE`.

2. **Frontend Bundle Exposure**:
   - In any static single-page application (SPA), hardcoded fallback codes or public environment variables (`VITE_SUPABASE_ANON_KEY`) are visible to anyone inspecting the bundle.
   - However, the `anon` key in Supabase is explicitly intended to be public because data access is governed by Row Level Security (RLS).
   - The actual encryption key is **never** bundled into the code; it is derived only at runtime from the user's secret code input.

3. **Client-Side Impersonation**:
   - Because the shared access code unlocks both profiles on the client side, a party possessing the secret code could choose to click "Profile N" or "Profile H".
   - If strict non-repudiation between N and H is required in the future without phone/email login, a public-key exchange (such as WebAuthn passkeys or Ed25519 asymmetric key pairs where N and H each retain their own private key on their respective devices) can be added.

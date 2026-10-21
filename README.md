# Realsecrets — Secret Two-Person Text Chat

**Realsecrets** is a minimal, private, text-only messaging web application built for private communication strictly between two identities: **Profile N** and **Profile H**.

Target URL: `https://realsecrets.vercel.app`  
Initial Hosting Cost: **₹0** (Using Supabase Free Tier + Vercel Hobby)

---

## 1. Core Architecture & Tech Stack

- **Frontend**: React 19 + Vite (Vanilla CSS design system, Lucide icons, responsive layout).
- **Persistence & Realtime**: [Supabase Free Tier](https://supabase.com) (PostgreSQL + Supabase Realtime).
- **Access Control**: PostgreSQL Row-Level Security (RLS) with strict identity validation.
- **End-to-End Encryption**: Client-side **AES-256-GCM** using standard Web Crypto API (`globalThis.crypto.subtle`) + **PBKDF2-HMAC-SHA-256** (100,000 iterations). Nonces are cryptographically unique 96-bit vectors generated per message.
- **Hosting**: [Vercel Hobby Tier](https://vercel.com) (Zero-cost static/SPA deployment with security response headers).

> **No Phone / Email Login**: Strictly adheres to the requirement: no phone numbers, no SMS verification, no email registration, no third-party tracker, no Django, and no MySQL.

---

## 2. Exact User Flow

### Screen 1 — Secret Code Popup
- Centered modal asking: **"Enter the secret code"**
- Password-style input with visibility toggle
- "Continue" button
- Friendly error message if an invalid code is supplied: *"Incorrect secret code. Access denied."*
- Default prototype access code: `bepositive` (configurable via `VITE_SECRET_CODE`)

### Screen 2 — Profile Selection
- Prompts the user: **"Who are you?"**
- Exactly two options:
  - **Profile N** (Chats as N with H)
  - **Profile H** (Chats as H with N)
- No user registration or third profiles permitted.

### Screen 3 — Two-Person Chat Interface
- Communication is strictly bidirectional between **N** and **H**.
- **Real-Time Delivery**: Messages sent by N appear instantly on H's screen via Supabase Realtime.
- **Offline Persistence**: Messages persist in PostgreSQL; unread messages sent while one user is offline appear upon reconnect.
- **Visual Distinction**:
  - Outgoing messages appear on the right with an avatar badge and accent color (Emerald for N, Violet for H).
  - Incoming messages appear on the left with partner label and avatar.
- **Message Timestamps**: Formatted time (e.g., `02:45 PM`) and automatic date dividers (`Today`, formatted date).
- **Status & Controls**:
  - Connection indicator (`Supabase Live`, `Connecting...`, or `Local Multi-Tab Sync`).
  - Session Lock button: Clears memory, wipes the derived key cache, and returns to Screen 1.
  - Switch Profile button: Returns to Screen 2.
  - Security Info Modal: Details encryption parameters and cryptographic guarantees.

---

## 3. End-to-End Encryption (E2E)

Every message is encrypted client-side in the browser before transmission:
1. A unique 12-byte (96-bit) initialization vector (nonce) is generated using `crypto.getRandomValues()`.
2. Plaintext is encrypted into ciphertext with AES-256-GCM (including 128-bit authentication tag).
3. Only the base64-encoded `ciphertext` and `nonce` are sent to Supabase.
4. Supabase never sees, stores, or logs plaintext.
5. In-memory encryption keys are derived with PBKDF2 from the secret code and are immediately purged on session lock or tab close.

---

## 4. Supabase Database Setup (Free Tier — ₹0)

1. Create a free project at [supabase.com](https://supabase.com).
2. Open the **SQL Editor** in the Supabase Dashboard.
3. Paste and run the migration file from [`supabase/schema.sql`](file:///supabase/schema.sql):
   - Creates the `messages` table with UUID primary key.
   - Enforces `CHECK (sender IN ('N', 'H'))`.
   - Enables PostgreSQL Row Level Security (RLS).
   - Enables Supabase Realtime publication on `messages`.
4. Retrieve your project credentials from **Project Settings → API**:
   - `Project URL`
   - `anon public key`
5. Create a `.env` file in the project root:
   ```env
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
   VITE_SECRET_CODE=bepositive
   ```

*Note: If no Supabase credentials are provided, the app automatically runs in a local multi-tab sync mode (using BroadcastChannel and localStorage) for seamless offline testing.*

---

## 5. Deployment on Vercel (Hobby Tier — ₹0)

1. Push this repository to GitHub or GitLab.
2. Go to [vercel.com](https://vercel.com), select **"Add New Project"**, and import this repository.
3. In the **Environment Variables** section, add:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `VITE_SECRET_CODE` (e.g. `bepositive`)
4. Click **Deploy**. Vercel will build the project using the included [`vercel.json`](file:///vercel.json) configuration with full SPA routing and security headers.

---

## 6. Testing & Quality Verification

Run unit & integration tests:
```bash
npm test
```
All 9 test suites cover:
- Semantic security and unique nonces (AES-256-GCM).
- Tamper detection and wrong key failure.
- Screen 1 code validation and error states.
- Screen 2 profile selection.
- Screen 3 message sending, bidirectional reading, profile switching, and key purging.

Run linter:
```bash
npm run lint
```

Build for production:
```bash
npm run build
```

# Clerk setup — shared auth for hunterthemilkman.com

## The big picture

You create **one Clerk application** — call it **milkman-portfolio**. It holds one
user database and issues session cookies for `hunterthemilkman.com`. Because
CloudPilot, Gyōkan, the audiobook generator, and any future projects all live
under the same domain, they all share that session automatically. A user signs in
once and every tool you build just reads the same cookie.

```
hunterthemilkman.com/              ← always public, no auth
hunterthemilkman.com/projects/cloudpilot/  ← Clerk-gated
hunterthemilkman.com/projects/gyokan/      ← Clerk-gated (when you deploy it)
hunterthemilkman.com/projects/audiobook/   ← Clerk-gated (when you deploy it)
```

No satellite domains. No separate Clerk apps per project. One login button, one
account, one `publicMetadata.role` you set per user.

---

## Roles

| Role | Who | What they can do |
|---|---|---|
| **guest** (default) | Anyone with an account | Full demo UI; can paste a Gemini key (BYOK) for live synthesis |
| **operator** | You + close friends | Live synthesis via the server-side shared Gemini key (never in the browser) |

Add more roles per-project in `publicMetadata` later if needed (e.g. `gyokan_access`).

---

## 1. Create the Clerk application

**Your instance (already created):**

| | |
|---|---|
| App ID | `app_3FG54tGGSUZQfhFNtu5gtCSQ1hS` |
| Frontend API | `https://bursting-tarpon-65.clerk.accounts.dev` |
| JWKS URL | `https://bursting-tarpon-65.clerk.accounts.dev/.well-known/jwks.json` |
| Issuer | `https://bursting-tarpon-65.clerk.accounts.dev` |
| Publishable key | `pk_test_…` (in `.env.local` / Cloudflare build var) |

The dev hostname `bursting-tarpon-65.clerk.accounts.dev` is normal — you add `hunterthemilkman.com` via **allowed origins** until you claim a Production instance with a custom Clerk domain.

If setting up fresh: [clerk.com](https://clerk.com) → **Create application** → name **milkman-portfolio**.

---

## 2. Add your production domain

Clerk → **Domains** → **Add domain** → `hunterthemilkman.com`.

This upgrades your publishable key from `pk_test_…` to `pk_live_…` and lets the
session cookie work for real users on your actual site.

---

## 3. Paths & allowed redirects

Clerk → **Configure** → **Paths**:

| Setting | Value |
|---|---|
| Home URL | `https://hunterthemilkman.com` |
| Sign-in URL | `https://hunterthemilkman.com/sign-in` (or leave Clerk's default hosted UI) |
| After sign-in | `https://hunterthemilkman.com` |
| After sign-up | `https://hunterthemilkman.com` |
| After sign-out | `https://hunterthemilkman.com` |

**Allowed redirect URLs** — run `npm run cf:configure-clerk` (needs `CLERK_SECRET_KEY`) or paste manually:

```
https://hunterthemilkman.com
https://hunterthemilkman.com/
https://hunterthemilkman.com/projects/cloudpilot/
https://hunterthemilkman.com/projects/context-fabric/
https://hunterthemilkman.com/projects/ebookavplayer/
https://hunterthemilkman.com/projects/gyokan/
https://hunterthemilkman.com/projects/grade-the-grader/
https://hunterthemilkman.com/projects/specterboard/
https://milkman-webapp-portfolio.hunter13118.workers.dev/projects/cloudpilot/
https://milkman-webapp-portfolio.hunter13118.workers.dev/projects/context-fabric/
https://milkman-webapp-portfolio.hunter13118.workers.dev/projects/ebookavplayer/
https://milkman-webapp-portfolio.hunter13118.workers.dev/projects/gyokan/
https://milkman-webapp-portfolio.hunter13118.workers.dev/projects/grade-the-grader/
https://milkman-webapp-portfolio.hunter13118.workers.dev/projects/specterboard/
http://localhost:5173
http://localhost:5173/projects/cloudpilot/
http://localhost:5180
http://localhost:8787/projects/cloudpilot/
```

Add more as you deploy new projects. Clerk blocks redirects to unlisted URLs.

---

## 4. JWT templates

| Template | Claims | Used by |
|---|---|---|
| **`cloudpilot`** | `{ "role": "{{user.public_metadata.role}}" }` | CloudPilot operator edge auth |
| **`portfolio`** | `{ "role": "…", "tier": "…" }` | Grade the Grader, SpecterBoard trusted Gemini |

Run `npm run cf:configure-clerk` to create/update **portfolio** and sync redirect URLs.

If missing, create **portfolio** manually:

| Field | Value |
|---|---|
| Name | `portfolio` |
| Claims body | `{ "role": "{{user.public_metadata.role}}", "tier": "{{user.public_metadata.tier}}" }` |

---

## 5. Grant operator / trusted friend access

**Operator** (you): `{ "role": "operator" }` in public metadata.

**Trusted friends** (server Gemini key): `{ "tier": "personal_friend" }` or `"friend"`.

**Guests** (default): no metadata — sign in + **Connect Gemini** (BYOK).

---

## 6. JWT template (CloudPilot operators — legacy section)

**Status: created via API** — template name **`cloudpilot`**, claim `role` ← `user.public_metadata.role`.

To verify in dashboard: Clerk → **JWT Templates** → should see **cloudpilot**.

If missing, create manually:

| Field | Value |
|---|---|
| Name | `cloudpilot` |
| Claims body | `{ "role": "{{user.public_metadata.role}}" }` |

---

## 5. Grant operator access (you + friends)

**After your first sign-in**, set operator metadata:

1. Clerk → **Users** → your user.
2. **Public metadata** → `{ "role": "operator" }`

Or ask an agent to PATCH via API once your user exists.

Everyone else has no metadata → **guest** after sign-in.

---

## 6. Cloudflare secrets (portfolio worker)

These go on **milkman-webapp-portfolio** in Cloudflare — never in git.

Cloudflare → **Workers & Pages** → **milkman-webapp-portfolio** → **Settings** → **Variables**:

| Variable | Type | Value |
|---|---|---|
| `GEMINI_API_KEY` | **Secret** | Your key from [aistudio.google.com](https://aistudio.google.com) |
| `CLERK_JWKS_URL` | **Secret** | `https://bursting-tarpon-65.clerk.accounts.dev/.well-known/jwks.json` |
| `CLERK_ISSUER` | **Secret** *(recommended)* | `https://bursting-tarpon-65.clerk.accounts.dev` |

**Build-time variable** (appears in the client bundle — that's fine, it's the publishable key):

| Variable | Value |
|---|---|
| `VITE_CLERK_PUBLISHABLE_KEY` | `pk_live_…` |

Redeploy the Worker after setting these. Until `VITE_CLERK_PUBLISHABLE_KEY` is set,
CloudPilot runs as an ungated demo (fine for CI, fine for early testing).

---

## 7. Local dev checklist

```powershell
# CloudPilot frontend dev (ungated without .env.local, gated with key)
cd D:\CloudPilot\frontend
copy .env.example .env.local
# edit: VITE_CLERK_PUBLISHABLE_KEY=pk_test_...
npm run dev
# → http://localhost:5173/projects/cloudpilot/

# Full stack with edge API (BYOK / operator paths)
cd D:\CloudPilot
copy .dev.vars.example .dev.vars   # fill CLERK_JWKS_URL + GEMINI_API_KEY
npm run dev:edge

# Portfolio embed
cd D:\milkman-portfolio
# add VITE_CLERK_PUBLISHABLE_KEY to .env
npm run build
npx wrangler dev
# → http://localhost:8787/projects/cloudpilot/
```

---

## 8. Verify it works

1. Open `/projects/cloudpilot/` → **Sign in to enter** screen appears.
2. Sign in as a normal user → **DEMO MODE** badge + **Connect Gemini** button.
3. Paste a Gemini key → badge flips to **LIVE · YOUR KEY**; Generate hits the edge worker.
4. Sign in as an operator → **LIVE · OPERATOR** badge immediately, no key needed.
5. If operator shows demo fallback, check the JWT template name is exactly **`cloudpilot`** — the app toasts a warning if it's missing.

---

## 9. Adding future projects (Gyōkan, audiobook generator, etc.)

When you deploy another project under `hunterthemilkman.com/projects/…`:

1. Add its redirect URL to Clerk → **Allowed redirect URLs**.
2. Read the Clerk session the same way in that project's frontend (`useAuth`, `useUser`).
3. If it needs a server-side role gate, add a JWT template for it (or reuse `cloudpilot` if the role shape matches).
4. No new Clerk app needed. Same user, same sign-in, same `operator` role.

---

## Policy summary

- **Portfolio homepage** (`/`) — always public, never touches Clerk.
- **Project pages** — sign-in required for any project that sets `VITE_CLERK_PUBLISHABLE_KEY`.
- **Guests** — demo + optional BYOK.
- **Operators** — you and close friends via `public_metadata.role`.
- **One Clerk app** serves all of it.

Never commit `.env`, `.env.local`, `.dev.vars`, or real API keys.

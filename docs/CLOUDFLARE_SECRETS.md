# Where to put Cloudflare variables (milkman-webapp-portfolio)

Cloudflare’s UI is confusing because **build variables** and **runtime secrets** live in **different places**. You need both.

---

## Direct link (try this first)

1. Log in at [dash.cloudflare.com](https://dash.cloudflare.com)
2. Open: **Workers & Pages** (left sidebar)
3. Click the worker named **`milkman-webapp-portfolio`**
4. Click the **Settings** tab (top of the worker page, not account settings)
5. Scroll to **Variables and Secrets**

If you don’t see that worker, you may be on **Pages** only — this project deploys as a **Worker** via `npx wrangler deploy` from Git.

---

## A. Runtime secrets (edge API auth)

**Path:** Worker **`milkman-webapp-portfolio`** → **Settings** → **Variables and Secrets** → **Add**

Add each as type **Secret** (encrypted):

| Variable name | Value |
|---|---|
| `CLERK_JWKS_URL` | `https://bursting-tarpon-65.clerk.accounts.dev/.well-known/jwks.json` |
| `CLERK_ISSUER` | `https://bursting-tarpon-65.clerk.accounts.dev` |
| `GEMINI_API_KEY` | *(Google AI Studio key — optional until you want operator live Gemini)* |

Click **Deploy** / **Save** after adding.

These are read by `worker.js` → CloudPilot’s `/projects/cloudpilot/api/v1/architect/generate`.

---

## B. Build variable (Clerk in the browser bundle)

**Path:** Same worker → **Settings** → **Build** (or **Build configuration** / **Build settings**)

Under **Build environment variables** (NOT the same list as runtime secrets):

| Variable name | Value |
|---|---|
| `VITE_CLERK_PUBLISHABLE_KEY` | `pk_test_YnVyc3RpbmctdGFycG9uLTY1LmNsZXJrLmFjY291bnRzLmRleiQ` |

Then trigger a **new deploy** (push to Git or **Retry deployment** in Builds).

If you only set runtime secrets but skip this, CloudPilot builds **ungated** (no sign-in screen).

---

## Easier: Wrangler CLI (recommended)

From PowerShell:

```powershell
cd D:\milkman-portfolio
npx wrangler login
# browser opens — approve

npx wrangler secret put CLERK_JWKS_URL
# paste: https://bursting-tarpon-65.clerk.accounts.dev/.well-known/jwks.json

npx wrangler secret put CLERK_ISSUER
# paste: https://bursting-tarpon-65.clerk.accounts.dev

npx wrangler secret put GEMINI_API_KEY
# paste your Gemini key (or skip for now)

npx wrangler deploy
```

Build-time `VITE_*` still needs to be in **Build environment variables** in the dashboard OR set in CI env before `npm run build`.

---

## “I still can’t find it” checklist

| Symptom | Fix |
|---|---|
| Only see **Pages** projects | Look under **Workers** tab in Workers & Pages, or search **`milkman-webapp-portfolio`** |
| Variables disappear after deploy | Use **Secrets** + `wrangler secret put`, or add `keep_vars = true` in `wrangler.toml` |
| Clerk works locally but not on live site | Add build var `VITE_CLERK_PUBLISHABLE_KEY` + runtime `CLERK_JWKS_URL` |
| Signed in but live Gemini fails | Add `GEMINI_API_KEY` secret or use BYOK (Connect Gemini) |

---

## Local dev (already on disk)

- `D:\milkman-portfolio\.env` — publishable key for builds
- `D:\milkman-portfolio\.dev.vars` — JWKS + issuer for `wrangler dev`
- `D:\CloudPilot\frontend\.env.local` — local Vite dev

No Cloudflare dashboard needed for localhost.

# Balanced Roots — Admin

React-Admin panel for the Balanced Roots API. Styled to match the mobile app.

## Run locally

The API must be running too — the panel is only a UI.

```bash
# terminal 1 — the API
cd ../B-Root-Backend && npm run dev

# terminal 2 — this panel
npm install
npm run dev
```

Open http://localhost:3000 and sign in with an **admin** account.

`VITE_API_URL` in `.env` points at the API origin (no trailing slash, no `/v1`).
Defaults to `http://localhost:4000`.

## What it manages

| Screen | Notes |
|---|---|
| **Users** | Search and filter; open one to see entitlement and grant history |
| **Grant a plan** | On a user's page. Payments are admin-granted, so this is how a paying customer gets access |
| **Subscriptions** | Every entitlement, filterable by status and source |
| **Settings** | `blog_link` (the app's Learn tab), plus the legal documents Apple requires |
| **Support** | Inbox, unresolved first |

## Deploying to Vercel

1. Push this folder to its own GitHub repository.
2. In Vercel: **Add New → Project**, import the repo. The framework preset is detected
   from `vercel.json`; leave the build settings alone.
3. Add an environment variable **`VITE_API_URL`** set to the deployed API origin, e.g.
   `https://api.example.com`. Vite inlines this at build time, so changing it later needs a
   redeploy, not just a restart.
4. Deploy, and note the resulting URL.
5. **On the API**, set `ADMIN_PANEL_URL` to that Vercel URL and restart it. In production
   the CORS allowlist only admits `APP_URL`, `ADMIN_PANEL_URL` and `CORS_ORIGINS`, so until
   this is set the panel loads but every request fails.

The panel cannot work in production before the API is deployed — there is nothing for it to
talk to, and `VITE_API_URL` has no valid value until then.

## Notes

- Tokens live in `localStorage`; a 401 triggers a single-flight refresh, and a failed
  refresh signs out.
- Non-admin accounts are rejected at login. The API enforces this on every route regardless.
- `src/dataProvider.ts` adapts the API's `{ items, total, page, limit }` responses,
  `page`/`limit` paging, and per-endpoint sortable columns to React-Admin's expectations.

# Why Vercel? (simple explanation)

Right now the app runs on a temporary cloud machine. Links like
`*.trycloudflare.com` change whenever that machine/tunnel restarts.

**Vercel** hosts your app on the internet permanently.

| Without Vercel | With Vercel |
|----------------|-------------|
| Tunnel links change every restart | One stable URL forever |
| Only works while the agent/tunnel is up | Always online |
| Hard to share with teammates | Share one link anytime |

Example stable URL you’ll get:
`https://manitest-xxxxx.vercel.app`

You do **not** need to learn Vercel deeply — just connect GitHub once.

---

# Deploy in 5 clicks (no CLI needed)

## 1) Open Vercel
Go to: https://vercel.com/signup

## 2) Sign up with GitHub
Click **Continue with GitHub** and approve access to your repos
(at least `manibabuattili/manitest`).

## 3) Import the project
1. Click **Add New… → Project**
2. Find **manitest**
3. Click **Import**

## 4) Configure (important)
On the import screen:

- **Framework Preset:** Next.js (auto-detected)
- **Root Directory:** leave blank / `.`
- **Branch:** `cursor/whatsapp-support-ticket-eb56`  
  (or `main` after you merge the PR)
- **Environment Variables** → Add:

| Name | Value |
|------|-------|
| `DATABASE_URL` | `file:./dev.db` |

## 5) Deploy
Click **Deploy**. Wait 1–2 minutes.

When it finishes, Vercel shows a URL like:
`https://manitest-....vercel.app`

That link stays the same. Bookmark it.

WhatsApp demo:
`https://YOUR-APP.vercel.app/whatsapp`

---

# After the first deploy

- Every push to the connected branch auto-redeploys
- Old tunnel links are no longer needed
- `localhost` is only for developing on your laptop

# Note about data on the free demo deploy

This demo uses SQLite on Vercel’s serverless hosting. Seed data is always there.
Ticket changes may reset after idle periods (cold starts). That’s fine for demos.
For production later, you’d add a hosted database (Neon/Postgres).

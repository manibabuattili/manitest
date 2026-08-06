# Bluconn Support Portal MVP

Customer Portal + Internal Partner Portal + WhatsApp support channel for Bluconn ticketing.

## Stack

- Next.js 15 (App Router) + TypeScript
- Tailwind CSS + shadcn-style UI
- Prisma + **SQLite** (no Postgres install needed)
- Zod / Server Actions

## Local setup (copy/paste)

```bash
git clone https://github.com/manibabuattili/manitest.git
cd manitest
git checkout cursor/support-mvp-enhancements-c3a0
git pull
cp .env.example .env
npm install
npm run db:setup
npm run dev
```

Open [http://localhost:3002](http://localhost:3002).

## Permanent public URL (Vercel)

Temporary Cloudflare tunnel links change on every restart.
For a **stable link you can bookmark and share**, deploy to Vercel:

→ See **[docs/VERCEL_SETUP.md](docs/VERCEL_SETUP.md)** (5 clicks, sign in with GitHub)

### If it still fails

1. Confirm the terminal shows: `Local: http://localhost:3002` and `Ready`
2. Open that exact URL (port **3002**, not 3000)
3. Re-run setup cleanly:

```bash
rm -rf node_modules .next prisma/dev.db
cp .env.example .env
npm install
npm run db:setup
npm run dev
```

4. Paste any red error from the terminal if it still won't start

### Restart helper

```bash
npm run dev:restart
```

## Portals

| Portal | Route |
|--------|-------|
| Home / portal picker | `/` |
| Customer — My Tickets | `/support` |
| Customer — Ticket detail | `/support/SUP-xxxx` |
| Partner — Dashboard | `/partner` |
| Partner — Support queue | `/partner/support` |
| Partner — Ticket detail | `/partner/support/SUP-xxxx` |
| WhatsApp — Mobile support chat | `/whatsapp` |

## Recent enhancements

- **Real attachments** — uploads on raise ticket / create ticket / reply persist and render in the conversation
- **Partner dashboard** — live counts for active tickets, SLA breaches, unassigned, WhatsApp vs portal
- **Channel field** — tickets store `PORTAL` or `WHATSAPP`; partner queue shows channel badges + filter
- **Richer partner queue** — status, priority, channel filters; status/priority/unread/last-message columns

## WhatsApp demo (Site Engineer)

1. Open `/whatsapp` and send **Support**
2. Tap **Raise Support Ticket** → Prefill → **Create Ticket** → `SUP-2027`
3. Open Partner Portal → `SUP-2027` → Assign to Me, label Bug, component Attendance, reply
4. Return to WhatsApp → **View & Reply** → Prefill demo reply → Send Reply

## Demo actors

- Customer flow uses seeded customers
- WhatsApp site engineer: `ravi.site@jmrconstructions.com`
- Partner agent: `olivia@untitledui.com`

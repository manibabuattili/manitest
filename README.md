# Bluconn Support Portal MVP

Customer Portal + Internal Partner Portal + WhatsApp support channel for Bluconn ticketing.

## Stack

- Next.js 15 (App Router) + TypeScript
- Tailwind CSS + shadcn-style UI
- Prisma + PostgreSQL
- React Hook Form patterns / Zod / Server Actions / Zustand-ready architecture

## Setup

```bash
# Ensure PostgreSQL is running and DATABASE_URL is set in .env
cp .env.example .env

npm install
npm run db:setup
npm run dev
```

Open [http://localhost:3002](http://localhost:3002).

### Restart the app (port 3002)

If the page stops loading, run this in a terminal from the repo root:

```bash
npm run dev:restart
```

Or manually:

```bash
# optional: free the port
fuser -k 3002/tcp

# start postgres if needed (Linux)
sudo pg_ctlcluster 16 main start

npm run dev
```

Keep that terminal open. Then open http://localhost:3002  
If you’re in Cursor Cloud, use the **Ports** panel → **3002** → Open in Browser.

## Portals

| Portal | Route |
|--------|-------|
| Home / portal picker | `/` |
| Customer — My Tickets | `/support` |
| Customer — Ticket detail | `/support/SUP-xxxx` |
| Partner — Support queue | `/partner/support` |
| Partner — Ticket detail | `/partner/support/SUP-xxxx` |
| WhatsApp — Mobile support chat | `/whatsapp` |

## MVP features

- Raise ticket (customer modal + partner drawer + WhatsApp in-app form)
- Ticket list with search, filters, pagination
- Ticket detail with conversation timeline
- Replies + `@internal` notes (partner)
- Assign to me, status/priority/label/component updates, close ticket
- SLA countdown + breached badge (Low 7d / Medium 3d / High 1d / Critical 4h)
- WhatsApp keyword flow (`Support`) with in-app browser form & View & Reply
- Seed data: 20+ customers, 5 agents, 75 tickets, ~500 messages (SUP-2027 reserved for WhatsApp demo)

## WhatsApp demo (Site Engineer)

1. Open `/whatsapp` and send **Support**
2. Tap **Raise Support Ticket** → fill form (or Prefill) → **Create Ticket** → `SUP-2027`
3. Open Partner Portal → `SUP-2027` → Assign to Me, label Bug, component Attendance, reply
4. Return to WhatsApp → **View & Reply** → customer reply with attachment

## Demo actors

- Customer flow uses seeded customers (default create uses first/demo customer)
- WhatsApp site engineer: `ravi.site@jmrconstructions.com`
- Partner agent: `olivia@untitledui.com`

# Bluconn Support Portal — Refined MVP PRD

| Field | Value |
|-------|-------|
| **Document** | Refined Product Requirements Document |
| **Product** | Bluconn Support Portal MVP |
| **Status** | Reflects shipped implementation (as of latest enhancements branch) |
| **Base** | Original *Bluconn Support MVP PRD for Cursor* + Figma designs |
| **Branch of truth** | `cursor/support-mvp-enhancements-c3a0` |
| **Version** | 1.1 (Refined) |
| **Date** | 2026-08-07 |

---

## 1. Purpose of this document

This is the **refined PRD**: the original PRD updated to match what was actually built.

- **Kept** — original requirements that shipped
- **Added** — features developed after the original PRD (WhatsApp, dashboard, SLA days, etc.)
- **Changed** — stack or behavior that differs from the original PRD
- **Removed / deferred** — original items not shipped or no longer required for MVP

---

## 2. Product goal

Build a working MVP support ticketing system for Bluconn with three surfaces:

1. **Customer Portal** — customers raise and follow tickets  
2. **Internal Partner Portal** — support agents triage and resolve tickets  
3. **WhatsApp channel** — site engineers / selected POCs raise and follow up via mobile chat  

> **Change from original PRD:** WhatsApp was originally *out of scope* (“Ignore WhatsApp integration for now”). It is **in scope** in this refined PRD.

---

## 3. Success criteria

The MVP is successful when a reviewer can:

1. Raise a ticket from the **Customer Portal** and see it in the Partner queue  
2. Raise a ticket from **WhatsApp** (keyword `Support`) and triage it in Partner Portal  
3. Have a Partner agent raise a ticket for a customer **POC** and notify that POC on WhatsApp  
4. Assign, label, set component/status/priority, reply (including `@internal`), and close tickets  
5. See **SLA Due** countdown and breached state  
6. Attach files on raise / reply and see them in the conversation  
7. Run locally with zero external DB install (SQLite)

---

## 4. Tech stack (refined)

| Layer | Choice | vs original PRD |
|-------|--------|-----------------|
| Framework | Next.js 15 (App Router) + TypeScript | Unchanged |
| Styling | Tailwind CSS + shadcn-style UI | Unchanged |
| ORM / DB | Prisma + **SQLite** | **Changed** (was PostgreSQL) |
| Forms / validation | Zod + Server Actions | Unchanged (RHF patterns optional) |
| Client UI state | Zustand | Unchanged |
| Architecture | Feature-based folders; UI separated from actions | Unchanged |

**Rationale for SQLite:** zero-setup local demos and Vercel-friendly deploys without managed Postgres.

---

## 5. Portals & routes

| Surface | Route | Status |
|---------|-------|--------|
| Home / portal picker | `/` | Shipped |
| Customer — My Tickets | `/support` | Shipped |
| Customer — Ticket detail | `/support/SUP-xxxx` | Shipped |
| Partner — Dashboard | `/partner` | **Added** (sidebar item existed; live stats shipped later) |
| Partner — Support queue | `/partner/support` | Shipped |
| Partner — Ticket detail | `/partner/support/SUP-xxxx` | Shipped |
| WhatsApp — Mobile support chat | `/whatsapp` | **Added** |

---

## 6. Customer Portal requirements

### 6.1 Raise Ticket
- Modal with Subject, Description, optional attachments  
- On create: generate Ticket ID (`SUP-xxxx`), status **Open**, priority **Medium**, source **PORTAL**  
- Ticket appears in customer list and Partner queue  

### 6.2 My Tickets
- List of the current customer’s tickets  
- Search / status filters as implemented in the UI  

### 6.3 Ticket Detail
- Conversation timeline (customer / support / system messages)  
- Reply box with optional attachments  
- Metadata: status, priority, timestamps  

**Original (kept):** Raise Ticket, My Tickets, Ticket Detail, reply + attachments, auto Ticket ID, Open/Medium defaults.

---

## 7. Partner Portal requirements

### 7.1 Navigation
- Sidebar: **Dashboard**, **Support**

### 7.2 Dashboard (**Added**)
Live snapshot:
- Active tickets, SLA breached, Unassigned  
- WhatsApp vs Portal channel mix  
- Open / In Progress / Critical open / High open  
- Recently updated tickets  

### 7.3 Ticket List (queue)
Show at least:
- Ticket Number, Customer, Company, Subject  
- Status, Priority, **Channel (PORTAL / WHATSAPP)**  
- Last Message, Last Updated, Unread Count  

Controls: search, filters (status / priority / **source**), sort, pagination  

Layout target: list + detail similar to Freshdesk / Intercom (list page + detail page in shipped MVP).

### 7.4 Ticket Detail & actions
**Metadata:** subject, customer, company, assignee, priority, status, labels, component, timestamps, SLA fields  

**Actions (shipped):**
- Assign to Me  
- Change Status / Priority  
- Add Label(s)  
- Select Component  
- Close Ticket  
- Reply (public) and `@internal` notes  
- **Edit SLA days** (**Added**)  
- Raise Ticket for a customer (drawer): Account/Company + **Select POC** + optional **notify POC on WhatsApp** (**Added**)

---

## 8. Conversation model

| Sender type | Visible to customer | Notes |
|-------------|---------------------|-------|
| CUSTOMER | Yes | End-user / POC / site engineer |
| SUPPORT | Yes | Partner agent (“Bluconn Support”) |
| SYSTEM | Yes | Status / lifecycle notices |
| INTERNAL | No | Partner-only `@internal` notes |

**Chat orientation (**Added**):**
- Partner view: customer left, Bluconn Support right  
- Customer / WhatsApp view: customer right, Bluconn Support left  
- Clear sender naming in WhatsApp and portal threads  

Attachments persist on ticket create and on replies, and render in the thread (**strengthened vs original** — original called for attachment support; refined MVP stores and displays them).

---

## 9. Status workflow

```
Open → In Progress → Waiting for Customer → Resolved → Closed
```

| Rule | Status |
|------|--------|
| Closed is final | Kept |
| Resolved can be reopened | Kept |

---

## 10. Priority & SLA (refined)

| Priority | Default SLA | Notes |
|----------|-------------|-------|
| Low | 7 days | Kept |
| Medium | 3 days | Kept |
| High | 1 day | Kept |
| Critical | 4 hours (default days = 1) | Kept |

**UI (**Added / refined**):**
- Partner can enter **SLA as whole days** (editable)  
- **SLA Due** field shows remaining days (decrements by calendar day)  
- When breached: show red styling and negative day counts (`-1`, `-2`, …) plus breached badge  

---

## 11. Taxonomy

### Components (kept)
Attendance, Leave, Trip, Workflow, Face Attendance, Reports, Payroll, General  

### Labels
**Original:** Bug, Feature Request, Configuration, Question, Data Issue, Enhancement  

**Seed also includes (added in implementation):** Service, Knowledge Gap, Duplicate  

### Ticket source / channel (**Added**)
- `PORTAL`  
- `WHATSAPP`  

Partner queue shows channel badges and can filter by channel.

---

## 12. WhatsApp channel (**Added — now in scope**)

### 12.1 Goals
Same customers who use the Customer Portal can also raise and follow tickets from a **mobile WhatsApp chat experience**.

### 12.2 Field raise — Scenario A
1. Open `/whatsapp`  
2. User sends keyword **`Support`**  
3. Bot responds with CTA **Raise Support Ticket**  
4. CTA opens an **in-app browser** form (not an external browser)  
5. User submits subject / description / optional screenshot  
6. Ticket is created (demo path uses `SUP-2027`) with source `WHATSAPP`  
7. Chat confirms creation; later Partner replies appear as WhatsApp updates with **View & Reply**

### 12.3 Partner-raised → POC notify — Scenario B
1. Partner raises a ticket, selects Account + POC  
2. System notifies the POC on WhatsApp with ticket intro  
3. POC receives subsequent agent updates on WhatsApp  
4. POC responds via **View & Reply**  

### 12.4 WhatsApp copy (demo contract)
- Prompt: need help → button below  
- Create success includes Ticket ID  
- Update: new update on ticket + **View & Reply**  
- Reply success / thank-you follow-up messages as implemented in the demo UI  

### 12.5 Actors
| Role | Surface | Identity approach |
|------|---------|-------------------|
| Site Engineer | WhatsApp Scenario A | Seeded WhatsApp customer (e.g. `ravi.site@jmrconstructions.com`) — no POC picker |
| POC | WhatsApp Scenario B | Selected from Partner raise-ticket POC list; phones seeded (`+91 5…` series) |
| Partner Agent | Partner Portal | Demo agent `olivia@untitledui.com` |

---

## 13. Data model

| Model | Status |
|-------|--------|
| Customer | Kept |
| SupportAgent | Kept |
| Ticket | Kept (+ `source`, `slaDays`, channel-related fields) |
| TicketMessage | Kept |
| Attachment | Kept / strengthened |
| Label | Kept |
| Component | Kept |
| TicketActivity | Kept |
| StatusHistory | Kept |

### Seed targets (kept as MVP targets)
- ~20 Customers  
- 5 Agents  
- ~75 Tickets  
- ~500 Messages  

### Demo actors (refined)
- Customer portal: `shivani@bluconn.com` (fallback: first seeded customer)  
- Partner agent: `olivia@untitledui.com`  
- WhatsApp site engineer: `ravi.site@jmrconstructions.com`  

---

## 14. Non-functional / engineering constraints

- Clean architecture; reusable components; strong typing  
- Feature-based folder structure; separate UI from business logic  
- Runnable live product (DB-backed), **not** static HTML prototypes  
- Local run on port **3002** with `npm run db:setup` + `npm run dev`  
- Optional public deploy via Vercel (`docs/VERCEL_SETUP.md`)  

**Original process note:** original PRD asked to stop after each of 6 phases for approval. Delivery was end-to-end; this refined PRD does **not** require phased stop-gates for future work unless re-introduced.

---

## 15. Diff vs original PRD (summary)

### Added
- WhatsApp mobile support channel (`/whatsapp`)  
- Ticket `source` / channel field + Partner filters & badges  
- Partner live Dashboard stats  
- Real attachment persistence & rendering in threads  
- Partner raise → POC WhatsApp notify (Scenario B)  
- Field WhatsApp keyword raise (Scenario A)  
- Editable SLA days + SLA Due countdown (including red negatives)  
- Viewer-relative chat bubble orientation & clearer naming  
- SQLite for zero-setup local runs  
- Vercel / public URL setup docs  

### Changed
- Database: PostgreSQL → SQLite  
- WhatsApp: out of scope → **in scope**  
- Partner “Dashboard” sidebar item: from placeholder intent → live metrics page  

### Removed / not required for current MVP
- Hard requirement for managed PostgreSQL in local/dev  
- Strict “stop after each phase for approval” delivery gate  
- Dependency on missing Figma pixel-perfect matching for WhatsApp form (form mirrors portal raise styling when Figma assets are unavailable)  

### Still deferred / not claimed as MVP-complete
- Full production WhatsApp Business API / Meta webhook integration (current experience is a **product demo UI** wired to the same ticket store)  
- Production auth / multi-tenant RBAC / true multi-actor login switcher  
- Exact Freshdesk dual-pane (list|detail) single-screen layout if not present in current routing  

---

## 16. Acceptance demo scripts

### A. Customer Portal
1. Open `/` → Customer Portal → `/support`  
2. Raise Ticket → submit → land on detail  
3. Reply with optional attachment  

### B. Partner triage
1. Open `/partner` → view dashboard counts  
2. Open `/partner/support` → filter by status / priority / channel  
3. Open a ticket → Assign to Me → set Bug + Attendance → reply / `@internal` → update status  

### C. WhatsApp Scenario A
1. `/whatsapp?scenario=a` (or plain `/whatsapp`)  
2. Send `Support` → Raise → Create → confirmation  
3. Partner updates ticket → return to WhatsApp → View & Reply  

### D. WhatsApp Scenario B
1. Partner raises ticket for a POC with WhatsApp notify  
2. Open POC WhatsApp deep-link / Scenario B entry  
3. Confirm POC received intro and can View & Reply  

---

## 17. Out of scope (refined)

- Native Meta WhatsApp Business Cloud API production webhooks  
- Billing / SLA contracts beyond countdown UX  
- Email / SMS channels  
- Full SSO / org admin console  
- Mobile native apps (WhatsApp surface is a web mobile simulation)  

---

## 18. Document history

| Version | Notes |
|---------|-------|
| 1.0 | Original *Bluconn Support MVP PRD for Cursor* (Customer + Partner only; WhatsApp ignored) |
| 1.1 | **This refined PRD** — aligns requirements with shipped Customer + Partner + WhatsApp MVP and subsequent enhancements |

---

## 19. Where this lives in the repo

- Markdown: `docs/Bluconn_Support_MVP_PRD_Refined.md`  
- Printable HTML: `docs/Bluconn_Support_MVP_PRD_Refined.html`  
- PDF: `docs/Bluconn_Support_MVP_PRD_Refined.pdf`  

Implementation reference branch: `cursor/support-mvp-enhancements-c3a0`

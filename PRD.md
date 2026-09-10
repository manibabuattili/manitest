# Product Requirements: Workflow Value & Impact

**For:** Bluconn leadership  
**Where:** Partner Portal  
**Goal:** Show customers, in simple numbers, what they get back from Bluconn workflows.

---

## The idea

Customers pay Bluconn for workflows. This product answers:

1. What did we assume about the old way of working?  
2. What happened on each run?  
3. What is the value and ROI right now?  
4. What if more people started using it?

**One rule:** every workflow uses the same math. Change the assumptions on Workflows, and Flow Tracking, Analytics, and Potential all update.

Users can always filter by **account**, **workflow** (all or one/several), and **date range**.

---

## Section 1 — Workflows (configure)

This is where value settings live. They stay **always editable**.

For each workflow on an account, the customer (or Bluconn) can open Edit and change:

| Field | Meaning |
| --- | --- |
| Primary persona | Who used to do this work (e.g. Site Engineer) |
| Manual effort (minutes) | How long the old process took |
| Hourly cost (₹) | What that person’s time is worth |
| Bluconn monthly charge (₹) | What we bill for this workflow |

Workflow name is shown, not edited here.

**Why it matters:** these four numbers turn “a run happened” into “hours and rupees saved.” If they are wrong, ROI is wrong. They can be corrected anytime; nothing is locked.

---

## Section 2 — Flow Tracking (the table)

A run-by-run table for the selected account, workflows, and dates.

**Existing columns (what happened)**

- Employee  
- Workflow  
- When it ran  
- Actual duration (minutes on Bluconn)

**New columns (the value we add)**

- Manual effort (minutes) — from Workflows config  
- Time saved (minutes)  
- Hourly cost (₹) — from Workflows config  
- Amount saved (₹)

**How each new column is calculated**

> **Time saved** = manual minutes − actual minutes  
> If Bluconn took longer than the old way, we show **0**. We never show negative savings.

> **Amount saved** = (time saved ÷ 60) × hourly cost

**Example:** DPR used to take 30 minutes. On Bluconn it took 22 minutes. Hourly cost is ₹300.

- Time saved = 8 minutes  
- Amount saved = 8 ÷ 60 × 300 = **₹40**

The table footer totals executions, hours saved, and rupees saved for whatever filters are on.

---

## Section 3 — Analytics (the leadership page)

A summary **subpage** for the same filters: account, individual workflows or all, and dates.

### Quick metric cards

| Card | What it shows |
| --- | --- |
| Usage | How many times the selected workflow(s) ran |
| Active users | How many distinct people ran them |
| Adoption | Active users as a share of that account’s employees |
| Time saved | Total hours of manual work avoided |
| Amount saved | Total rupee value of that time |
| ROI | Return vs what Bluconn charges (see below) |

### Charts

Same numbers, as pictures, so a review can stay on one screen:

- Usage over the date range (runs per day)  
- Active users / adoption trend  
- Time saved over time  
- Amount saved over time  
- Value by workflow (which workflow is doing the heavy lifting)  
- ROI for the current filter (updates when charges or filters change)

### How to get ROI

On this page there is an **editable amount: what Bluconn charges the customer** for the workflow(s) currently selected.

- Default suggestion = the monthly charges set on those workflows in Section 1  
- The user can type a different commercial number (bundle discount, custom quote, etc.)  
- ROI uses **that** number against **amount saved** for the same filters  

> ROI % = (amount saved − Bluconn charges) ÷ Bluconn charges × 100  
> In words: “₹X of value for every ₹1 charged”

If charges are 0, we do not show a fake ROI.

**Example:** amount saved ₹1,75,000; Bluconn charges ₹50,000 → ROI **250%** (₹3.50 back per ₹1).

Change the account, pick only Face Attendance, or shorten the dates — cards, charts, and ROI all follow.

---

## Section 4 — Potential (what if more people used it?)

A planning view on top of the same filters and the same Bluconn charge used for ROI.

The user chooses a workflow and two assumptions:

- **Additional new users** (people who do not use it today)  
- **How often each person would run it** (we suggest today’s average; they can change it)

**How projection is calculated**

> Extra runs = additional users × runs per person  
> Projected runs = current runs + extra runs  
> Projected time / money = projected runs × today’s average saving per run  
> Projected ROI = same formula as Analytics, **same Bluconn charges**

We show **today vs after extra users** side by side (users, runs, hours, rupees, ROI) plus the extra value unlocked.

This is a planning model, not a guarantee. It assumes new users behave like current users.

---

## How the four sections connect

```
Workflows (editable assumptions)
        ↓
Flow Tracking (each run: time saved + ₹ saved)
        ↓
Analytics (totals, charts, ROI vs Bluconn charges)
        ↓
Potential (same math, extra users)
```

---

## Honest use of the numbers

These are **estimated productivity value** at the customer’s own rates, compared with what they pay Bluconn. They are not cash in the bank unless the customer reduces overtime or headcount.

That is still the right leadership story: *labour time returned to the operation, valued at agreed rates, versus what Bluconn charges.*

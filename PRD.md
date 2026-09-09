# Product Requirements: Workflow Value & Impact Dashboard

**Audience:** Bluconn leadership and customer-facing leads  
**Product:** Partner Portal — Value & Impact  
**Status:** Working prototype with sample customer data

---

## 1. Why this exists

Customers often ask a simple question:

> “We are paying Bluconn for these workflows. What are we actually getting back?”

Today that answer is hard to give. We can show usage, but not **time saved**, **rupee value**, or **ROI**.

This dashboard makes workflow value visible, so account owners and Bluconn teams can:

- See which workflows are saving time and money
- Defend the commercial investment with a clear ROI
- Decide where to push more employee adoption

**One rule:** the **workflow** is the unit of value. Attendance, DPR, material request, and trip all use the same logic.

---

## 2. Who it is for

| Who | What they need |
| --- | --- |
| Customer leadership (ops, finance, CXO) | A simple ROI and “are we getting value?” view |
| Customer admins / process owners | Set realistic effort and cost assumptions per workflow |
| Bluconn partner / CS / sales | A story they can walk through with the customer |

The first version lives in the **Partner Portal**, by account (e.g. Trans Concrete).

---

## 3. What we should deliver

Four connected views. Users pick an **account**, a **date range**, and optionally **which workflows**.

### 3.1 Workflows — set the assumptions

For each workflow, the customer records:

- **Who does this work today** (persona), e.g. Site Engineer
- **How long it took manually** (minutes)
- **What that person’s time is worth** (₹ per hour)
- **What Bluconn charges** for this workflow per month

These numbers are the “rules of the game.” Change them, and every later number updates.

Without this step, we cannot turn executions into rupees.

### 3.2 Flow Tracking — value of each run

A list of real (or sample) runs:

- Who ran it, which workflow, when
- How long Bluconn actually took
- How long it would have taken manually
- Time saved
- Rupees saved on that run

This is the evidence layer. Leadership may not live here, but CS and ops will.

### 3.3 Analytics — the leadership view

A one-screen summary for the selected period:

- How many times workflows ran
- Total hours of manual work avoided
- Estimated productivity value in ₹
- What the customer is investing
- **Current ROI**
- Which workflows contribute the most value

This is the page to open in a customer review.

### 3.4 Value Potential — “what if more people used it?”

Pick one workflow and model:

- How many extra employees start using it
- How often each person would use it

The product then shows **today vs after extra adoption**: more runs, more hours saved, more rupees, and a new ROI — using the **same** customer investment.

This answers: *Where should we push adoption next?*

---

## 4. How the numbers are calculated

All math is the same for every workflow. No hidden scoring.

### Step 1 — Time saved on one run

Compare **manual time** (from Workflows) with **actual Bluconn time**.

> Time saved = manual minutes − actual minutes  
> If Bluconn took longer than the old process, time saved is **zero** (we never show a negative saving).

**Example — DPR Entry**

| | |
| --- | --- |
| Manual effort | 30 minutes |
| Actual on Bluconn | 22 minutes |
| Time saved | **8 minutes** |

If a run took 50 minutes and manual was 45, time saved is **0**, not −5.

### Step 2 — Rupees saved on one run

Turn those minutes into money using the hourly cost for that role.

> Amount saved = (time saved in minutes ÷ 60) × hourly cost

**Same DPR example**

- 8 minutes saved  
- Hourly cost ₹300  
- Amount saved = 8 ÷ 60 × 300 = **₹40**

**Attendance example**

- Manual 20 min, actual 18 min → 2 min saved  
- Hourly cost ₹250  
- Amount saved = 2 ÷ 60 × 250 = **₹8.33**

### Step 3 — Totals for the period (Analytics)

For the account, dates, and workflows chosen:

| Metric | Meaning |
| --- | --- |
| Executions | How many times the workflow(s) ran |
| Hours saved | All time saved, added up, shown in hours |
| Productivity value | All rupee savings, added up |
| Work days saved | Hours saved ÷ 8 (a simple 8-hour day) |

### Step 4 — ROI

The customer (or Bluconn) enters **Customer Investment** — typically the monthly Bluconn charge for the workflows in view.

> ROI % = (productivity value − investment) ÷ investment × 100

We also say it in words:

> “₹X of value for every ₹1 invested”

**Example**

| | |
| --- | --- |
| Productivity value | ₹1,75,000 |
| Customer investment | ₹50,000 |
| Net value | ₹1,25,000 |
| ROI | **250%** |
| In words | **₹3.50 of value for every ₹1 invested** |

If investment is **0**, ROI is not shown. We do not invent a percentage.

**How to read ROI**

- **Positive ROI** — productivity value is higher than what they pay  
- **Negative ROI** — in this period, value is still below the fee (common if you look at one small workflow against a large fee, or a short date range)

The fee is a **period cost**. Savings add up with usage. A thin week can look weak; a full month of adoption looks stronger. That is expected and useful in conversation.

### Step 5 — Value potential (future adoption)

We take **today’s actuals** for the chosen workflow (users, runs, average saving per run).

The user then says:

- **Additional people** who would start using it  
- **Runs per person per month** (we suggest the current average; they can change it)

> Extra runs = extra people × runs per person  
> Projected runs = current runs + extra runs  
> Projected hours / rupees = scale today’s average saving per run  
> Projected ROI = same formula, **same investment**, new productivity value

**Simple example**

| | Today | With 5 more users |
| --- | --- | --- |
| Active users | 2 | 7 |
| Executions | 1,000 | 3,500 |
| Time saved | 500 hrs | 1,750 hrs |
| Value | ₹1,50,000 | ₹5,25,000 |
| Extra value | | **+ ₹3,75,000** |

This is a **planning model**, not a guarantee. It assumes new users behave like current users.

---

## 5. What the customer must configure (and why it matters)

| Assumption | Why it matters |
| --- | --- |
| Manual effort | If this is too high, we overstate savings. If too low, we understate them. |
| Hourly cost | Turns time into rupees. Should match the role that actually did the work. |
| Monthly charge | The “investment” side of ROI. Can be one workflow or the bundle in view. |

These are **business inputs**, not system measurements. Actual duration comes from usage. Assumptions should be agreed with the customer, then left stable so month-to-month ROI is comparable.

---

## 6. How people should use it (review motion)

1. Open the customer’s **account**.  
2. Confirm **workflow assumptions** (or set them once in onboarding).  
3. Look at **Analytics** for the last week or month — ROI and which workflows pull the weight.  
4. Spot-check **Flow Tracking** if a number looks surprising.  
5. On **Value Potential**, test “what if 20 more people used Face Attendance?”  
6. Agree an adoption action, then come back next month and compare.

---

## 7. Guardrails (so numbers stay honest)

- Time saved **cannot go below zero**. A slow run does not “owe” us minutes.  
- ROI **cannot be calculated** without an investment amount.  
- Extra users **cannot exceed** remaining eligible headcount (total employees minus people already using it).  
- Filters (account, workflow, dates) must **recalculate everything** so leadership never sees a stale total.

---

## 8. Success looks like

A Bluconn lead can sit with a customer and, in one sitting:

1. Show configured workflows and the effort/cost story  
2. Show execution-level savings (not only a vanity count of runs)  
3. Enter the commercial investment and see ROI update immediately  
4. Filter to one workflow or one week and still trust the totals  
5. Model more adoption and leave with a number: extra hours and extra rupees  

If those five things work, the product has done its job.

---

## 9. In scope vs later

**This version (the requirement)**

- Multi-account view in the partner portal  
- Four workflows per account with sample usage (so the story is demo-ready)  
- The four views above and the formulas in section 4  
- Layout aligned with the existing Bluconn partner portal (workflows, flow tracking, analytics)

**Not this version (hub cards we can show but not fully productise yet)**

- Cross-account performance as a full product  
- Daily signups  
- Re-engagement campaigns  

Those can stay as “coming next” so we do not mix usage marketing metrics with **workflow ROI**.

---

## 10. Recommendation for leadership

Treat this as a **commercial conversation tool**, not a finance system of record.

- Savings are **estimated productivity value**, based on agreed time and rate.  
- They are not cash recovered unless the customer reduces headcount or overtime.  
- The right customer message is: *“This is the labour time we are putting back into the operation, valued at your own rates, compared with what you pay Bluconn.”*

That is a story CS, sales, and leadership can all stand behind — as long as assumptions are explicit and the math stays this simple.

# Bluconn Workflow Value & Impact Dashboard

Partner-portal style React app that measures workflow efficiency, rupee value of time saved, ROI, and future adoption potential.

Leadership overview (what we deliver and how value is calculated): see **[PRD.md](./PRD.md)**.

## Run locally

```bash
npm install
npm run dev
```

Open the URL Vite prints (default `http://localhost:5173`).

## Sections

| Nav | What it does |
| --- | --- |
| **Workflows** | Always-editable effort, hourly cost, persona, Bluconn charge |
| **Flow Tracking** | Run table plus time saved and amount saved |
| **Analytics** | Metric cards, charts, account/workflow/date filters, ROI from editable Bluconn charges |
| **Value Potential** | Project extra users and usage |

Account, workflow, and date filters sit on Flow Tracking and Analytics. Changing workflow config immediately recalculates tracking and ROI.

## Partner portal reference screenshots

Visual references used for layout (Workflows cards, Flow Tracking table, Analytics):

- `public/reference-screenshots/workflows-assign.png`
- `public/reference-screenshots/flow-tracking-results.png`
- `public/reference-screenshots/analytics-dashboard.png`
- `public/reference-screenshots/analytics-category-hub.png`
- `public/reference-screenshots/employee-activity.png`

## Mock data

Three accounts (Trans Concrete, XYZ Construction, Metro Infra). Four workflows each. ~80–140 executions per workflow from 1–9 Sep 2026.

Customer investment is stored in `localStorage` per account. Workflow edits are persisted the same way.

## Formulas

- Time saved (min) = `max(0, manual effort − actual duration)`
- Amount saved = `(time saved / 60) × hourly cost`
- ROI = `(productivity value − investment) / investment × 100`

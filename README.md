# Bluconn Workflow Value & Impact Dashboard

Partner-portal style React app that measures workflow efficiency, rupee value of time saved, ROI, and future adoption potential.

## Run locally

```bash
npm install
npm run dev
```

Open the URL Vite prints (default `http://localhost:5173`).

## Sections

| Nav | What it does |
| --- | --- |
| **Workflows** | Assigned workflow cards, edit persona / manual effort / hourly cost / monthly charge |
| **Dashboards** | KPI cards, customer investment, ROI, value-by-workflow |
| **Analytics** | Category hub (Flow Tracking, Employee Activity, and related cards) |
| **Value Potential** | Project extra users and usage |

Account, workflow, and date filters sit on Flow Tracking and Analytics. Changing workflow config immediately recalculates tracking and ROI.

## Partner portal reference screenshots

Visual references used for layout (Workflows cards, Flow Tracking table, Analytics hub):

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

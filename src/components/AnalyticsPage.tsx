import {
  Banknote,
  Clock3,
  IndianRupee,
  ListChecks,
  TrendingUp,
  Users,
} from 'lucide-react'
import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { useDashboard } from '../context/DashboardContext'
import type { WorkflowBreakdown } from '../types'
import { roiMultiple, uniqueEmployees } from '../utils/calculations'
import {
  formatHours,
  formatINR,
  formatNumber,
  formatPercent,
  workDaysFromHours,
} from '../utils/format'
import { DashboardFilters } from './FilterControls'

type SortKey = keyof Pick<
  WorkflowBreakdown,
  | 'workflow_name'
  | 'executions'
  | 'time_saved_minutes'
  | 'amount_saved'
  | 'avg_value_per_execution'
>

export function AnalyticsPage() {
  const {
    accountWorkflows,
    analytics,
    customerInvestment,
    setCustomerInvestment,
    filters,
    filteredExecutions,
    selectedAccount,
  } = useDashboard()

  const [investmentInput, setInvestmentInput] = useState(
    String(customerInvestment || ''),
  )
  const [sortKey, setSortKey] = useState<SortKey>('amount_saved')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')

  const suggestedCharge = useMemo(() => {
    const selected =
      filters.workflowIds.length > 0
        ? accountWorkflows.filter((w) => filters.workflowIds.includes(w.id))
        : accountWorkflows
    return selected.reduce((s, w) => s + w.bluconn_monthly_charge, 0)
  }, [accountWorkflows, filters.workflowIds])

  useEffect(() => {
    setCustomerInvestment(suggestedCharge)
    setInvestmentInput(String(suggestedCharge))
  }, [suggestedCharge, setCustomerInvestment])

  const saveInvestment = (raw: string) => {
    const n = Number(raw)
    if (Number.isNaN(n) || n < 0) return
    setCustomerInvestment(n)
  }

  const activeUsers = uniqueEmployees(filteredExecutions)
  const adoptionPct =
    selectedAccount.employees_count > 0
      ? (activeUsers / selectedAccount.employees_count) * 100
      : 0
  const multiple = roiMultiple(analytics.totalAmountSaved, customerInvestment)

  const breakdown = useMemo(() => {
    const rows = [...analytics.valueByWorkflow]
    rows.sort((a, b) => {
      const av = a[sortKey]
      const bv = b[sortKey]
      if (typeof av === 'number' && typeof bv === 'number') {
        return sortDir === 'asc' ? av - bv : bv - av
      }
      return sortDir === 'asc'
        ? String(av).localeCompare(String(bv))
        : String(bv).localeCompare(String(av))
    })
    return rows
  }, [analytics.valueByWorkflow, sortKey, sortDir])

  const daily = useMemo(
    () => buildDailySeries(filteredExecutions, filters.startDate, filters.endDate),
    [filteredExecutions, filters.startDate, filters.endDate],
  )

  const selectedLabel =
    filters.workflowIds.length === 0
      ? 'All workflows'
      : accountWorkflows
          .filter((w) => filters.workflowIds.includes(w.id))
          .map((w) => w.name)
          .join(', ')

  return (
    <div>
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-slate-900">Analytics</h1>
        <p className="text-sm text-slate-500">
          Usage, adoption, time saved, amount saved, and ROI for{' '}
          {selectedAccount.name} · {selectedLabel} · {filters.startDate} to{' '}
          {filters.endDate}
        </p>
      </div>

      <DashboardFilters />

      <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
        <Kpi
          icon={ListChecks}
          label="Usage"
          value={formatNumber(analytics.totalExecutions)}
          sub="Workflow runs in this filter"
        />
        <Kpi
          icon={Users}
          label="Active users"
          value={formatNumber(activeUsers)}
          sub={`of ${formatNumber(selectedAccount.employees_count)} employees`}
        />
        <Kpi
          icon={TrendingUp}
          label="Adoption"
          value={formatPercent(adoptionPct)}
          sub="Active users ÷ employees in this account"
        />
        <Kpi
          icon={Clock3}
          label="Time saved"
          value={formatHours(analytics.totalTimeSavedHours)}
          sub={`≈ ${workDaysFromHours(analytics.totalTimeSavedHours)} work days`}
        />
        <Kpi
          icon={IndianRupee}
          label="Amount saved"
          value={formatINR(analytics.totalAmountSaved)}
          sub="Productivity value at hourly costs"
          tone="success"
        />
        <label className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="mb-2 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
            <Banknote size={16} className="text-[#17A2B8]" />
            Bluconn charges (₹)
          </div>
          <input
            type="number"
            min={0}
            className="w-full border-0 p-0 text-2xl font-bold text-slate-900 outline-none"
            placeholder="Enter what Bluconn charges"
            value={investmentInput}
            onChange={(e) => {
              setInvestmentInput(e.target.value)
              saveInvestment(e.target.value)
            }}
          />
          <div className="mt-1 text-xs text-slate-500">
            Editable. Used only for ROI. Suggested from selected workflow monthly
            charges: {formatINR(suggestedCharge)}
          </div>
          <div className="mt-3 text-sm text-slate-600">
            ROI:{' '}
            <span
              className={`text-xl font-bold ${
                (analytics.currentROI ?? 0) < 0 ? 'text-[#DC3545]' : 'text-[#28A745]'
              }`}
            >
              {customerInvestment > 0 ? formatPercent(analytics.currentROI) : 'Enter charges'}
            </span>
          </div>
        </label>
      </div>

      <div
        className={`mb-4 overflow-hidden rounded-xl p-5 text-white shadow-sm ${
          (analytics.currentROI ?? 0) < 0
            ? 'bg-gradient-to-r from-[#DC3545] to-[#9b1c28]'
            : 'bg-gradient-to-r from-[#17A2B8] to-[#0F5F73]'
        }`}
      >
        <div className="text-xs font-semibold uppercase tracking-widest text-white/80">
          ROI for this account, workflow set, and dates
        </div>
        {customerInvestment > 0 ? (
          <>
            <div className="mt-1 text-4xl font-bold">
              {formatPercent(analytics.currentROI)}
            </div>
            <p className="mt-2 max-w-xl text-sm text-white/90">
              (Amount saved − Bluconn charges) ÷ Bluconn charges × 100
            </p>
            {multiple !== null && (
              <p className="mt-1 text-sm font-medium">
                {formatINR(multiple, true)} of value for every ₹1 charged
              </p>
            )}
            <div className="mt-4 grid gap-2 text-sm sm:grid-cols-3">
              <div>
                Amount saved:{' '}
                <strong>{formatINR(analytics.totalAmountSaved)}</strong>
              </div>
              <div>
                Bluconn charges:{' '}
                <strong>{formatINR(customerInvestment)}</strong>
              </div>
              <div>
                Net:{' '}
                <strong>
                  {formatINR(analytics.totalAmountSaved - customerInvestment)}
                </strong>
              </div>
            </div>
          </>
        ) : (
          <p className="mt-3 text-lg font-medium">
            Enter what Bluconn charges the customer to see ROI.
          </p>
        )}
      </div>

      <div className="mb-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <ChartCard title="Usage — runs per day">
          <MiniBars
            rows={daily.map((d) => ({
              label: d.label,
              value: d.executions,
              tip: `${d.iso}: ${d.executions} runs`,
            }))}
          />
        </ChartCard>
        <ChartCard title="Active users — unique people per day">
          <MiniBars
            color="#0F5F73"
            rows={daily.map((d) => ({
              label: d.label,
              value: d.users,
              tip: `${d.iso}: ${d.users} people`,
            }))}
          />
        </ChartCard>
        <ChartCard title="Time saved — hours per day">
          <MiniBars
            color="#28A745"
            rows={daily.map((d) => ({
              label: d.label,
              value: d.timeHours,
              tip: `${d.iso}: ${d.timeHours.toFixed(1)} hrs`,
            }))}
          />
        </ChartCard>
        <ChartCard title="Amount saved — ₹ per day">
          <MiniBars
            color="#138496"
            rows={daily.map((d) => ({
              label: d.label,
              value: d.amount,
              tip: `${d.iso}: ${formatINR(d.amount)}`,
            }))}
          />
        </ChartCard>
      </div>

      <ChartCard title="Amount saved by workflow">
        <MiniBars
          color="#17A2B8"
          rows={breakdown.map((row) => ({
            label: row.workflow_name,
            value: row.amount_saved,
            tip: `${row.workflow_name}: ${formatINR(row.amount_saved)}`,
          }))}
        />
      </ChartCard>

      <div className="mt-4 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-4 py-3 text-sm font-semibold">
          Value by workflow (same filters)
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-[720px] w-full text-left text-sm">
            <thead className="bg-[#F5F7FA] text-[11px] uppercase tracking-wide text-slate-500">
              <tr>
                {(
                  [
                    ['workflow_name', 'Workflow'],
                    ['executions', 'Usage'],
                    ['time_saved_minutes', 'Time saved (hrs)'],
                    ['amount_saved', 'Amount saved (₹)'],
                    ['avg_value_per_execution', 'Avg value / run'],
                  ] as [SortKey, string][]
                ).map(([key, label]) => (
                  <th key={key} className="px-3 py-3">
                    <button
                      className="font-semibold hover:text-[#17A2B8]"
                      onClick={() => {
                        if (sortKey === key)
                          setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
                        else {
                          setSortKey(key)
                          setSortDir('desc')
                        }
                      }}
                    >
                      {label}
                    </button>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {breakdown.map((row) => (
                <tr key={row.workflow_id} className="border-t border-slate-100">
                  <td className="px-3 py-2 font-medium">{row.workflow_name}</td>
                  <td className="px-3 py-2">{formatNumber(row.executions)}</td>
                  <td className="px-3 py-2">
                    {formatNumber(row.time_saved_minutes / 60, 1)}
                  </td>
                  <td
                    className={`px-3 py-2 font-medium ${
                      row.amount_saved > 0 ? 'text-[#28A745]' : 'text-slate-400'
                    }`}
                  >
                    {formatINR(row.amount_saved)}
                  </td>
                  <td className="px-3 py-2">
                    {formatINR(row.avg_value_per_execution, true)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

function ChartCard({
  title,
  children,
}: {
  title: string
  children: ReactNode
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <h2 className="mb-3 text-sm font-semibold text-slate-800">{title}</h2>
      {children}
    </div>
  )
}

function MiniBars({
  rows,
  color = '#17A2B8',
}: {
  rows: { label: string; value: number; tip: string }[]
  color?: string
}) {
  const max = Math.max(1, ...rows.map((r) => r.value))
  if (rows.length === 0) {
    return <p className="text-sm text-slate-500">No data in this filter.</p>
  }
  return (
    <div className="flex h-40 items-end gap-1 overflow-x-auto">
      {rows.map((d) => {
        const h = Math.max(d.value > 0 ? 6 : 2, (d.value / max) * 130)
        return (
          <div
            key={d.label}
            className="flex min-w-[28px] flex-1 flex-col items-center gap-1"
            title={d.tip}
          >
            <div className="w-full rounded-t" style={{ height: `${h}px`, background: color }} />
            <span className="max-w-full truncate text-[10px] text-slate-500">
              {d.label}
            </span>
          </div>
        )
      })}
    </div>
  )
}

function Kpi({
  icon: Icon,
  label,
  value,
  sub,
  tone,
}: {
  icon: typeof ListChecks
  label: string
  value: string
  sub: string
  tone?: 'success'
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-2 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#e6f6f8] text-[#17A2B8]">
          <Icon size={16} />
        </span>
        {label}
      </div>
      <div
        className={`text-2xl font-bold ${
          tone === 'success' ? 'text-[#28A745]' : 'text-slate-900'
        }`}
      >
        {value}
      </div>
      <div className="mt-1 text-xs text-slate-500">{sub}</div>
    </div>
  )
}

function buildDailySeries(
  execs: {
    executed_at: string
    employee_id: string
    time_saved_minutes: number
    amount_saved: number
  }[],
  startDate: string,
  endDate: string,
) {
  const map = new Map<
    string,
    { executions: number; users: Set<string>; timeMin: number; amount: number }
  >()
  const cursor = new Date(`${startDate}T00:00:00Z`)
  const last = new Date(`${endDate}T00:00:00Z`)
  while (cursor <= last) {
    map.set(cursor.toISOString().slice(0, 10), {
      executions: 0,
      users: new Set(),
      timeMin: 0,
      amount: 0,
    })
    cursor.setUTCDate(cursor.getUTCDate() + 1)
  }
  for (const e of execs) {
    const key = e.executed_at.slice(0, 10)
    const bucket = map.get(key)
    if (!bucket) continue
    bucket.executions += 1
    bucket.users.add(e.employee_id)
    bucket.timeMin += e.time_saved_minutes
    bucket.amount += e.amount_saved
  }
  return [...map.entries()].map(([iso, b]) => ({
    iso,
    label: iso.slice(8),
    executions: b.executions,
    users: b.users.size,
    timeHours: b.timeMin / 60,
    amount: b.amount,
  }))
}

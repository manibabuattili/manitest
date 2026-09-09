import { Banknote, Clock3, IndianRupee, ListChecks } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useDashboard } from '../context/DashboardContext'
import type { WorkflowBreakdown } from '../types'
import { roiMultiple } from '../utils/calculations'
import {
  formatHours,
  formatINR,
  formatNumber,
  formatPercent,
  workDaysFromHours,
} from '../utils/format'
import { Field, GhostButton, FiltersBar, PrimaryButton, inputClass } from './ui'

type SortKey = keyof Pick<
  WorkflowBreakdown,
  'workflow_name' | 'executions' | 'time_saved_minutes' | 'amount_saved' | 'avg_value_per_execution'
>

export function AnalyticsPage() {
  const {
    accountWorkflows,
    analytics,
    customerInvestment,
    setCustomerInvestment,
    filters,
    setWorkflowIds,
    setDateRange,
    clearWorkflowFilter,
    filteredExecutions,
    selectedAccount,
  } = useDashboard()

  const [draftWorkflows, setDraftWorkflows] = useState<string[]>(
    filters.workflowIds,
  )
  const [draftStart, setDraftStart] = useState(filters.startDate)
  const [draftEnd, setDraftEnd] = useState(filters.endDate)
  const [investmentInput, setInvestmentInput] = useState(
    String(customerInvestment || ''),
  )

  useEffect(() => {
    setDraftWorkflows(filters.workflowIds)
    setDraftStart(filters.startDate)
    setDraftEnd(filters.endDate)
  }, [filters.workflowIds, filters.startDate, filters.endDate])

  useEffect(() => {
    setInvestmentInput(String(customerInvestment || ''))
  }, [customerInvestment, filters.accountId])
  const [sortKey, setSortKey] = useState<SortKey>('amount_saved')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')

  const suggestedCharge = useMemo(() => {
    const selected =
      filters.workflowIds.length > 0
        ? accountWorkflows.filter((w) => filters.workflowIds.includes(w.id))
        : accountWorkflows
    return selected.reduce((s, w) => s + w.bluconn_monthly_charge, 0)
  }, [accountWorkflows, filters.workflowIds])

  const apply = () => {
    setWorkflowIds(draftWorkflows)
    setDateRange(draftStart, draftEnd)
  }

  const saveInvestment = (raw: string) => {
    const n = Number(raw)
    if (Number.isNaN(n) || n < 0) return
    setCustomerInvestment(n)
  }

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

  return (
    <div>
      <div className="mb-4 flex flex-col gap-1 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Analytics Dashboard</h1>
          <p className="text-sm text-slate-500">
            Consolidated ROI for {selectedAccount.name} · {filters.startDate} to{' '}
            {filters.endDate}
          </p>
        </div>
      </div>

      <FiltersBar>
        <Field label="Workflows">
          <select
            multiple
            className={`${inputClass()} h-24`}
            value={draftWorkflows}
            onChange={(e) =>
              setDraftWorkflows(
                Array.from(e.target.selectedOptions).map((o) => o.value),
              )
            }
          >
            {accountWorkflows.map((w) => (
              <option key={w.id} value={w.id}>
                {w.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="From date">
          <input
            type="date"
            className={inputClass()}
            value={draftStart}
            onChange={(e) => setDraftStart(e.target.value)}
          />
        </Field>
        <Field label="To date">
          <input
            type="date"
            className={inputClass()}
            value={draftEnd}
            onChange={(e) => setDraftEnd(e.target.value)}
          />
        </Field>
        <div className="flex gap-2">
          <PrimaryButton type="button" onClick={apply}>
            Apply filters
          </PrimaryButton>
          <GhostButton
            type="button"
            onClick={() => {
              setDraftWorkflows([])
              setDraftStart('2026-09-01')
              setDraftEnd('2026-09-09')
              clearWorkflowFilter()
              setDateRange('2026-09-01', '2026-09-09')
            }}
          >
            Clear
          </GhostButton>
        </div>
      </FiltersBar>

      <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi
          icon={ListChecks}
          label="Completed Executions"
          value={formatNumber(analytics.totalExecutions)}
          sub="in selected period"
        />
        <Kpi
          icon={Clock3}
          label="Manual Effort Avoided"
          value={formatHours(analytics.totalTimeSavedHours)}
          sub={`≈ ${workDaysFromHours(analytics.totalTimeSavedHours)} work days saved`}
        />
        <Kpi
          icon={IndianRupee}
          label="Estimated Productivity Value"
          value={formatINR(analytics.totalAmountSaved)}
          sub="Based on hourly costs"
          tone="success"
        />
        <label className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="mb-2 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
            <Banknote size={16} className="text-[#17A2B8]" />
            Customer Investment
          </div>
          <input
            type="number"
            min={0}
            className="w-full border-0 p-0 text-2xl font-bold text-slate-900 outline-none"
            placeholder="Enter ₹ amount"
            value={investmentInput}
            onChange={(e) => {
              setInvestmentInput(e.target.value)
              saveInvestment(e.target.value)
            }}
          />
          <div className="mt-1 text-xs text-slate-500">
            Monthly charge for selected workflows · saved per account
          </div>
          <button
            type="button"
            className="mt-2 text-xs font-medium text-[#17A2B8] hover:underline"
            onClick={() => {
              setInvestmentInput(String(suggestedCharge))
              setCustomerInvestment(suggestedCharge)
            }}
          >
            Use selected workflow charges ({formatINR(suggestedCharge)})
          </button>
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
          Current ROI
        </div>
        {customerInvestment > 0 ? (
          <>
            <div className="mt-1 text-4xl font-bold">
              {formatPercent(analytics.currentROI)}
            </div>
            <p className="mt-2 max-w-xl text-sm text-white/90">
              Formula: (Productivity Value − Investment) / Investment × 100
            </p>
            {multiple !== null && (
              <p className="mt-1 text-sm font-medium">
                {formatINR(multiple, true)} of value generated for every ₹1
                invested
              </p>
            )}
            <div className="mt-4 grid gap-2 text-sm sm:grid-cols-3">
              <div>
                Productivity Value:{' '}
                <strong>{formatINR(analytics.totalAmountSaved)}</strong>
              </div>
              <div>
                Customer Investment:{' '}
                <strong>{formatINR(customerInvestment)}</strong>
              </div>
              <div>
                Net Value:{' '}
                <strong>
                  {formatINR(analytics.totalAmountSaved - customerInvestment)}
                </strong>
              </div>
            </div>
          </>
        ) : (
          <p className="mt-3 text-lg font-medium">
            ROI cannot be calculated. Enter a customer investment greater than
            0.
          </p>
        )}
      </div>

      <div className="mb-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="mb-3 text-sm font-semibold text-slate-800">
          Flow Tracking — executions per day
        </h2>
        <div className="flex h-44 items-end gap-2">
          {daily.map((d) => {
            const max = dailyMax(daily)
            const barH = Math.max(d.count > 0 ? 8 : 2, (d.count / max) * 140)
            return (
              <div key={d.label} className="flex flex-1 flex-col items-center gap-1">
                <div
                  className="w-full rounded-t bg-[#17A2B8]"
                  style={{ height: `${barH}px` }}
                  title={`${d.iso}: ${d.count}`}
                />
                <span className="text-[10px] text-slate-500">{d.label}</span>
              </div>
            )
          })}
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-4 py-3 text-sm font-semibold">
          Value by workflow
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-[720px] w-full text-left text-sm">
            <thead className="bg-[#F5F7FA] text-[11px] uppercase tracking-wide text-slate-500">
              <tr>
                {(
                  [
                    ['workflow_name', 'Workflow'],
                    ['executions', 'Executions'],
                    ['time_saved_minutes', 'Time Saved (hrs)'],
                    ['amount_saved', 'Amount Saved (₹)'],
                    ['avg_value_per_execution', 'Avg Value/Execution'],
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
  execs: { executed_at: string }[],
  startDate: string,
  endDate: string,
) {
  const map = new Map<string, number>()
  const cursor = new Date(`${startDate}T00:00:00Z`)
  const last = new Date(`${endDate}T00:00:00Z`)
  while (cursor <= last) {
    map.set(cursor.toISOString().slice(0, 10), 0)
    cursor.setUTCDate(cursor.getUTCDate() + 1)
  }
  for (const e of execs) {
    const key = e.executed_at.slice(0, 10)
    if (map.has(key)) map.set(key, (map.get(key) ?? 0) + 1)
  }
  return [...map.entries()].map(([iso, count]) => ({
    iso,
    label: iso.slice(8),
    count,
  }))
}

function dailyMax(rows: { count: number }[]) {
  return Math.max(1, ...rows.map((r) => r.count))
}

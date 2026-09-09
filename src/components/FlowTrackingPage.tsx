import { useEffect, useMemo, useState } from 'react'
import { useDashboard } from '../context/DashboardContext'
import type { EnrichedExecution } from '../types'
import {
  formatDateTime,
  formatINR,
  formatMinutes,
  formatNumber,
  initials,
} from '../utils/format'
import { Field, GhostButton, FiltersBar, PrimaryButton, inputClass } from './ui'

type SortKey =
  | 'employee_name'
  | 'workflow_name'
  | 'executed_at'
  | 'actual_execution_time_minutes'
  | 'manual_effort_minutes'
  | 'time_saved_minutes'
  | 'hourly_cost'
  | 'amount_saved'

const PAGE_SIZE = 25

export function FlowTrackingPage() {
  const {
    accountWorkflows,
    filteredExecutions,
    filters,
    setWorkflowIds,
    setDateRange,
    clearWorkflowFilter,
    selectedAccount,
  } = useDashboard()
  const [sortKey, setSortKey] = useState<SortKey>('executed_at')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')
  const [page, setPage] = useState(1)
  const [draftWorkflows, setDraftWorkflows] = useState<string[]>(
    filters.workflowIds,
  )
  const [draftStart, setDraftStart] = useState(filters.startDate)
  const [draftEnd, setDraftEnd] = useState(filters.endDate)

  useEffect(() => {
    setDraftWorkflows(filters.workflowIds)
    setDraftStart(filters.startDate)
    setDraftEnd(filters.endDate)
  }, [filters.workflowIds, filters.startDate, filters.endDate])

  const sorted = useMemo(() => {
    const copy = [...filteredExecutions]
    copy.sort((a, b) => {
      const av = a[sortKey]
      const bv = b[sortKey]
      if (typeof av === 'number' && typeof bv === 'number') {
        return sortDir === 'asc' ? av - bv : bv - av
      }
      return sortDir === 'asc'
        ? String(av).localeCompare(String(bv))
        : String(bv).localeCompare(String(av))
    })
    return copy
  }, [filteredExecutions, sortKey, sortDir])

  const pages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE))
  const current = Math.min(page, pages)
  const slice = sorted.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE)

  const totals = useMemo(() => {
    const time = filteredExecutions.reduce((s, e) => s + e.time_saved_minutes, 0)
    const amount = filteredExecutions.reduce((s, e) => s + e.amount_saved, 0)
    return { time, amount }
  }, [filteredExecutions])

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    else {
      setSortKey(key)
      setSortDir(key === 'executed_at' ? 'desc' : 'asc')
    }
  }

  const apply = () => {
    setWorkflowIds(draftWorkflows)
    setDateRange(draftStart, draftEnd)
    setPage(1)
  }

  return (
    <div>
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-slate-900">
          Flow Tracking Analytics
        </h1>
        <p className="text-sm text-slate-500">
          Execution-level time and rupee value for {selectedAccount.name}
        </p>
      </div>

      <FiltersBar>
        <Field label="Workflow">
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
          <span className="normal-case font-normal tracking-normal text-[11px] text-slate-400">
            Hold Ctrl/Cmd to multi-select. Empty = all workflows.
          </span>
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
              setPage(1)
            }}
          >
            Clear
          </GhostButton>
        </div>
      </FiltersBar>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-[980px] w-full text-left text-sm">
            <thead className="bg-[#F5F7FA] text-[11px] uppercase tracking-wide text-slate-500">
              <tr>
                {(
                  [
                    ['employee_name', 'Employee'],
                    ['workflow_name', 'Workflow'],
                    ['executed_at', 'Executed At'],
                    ['actual_execution_time_minutes', 'Actual Duration (min)'],
                    ['manual_effort_minutes', 'Manual Effort (min)'],
                    ['time_saved_minutes', 'Time Saved (min)'],
                    ['hourly_cost', 'Hourly Cost (₹)'],
                    ['amount_saved', 'Amount Saved (₹)'],
                  ] as [SortKey, string][]
                ).map(([key, label]) => (
                  <th key={key} className="px-3 py-3">
                    <button
                      className="font-semibold hover:text-[#17A2B8]"
                      onClick={() => toggleSort(key)}
                    >
                      {label}
                      {sortKey === key ? (sortDir === 'asc' ? ' ↑' : ' ↓') : ''}
                    </button>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {slice.map((row) => (
                <ExecutionRow key={row.id} row={row} />
              ))}
              {slice.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-3 py-10 text-center text-slate-500">
                    No executions in this range.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="flex flex-col gap-2 border-t border-slate-200 bg-[#F5F7FA] px-4 py-3 text-sm font-medium text-slate-800 md:flex-row md:items-center md:justify-between">
          <div>
            Totals: {formatNumber(filteredExecutions.length)} executions ·{' '}
            {formatNumber(totals.time / 60, 1)} hours saved ·{' '}
            {formatINR(totals.amount, true)}
          </div>
          <div className="flex items-center gap-2 text-slate-600">
            <button
              disabled={current <= 1}
              className="rounded border border-slate-200 bg-white px-2 py-1 disabled:opacity-40"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              Prev
            </button>
            <span>
              Page {current} of {pages}
            </span>
            <button
              disabled={current >= pages}
              className="rounded border border-slate-200 bg-white px-2 py-1 disabled:opacity-40"
              onClick={() => setPage((p) => Math.min(pages, p + 1))}
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function ExecutionRow({ row }: { row: EnrichedExecution }) {
  return (
    <tr className="border-t border-slate-100 hover:bg-slate-50">
      <td className="px-3 py-2">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#17A2B8] text-[11px] font-semibold text-white">
            {initials(row.employee_name)}
          </span>
          <div>
            <div className="font-medium text-slate-800">{row.employee_name}</div>
            <div className="text-[11px] text-slate-400">{row.employee_code}</div>
          </div>
        </div>
      </td>
      <td className="px-3 py-2 text-slate-700">{row.workflow_name}</td>
      <td className="px-3 py-2 text-slate-600">{formatDateTime(row.executed_at)}</td>
      <td className="px-3 py-2">{formatMinutes(row.actual_execution_time_minutes)}</td>
      <td className="px-3 py-2">{formatMinutes(row.manual_effort_minutes)}</td>
      <td
        className={`px-3 py-2 font-medium ${
          row.time_saved_minutes > 0 ? 'text-[#28A745]' : 'text-slate-400'
        }`}
      >
        {formatMinutes(row.time_saved_minutes)}
      </td>
      <td className="px-3 py-2">{formatINR(row.hourly_cost)}</td>
      <td className="px-3 py-2 font-medium text-slate-800">
        {formatINR(row.amount_saved, true)}
      </td>
    </tr>
  )
}

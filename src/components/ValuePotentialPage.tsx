import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { useDashboard } from '../context/DashboardContext'
import { calculateProjection } from '../utils/calculations'
import {
  formatHours,
  formatINR,
  formatNumber,
  formatPercent,
} from '../utils/format'
import { Field, PrimaryButton, inputClass } from './ui'

export function ValuePotentialPage() {
  const {
    accountWorkflows,
    filteredExecutions,
    customerInvestment,
    selectedAccount,
    filters,
  } = useDashboard()

  const [workflowId, setWorkflowId] = useState(
    accountWorkflows[0]?.id ?? '',
  )

  useEffect(() => {
    if (!accountWorkflows.some((w) => w.id === workflowId)) {
      setWorkflowId(accountWorkflows[0]?.id ?? '')
    }
  }, [accountWorkflows, workflowId])

  const selected =
    accountWorkflows.find((w) => w.id === workflowId) ?? accountWorkflows[0]

  const workflowExecs = useMemo(
    () =>
      filteredExecutions.filter((e) => e.workflow_id === (selected?.id ?? '')),
    [filteredExecutions, selected?.id],
  )

  const currentUsers = new Set(workflowExecs.map((e) => e.employee_id)).size
  const eligible = selectedAccount.employees_count
  const maxAdditional = Math.max(0, eligible - currentUsers)
  const avgUsage =
    currentUsers > 0 ? workflowExecs.length / currentUsers : 10

  const [additionalUsers, setAdditionalUsers] = useState(5)
  const [usage, setUsage] = useState(Math.round(avgUsage * 10) / 10)
  const [show, setShow] = useState(true)

  const clampedAdditional = Math.min(Math.max(0, additionalUsers), maxAdditional)
  const safeUsage = Math.max(0, usage)

  const projection = calculateProjection({
    workflowExecutions: workflowExecs,
    additionalUsers: clampedAdditional,
    usagePerUserPerMonth: safeUsage,
    customerInvestment,
  })

  return (
    <div>
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-slate-900">Value Potential</h1>
        <p className="text-sm text-slate-500">
          Project future value if more employees adopt a workflow for{' '}
          {selectedAccount.name}
        </p>
      </div>

      <div className="mb-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="mb-3 text-sm font-semibold text-slate-800">
          Project future value
        </h2>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <Field label="Select workflow">
            <select
              className={inputClass()}
              value={selected?.id ?? ''}
              onChange={(e) => {
                setWorkflowId(e.target.value)
              }}
            >
              {accountWorkflows.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Current active users">
            <input
              className={inputClass()}
              readOnly
              value={`${currentUsers} users in ${filters.startDate}–${filters.endDate}`}
            />
          </Field>
          <Field label="Additional users to adopt">
            <input
              type="number"
              min={0}
              max={maxAdditional}
              className={inputClass()}
              value={additionalUsers}
              onChange={(e) => setAdditionalUsers(Number(e.target.value))}
            />
            <span className="normal-case font-normal tracking-normal text-[11px] text-slate-400">
              Max {maxAdditional} (eligible {eligible} − current {currentUsers})
            </span>
          </Field>
          <Field label="Usage (executions / user / month)">
            <input
              type="number"
              min={0}
              step={0.1}
              className={inputClass()}
              value={usage}
              onChange={(e) => setUsage(Number(e.target.value))}
            />
            <span className="normal-case font-normal tracking-normal text-[11px] text-slate-400">
              Pre-filled from current average ({formatNumber(avgUsage, 1)})
            </span>
          </Field>
        </div>
        <div className="mt-4">
          <PrimaryButton type="button" onClick={() => setShow(true)}>
            Calculate projection
          </PrimaryButton>
        </div>
        {safeUsage <= 0 && (
          <p className="mt-2 text-sm text-[#DC3545]">
            Usage assumption must be greater than 0 to project additional
            executions.
          </p>
        )}
      </div>

      {show && selected && (
        <>
          <div className="mb-4 grid gap-3 md:grid-cols-2">
            <StateCard
              title="Current state"
              users={projection.currentUsers}
              executions={projection.currentExecutions}
              hours={projection.currentTimeSavedHours}
              value={projection.currentValue}
              roi={projection.currentROI}
            />
            <StateCard
              title={`With ${clampedAdditional} new users`}
              projected
              users={projection.projectedUsers}
              executions={projection.projectedExecutions}
              hours={projection.projectedTimeSavedHours}
              value={projection.projectedValue}
              roi={projection.projectedROI}
              extra={
                <div className="mt-3 border-t border-white/20 pt-3 text-sm">
                  +{formatINR(projection.additionalValue)} value
                  <br />+{formatNumber(projection.additionalHours, 1)} hours
                  saved
                </div>
              }
            />
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
            <Mini
              label="Projected executions"
              value={formatNumber(Math.round(projection.projectedExecutions))}
              sub={`+${formatNumber(projection.executionLiftPct, 0)}% from current`}
            />
            <Mini
              label="Projected time saved"
              value={formatHours(projection.projectedTimeSavedHours)}
              sub={`+${formatNumber(projection.additionalHours, 1)} hrs`}
            />
            <Mini
              label="Projected amount saved"
              value={formatINR(projection.projectedValue)}
              sub={`+${formatNumber(projection.valueLiftPct, 0)}% from current`}
            />
            <Mini
              label="Projected ROI"
              value={
                customerInvestment > 0
                  ? formatPercent(projection.projectedROI)
                  : 'N/A'
              }
              sub="Using same customer investment"
            />
            <Mini
              label="Additional monthly value"
              value={formatINR(projection.additionalValue)}
              sub="Projected − current"
            />
          </div>
        </>
      )}
    </div>
  )
}

function StateCard({
  title,
  users,
  executions,
  hours,
  value,
  roi,
  projected,
  extra,
}: {
  title: string
  users: number
  executions: number
  hours: number
  value: number
  roi: number | null
  projected?: boolean
  extra?: ReactNode
}) {
  return (
    <div
      className={`rounded-xl p-5 shadow-sm ${
        projected
          ? 'bg-gradient-to-br from-[#17A2B8] to-[#0F5F73] text-white'
          : 'border border-slate-200 bg-white text-slate-800'
      }`}
    >
      <div
        className={`text-xs font-semibold uppercase tracking-widest ${
          projected ? 'text-white/80' : 'text-slate-500'
        }`}
      >
        {projected ? 'Projected' : 'Observed'}
      </div>
      <div className="mt-1 text-lg font-semibold">{title}</div>
      <dl className="mt-3 space-y-1 text-sm">
        <div>Active users: {formatNumber(users)}</div>
        <div>Executions: {formatNumber(Math.round(executions))}</div>
        <div>Time saved: {formatHours(hours)}</div>
        <div>Value: {formatINR(value)}</div>
        <div>ROI: {formatPercent(roi)}</div>
      </dl>
      {extra}
    </div>
  )
}

function Mini({
  label,
  value,
  sub,
}: {
  label: string
  value: string
  sub: string
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </div>
      <div className="mt-1 text-xl font-bold text-slate-900">{value}</div>
      <div className="mt-1 text-xs text-slate-500">{sub}</div>
    </div>
  )
}

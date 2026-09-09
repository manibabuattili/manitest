import { Hourglass, Pencil, Search } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useDashboard } from '../context/DashboardContext'
import type { Workflow } from '../types'
import { formatINR } from '../utils/format'
import { Field, GhostButton, PrimaryButton, inputClass } from './ui'

export function WorkflowsPage() {
  const {
    accountWorkflows,
    selectedAccount,
    updateWorkflow,
    setPage,
    setWorkflowIds,
  } = useDashboard()
  const [query, setQuery] = useState('')
  const [editing, setEditing] = useState<Workflow | null>(null)
  const [savedId, setSavedId] = useState<string | null>(null)

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return accountWorkflows
    return accountWorkflows.filter(
      (w) =>
        w.name.toLowerCase().includes(q) ||
        w.primary_persona.toLowerCase().includes(q),
    )
  }, [accountWorkflows, query])

  return (
    <div>
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Workflows</h1>
          <p className="text-sm text-slate-500">
            Configure value assumptions for {selectedAccount.name}
          </p>
        </div>
        <div className="relative ml-auto w-full sm:w-64">
          <Search
            size={16}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            className={`${inputClass()} w-full pl-9`}
            placeholder="Search by name"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
      </div>

      <section className="mb-8">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-800">
            Currently assigned workflows
          </h2>
          <span className="text-sm text-slate-500">
            {filtered.length} workflows
          </span>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          {filtered.map((wf) => (
            <article
              key={wf.id}
              className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm"
            >
              <div>
                <div className="font-medium text-slate-900">{wf.name}</div>
                <div className="text-xs text-slate-500">
                  {wf.primary_persona} · {wf.manual_effort_minutes} min ·{' '}
                  {formatINR(wf.hourly_cost)}/hr
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button
                  title="Edit value config"
                  className="rounded-md p-2 text-slate-500 hover:bg-slate-100 hover:text-[#17A2B8]"
                  onClick={() => {
                    setEditing(wf)
                    setSavedId(null)
                  }}
                >
                  <Pencil size={16} />
                </button>
                <button
                  title="Open flow tracking"
                  className="rounded-md p-2 text-slate-500 hover:bg-slate-100 hover:text-[#17A2B8]"
                  onClick={() => {
                    setWorkflowIds([wf.id])
                    setPage('flow-tracking')
                  }}
                >
                  <Hourglass size={16} />
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>

      {editing && (
        <EditModal
          workflow={editing}
          saved={savedId === editing.id}
          onClose={() => setEditing(null)}
          onSave={(patch) => {
            updateWorkflow(editing.id, patch)
            setSavedId(editing.id)
            setEditing((prev) =>
              prev ? { ...prev, ...patch, updated_at: new Date().toISOString() } : prev,
            )
          }}
        />
      )}
    </div>
  )
}

function EditModal({
  workflow,
  onClose,
  onSave,
  saved,
}: {
  workflow: Workflow
  onClose: () => void
  onSave: (patch: Partial<Workflow>) => void
  saved: boolean
}) {
  const [persona, setPersona] = useState(workflow.primary_persona)
  const [effort, setEffort] = useState(String(workflow.manual_effort_minutes))
  const [cost, setCost] = useState(String(workflow.hourly_cost))
  const [charge, setCharge] = useState(String(workflow.bluconn_monthly_charge))
  const [errors, setErrors] = useState<string[]>([])

  const estimated =
    Number(effort) > 0 && Number(cost) > 0
      ? (Math.max(0, Number(effort) - 5) / 60) * Number(cost)
      : 0

  const submit = () => {
    const next: string[] = []
    if (!persona.trim()) next.push('Primary persona is required')
    const effortN = Number(effort)
    const costN = Number(cost)
    const chargeN = Number(charge)
    if (!(effortN > 0)) next.push('Manual effort must be greater than 0')
    if (!(costN > 0)) next.push('Hourly cost must be greater than 0')
    if (!(chargeN >= 0)) next.push('Monthly charge cannot be negative')
    setErrors(next)
    if (next.length) return
    onSave({
      primary_persona: persona.trim(),
      manual_effort_minutes: effortN,
      hourly_cost: costN,
      bluconn_monthly_charge: chargeN,
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-0 sm:items-center sm:p-4">
      <div className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-t-2xl bg-white p-5 shadow-xl sm:rounded-2xl">
        <h3 className="text-lg font-semibold text-slate-900">
          Edit workflow value
        </h3>
        <p className="mb-4 text-sm text-slate-500">{workflow.name}</p>

        <div className="grid gap-3">
          <Field label="Workflow name">
            <input className={inputClass()} value={workflow.name} readOnly />
          </Field>
          <Field label="Primary persona">
            <input
              className={inputClass()}
              value={persona}
              onChange={(e) => setPersona(e.target.value)}
            />
          </Field>
          <Field label="Manual effort (minutes)">
            <input
              type="number"
              min={1}
              className={inputClass()}
              value={effort}
              onChange={(e) => setEffort(e.target.value)}
            />
          </Field>
          <Field label="Hourly cost (₹)">
            <input
              type="number"
              min={1}
              className={inputClass()}
              value={cost}
              onChange={(e) => setCost(e.target.value)}
            />
          </Field>
          <Field label="Bluconn monthly charge (₹)">
            <input
              type="number"
              min={0}
              className={inputClass()}
              value={charge}
              onChange={(e) => setCharge(e.target.value)}
            />
          </Field>
        </div>

        {errors.length > 0 && (
          <ul className="mt-3 list-disc pl-5 text-sm text-[#DC3545]">
            {errors.map((e) => (
              <li key={e}>{e}</li>
            ))}
          </ul>
        )}
        {saved && (
          <p className="mt-3 text-sm font-medium text-[#28A745]">
            Configuration saved. Flow Tracking and Analytics will recalculate.
          </p>
        )}

        <div className="mt-4 rounded-lg border border-slate-200 bg-[#F5F7FA] p-4 text-sm">
          <div className="mb-2 font-semibold text-slate-800">
            {workflow.name} configuration (Last updated:{' '}
            {new Date(workflow.updated_at).toLocaleDateString('en-IN', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            })}
            )
          </div>
          <div className="space-y-1 text-slate-600">
            <div>Primary Persona: {persona || '—'}</div>
            <div>Manual Effort: {effort || '—'} minutes</div>
            <div>Hourly Cost: ₹{cost || '—'}/hr</div>
            <div>Monthly Charge: ₹{charge || '—'}</div>
            <div>
              Estimated value per execution: {formatINR(estimated, true)} (if
              executed in 5 minutes)
            </div>
          </div>
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <GhostButton type="button" onClick={onClose}>
            Close
          </GhostButton>
          <PrimaryButton type="button" onClick={submit}>
            Save
          </PrimaryButton>
        </div>
      </div>
    </div>
  )
}

import {
  CircleDollarSign,
  Hourglass,
  Pencil,
  Plus,
  Search,
  Table2,
  Trash2,
} from 'lucide-react'
import { useMemo, useState, type ReactNode } from 'react'
import { useDashboard } from '../context/DashboardContext'
import type { Workflow } from '../types'
import { formatINR } from '../utils/format'
import { Field, GhostButton, PrimaryButton, inputClass } from './ui'

export function WorkflowsPage() {
  const {
    accountWorkflows,
    availableWorkflows,
    selectedAccount,
    updateWorkflow,
    createWorkflow,
    assignWorkflows,
    unassignWorkflow,
    setPage,
    setWorkflowIds,
  } = useDashboard()
  const [query, setQuery] = useState('')
  const [editing, setEditing] = useState<Workflow | null>(null)
  const [creating, setCreating] = useState(false)
  const [savedId, setSavedId] = useState<string | null>(null)
  const [picked, setPicked] = useState<string[]>([])

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
        <PrimaryButton
          type="button"
          className="inline-flex items-center gap-2"
          onClick={() => setCreating(true)}
        >
          <Plus size={16} />
          Create Workflow
        </PrimaryButton>
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
        <div className="grid gap-3">
          {filtered.map((wf) => (
            <article
              key={wf.id}
              className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <div className="font-medium text-slate-900">{wf.name}</div>
                <div className="text-xs text-slate-500">
                  {wf.primary_persona} · {wf.manual_effort_minutes} min ·{' '}
                  {formatINR(wf.hourly_cost)}/hr · Charge{' '}
                  {formatINR(wf.bluconn_monthly_charge)}
                </div>
              </div>
              <div className="flex items-center gap-1">
                <IconBtn
                  title="Edit value config"
                  onClick={() => {
                    setEditing(wf)
                    setSavedId(null)
                  }}
                >
                  <Pencil size={16} />
                </IconBtn>
                <IconBtn
                  title="Open flow tracking"
                  onClick={() => {
                    setWorkflowIds([wf.id])
                    setPage('flow-tracking')
                  }}
                >
                  <Hourglass size={16} />
                </IconBtn>
                <IconBtn
                  title="Unassign workflow"
                  danger
                  onClick={() => unassignWorkflow(wf.id)}
                >
                  <Trash2 size={16} />
                </IconBtn>
                <IconBtn
                  title="Execution records"
                  onClick={() => {
                    setWorkflowIds([wf.id])
                    setPage('flow-tracking')
                  }}
                >
                  <Table2 size={16} />
                </IconBtn>
                <IconBtn
                  title="Workflow analytics"
                  onClick={() => {
                    setWorkflowIds([wf.id])
                    setPage('analytics')
                  }}
                >
                  <CircleDollarSign size={16} />
                </IconBtn>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-800">
            Available workflows to assign
          </h2>
          <PrimaryButton
            type="button"
            disabled={picked.length === 0}
            onClick={() => {
              assignWorkflows(picked)
              setPicked([])
            }}
          >
            Assign Selected Workflows
          </PrimaryButton>
        </div>
        {availableWorkflows.length === 0 ? (
          <p className="rounded-xl border border-dashed border-slate-200 bg-white px-4 py-6 text-sm text-slate-500">
            No unassigned workflows for this account.
          </p>
        ) : (
          <div className="grid gap-3">
            {availableWorkflows.map((wf) => (
              <label
                key={wf.id}
                className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm"
              >
                <input
                  type="checkbox"
                  checked={picked.includes(wf.id)}
                  onChange={() =>
                    setPicked((prev) =>
                      prev.includes(wf.id)
                        ? prev.filter((id) => id !== wf.id)
                        : [...prev, wf.id],
                    )
                  }
                />
                <div>
                  <div className="font-medium text-slate-900">{wf.name}</div>
                  <div className="text-xs text-slate-500">
                    {wf.primary_persona} · {wf.manual_effort_minutes} min
                  </div>
                </div>
              </label>
            ))}
          </div>
        )}
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
              prev
                ? { ...prev, ...patch, updated_at: new Date().toISOString() }
                : prev,
            )
          }}
        />
      )}
      {creating && (
        <CreateModal
          onClose={() => setCreating(false)}
          onCreate={(input) => {
            createWorkflow(input)
            setCreating(false)
          }}
        />
      )}
    </div>
  )
}

function IconBtn({
  title,
  onClick,
  children,
  danger,
}: {
  title: string
  onClick: () => void
  children: ReactNode
  danger?: boolean
}) {
  return (
    <button
      title={title}
      className={`rounded-md p-2 hover:bg-slate-100 ${
        danger ? 'text-[#DC3545]' : 'text-slate-500 hover:text-[#17A2B8]'
      }`}
      onClick={onClick}
    >
      {children}
    </button>
  )
}

function CreateModal({
  onClose,
  onCreate,
}: {
  onClose: () => void
  onCreate: (input: {
    name: string
    primary_persona: string
    manual_effort_minutes: number
    hourly_cost: number
    bluconn_monthly_charge: number
  }) => void
}) {
  const [name, setName] = useState('')
  const [persona, setPersona] = useState('')
  const [effort, setEffort] = useState('30')
  const [cost, setCost] = useState('300')
  const [charge, setCharge] = useState('2000')
  const [errors, setErrors] = useState<string[]>([])

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-0 sm:items-center sm:p-4">
      <div className="w-full max-w-lg rounded-t-2xl bg-white p-5 shadow-xl sm:rounded-2xl">
        <h3 className="mb-4 text-lg font-semibold">Create workflow</h3>
        <div className="grid gap-3">
          <Field label="Workflow name">
            <input className={inputClass()} value={name} onChange={(e) => setName(e.target.value)} />
          </Field>
          <Field label="Primary persona">
            <input className={inputClass()} value={persona} onChange={(e) => setPersona(e.target.value)} />
          </Field>
          <Field label="Manual effort (minutes)">
            <input type="number" min={1} className={inputClass()} value={effort} onChange={(e) => setEffort(e.target.value)} />
          </Field>
          <Field label="Hourly cost (₹)">
            <input type="number" min={1} className={inputClass()} value={cost} onChange={(e) => setCost(e.target.value)} />
          </Field>
          <Field label="Bluconn monthly charge (₹)">
            <input type="number" min={0} className={inputClass()} value={charge} onChange={(e) => setCharge(e.target.value)} />
          </Field>
        </div>
        {errors.length > 0 && (
          <ul className="mt-3 list-disc pl-5 text-sm text-[#DC3545]">
            {errors.map((e) => (
              <li key={e}>{e}</li>
            ))}
          </ul>
        )}
        <div className="mt-5 flex justify-end gap-2">
          <GhostButton type="button" onClick={onClose}>
            Cancel
          </GhostButton>
          <PrimaryButton
            type="button"
            onClick={() => {
              const next: string[] = []
              if (!name.trim()) next.push('Name is required')
              if (!persona.trim()) next.push('Primary persona is required')
              if (!(Number(effort) > 0)) next.push('Manual effort must be greater than 0')
              if (!(Number(cost) > 0)) next.push('Hourly cost must be greater than 0')
              setErrors(next)
              if (next.length) return
              onCreate({
                name: name.trim(),
                primary_persona: persona.trim(),
                manual_effort_minutes: Number(effort),
                hourly_cost: Number(cost),
                bluconn_monthly_charge: Number(charge),
              })
            }}
          >
            Create
          </PrimaryButton>
        </div>
      </div>
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

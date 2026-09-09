import { useDashboard } from '../context/DashboardContext'
import { DEFAULT_END_DATE, DEFAULT_START_DATE } from '../data/seed'
import { Field, GhostButton, FiltersBar, inputClass } from './ui'

export function DashboardFilters({
  showWorkflow = true,
  showAccount = true,
}: {
  showWorkflow?: boolean
  showAccount?: boolean
}) {
  const {
    accounts,
    accountWorkflows,
    filters,
    setAccountId,
    setWorkflowIds,
    setDateRange,
    clearWorkflowFilter,
  } = useDashboard()

  const toggleWorkflow = (id: string) => {
    const current = filters.workflowIds
    if (current.includes(id)) {
      setWorkflowIds(current.filter((w) => w !== id))
    } else {
      setWorkflowIds([...current, id])
    }
  }

  return (
    <FiltersBar>
      {showAccount && (
        <Field label="Account">
          <select
            className={inputClass()}
            value={filters.accountId}
            onChange={(e) => setAccountId(e.target.value)}
          >
            {accounts.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </select>
        </Field>
      )}
      {showWorkflow && (
        <div className="min-w-[220px] flex-[2]">
          <div className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
            Workflows
          </div>
          <div className="flex flex-wrap gap-2">
            <label className="flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-2 py-1.5 text-sm font-normal text-slate-700">
              <input
                type="checkbox"
                checked={filters.workflowIds.length === 0}
                onChange={() => clearWorkflowFilter()}
              />
              All Workflows
            </label>
            {accountWorkflows.map((w) => (
              <label
                key={w.id}
                className="flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-2 py-1.5 text-sm font-normal text-slate-700"
              >
                <input
                  type="checkbox"
                  checked={filters.workflowIds.includes(w.id)}
                  onChange={() => toggleWorkflow(w.id)}
                />
                {w.name}
              </label>
            ))}
          </div>
        </div>
      )}
      <Field label="From date">
        <input
          type="date"
          className={inputClass()}
          value={filters.startDate}
          onChange={(e) => setDateRange(e.target.value, filters.endDate)}
        />
      </Field>
      <Field label="To date">
        <input
          type="date"
          className={inputClass()}
          value={filters.endDate}
          onChange={(e) => setDateRange(filters.startDate, e.target.value)}
        />
      </Field>
      <GhostButton
        type="button"
        onClick={() => {
          clearWorkflowFilter()
          setDateRange(DEFAULT_START_DATE, DEFAULT_END_DATE)
        }}
      >
        Clear
      </GhostButton>
    </FiltersBar>
  )
}

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import {
  ACCOUNTS,
  DEFAULT_END_DATE,
  DEFAULT_START_DATE,
  buildExecutions,
  buildWorkflows,
} from '../data/seed'
import type {
  Account,
  EnrichedExecution,
  Execution,
  Filters,
  PageId,
  Workflow,
} from '../types'
import {
  calculateAnalytics,
  enrichExecution,
  filterExecutions,
} from '../utils/calculations'

const WORKFLOW_KEY = 'bluconn-workflows-v1'
const INVESTMENT_KEY = 'bluconn-investment-v2'

function loadWorkflows(): Workflow[] {
  const seeded = buildWorkflows()
  try {
    const raw = localStorage.getItem(WORKFLOW_KEY)
    if (!raw) return seeded
    const parsed = JSON.parse(raw) as Workflow[]
    const byId = new Map(parsed.map((w) => [w.id, w]))
    return seeded.map((w) => {
      const saved = byId.get(w.id)
      if (!saved) return w
      return { ...w, ...saved, assigned: saved.assigned ?? w.assigned }
    })
  } catch {
    return seeded
  }
}

function defaultInvestments(workflows: Workflow[]): Record<string, number> {
  const totals: Record<string, number> = {}
  for (const w of workflows) {
    if (w.assigned === false) continue
    totals[w.account_id] = (totals[w.account_id] ?? 0) + w.bluconn_monthly_charge
  }
  return totals
}

function loadInvestments(workflows: Workflow[]): Record<string, number> {
  const defaults = defaultInvestments(workflows)
  try {
    const raw = localStorage.getItem(INVESTMENT_KEY)
    if (!raw) return defaults
    return { ...defaults, ...(JSON.parse(raw) as Record<string, number>) }
  } catch {
    return defaults
  }
}

interface DashboardContextValue {
  accounts: Account[]
  executions: Execution[]
  workflows: Workflow[]
  page: PageId
  setPage: (page: PageId) => void
  filters: Filters
  setAccountId: (id: string) => void
  setWorkflowIds: (ids: string[]) => void
  setDateRange: (start: string, end: string) => void
  clearWorkflowFilter: () => void
  updateWorkflow: (id: string, patch: Partial<Workflow>) => void
  createWorkflow: (input: {
    name: string
    primary_persona: string
    manual_effort_minutes: number
    hourly_cost: number
    bluconn_monthly_charge: number
    description?: string
  }) => void
  assignWorkflows: (ids: string[]) => void
  unassignWorkflow: (id: string) => void
  customerInvestment: number
  setCustomerInvestment: (value: number) => void
  accountWorkflows: Workflow[]
  availableWorkflows: Workflow[]
  filteredExecutions: EnrichedExecution[]
  analytics: ReturnType<typeof calculateAnalytics>
  selectedAccount: Account
}

const DashboardContext = createContext<DashboardContextValue | null>(null)

export function DashboardProvider({ children }: { children: ReactNode }) {
  const accounts = ACCOUNTS
  const [executions] = useState<Execution[]>(() =>
    buildExecutions(buildWorkflows()),
  )
  const [workflows, setWorkflows] = useState<Workflow[]>(loadWorkflows)
  const [page, setPage] = useState<PageId>('workflows')
  const [filters, setFilters] = useState<Filters>({
    accountId: 'acc_001',
    workflowIds: [],
    startDate: DEFAULT_START_DATE,
    endDate: DEFAULT_END_DATE,
  })
  const [investments, setInvestments] = useState<Record<string, number>>(() =>
    loadInvestments(loadWorkflows()),
  )

  useEffect(() => {
    localStorage.setItem(WORKFLOW_KEY, JSON.stringify(workflows))
  }, [workflows])

  useEffect(() => {
    localStorage.setItem(INVESTMENT_KEY, JSON.stringify(investments))
  }, [investments])

  const setAccountId = useCallback((id: string) => {
    setFilters((prev) => ({ ...prev, accountId: id, workflowIds: [] }))
  }, [])

  const setWorkflowIds = useCallback((ids: string[]) => {
    setFilters((prev) => ({ ...prev, workflowIds: ids }))
  }, [])

  const setDateRange = useCallback((start: string, end: string) => {
    setFilters((prev) => ({ ...prev, startDate: start, endDate: end }))
  }, [])

  const clearWorkflowFilter = useCallback(() => {
    setFilters((prev) => ({ ...prev, workflowIds: [] }))
  }, [])

  const updateWorkflow = useCallback((id: string, patch: Partial<Workflow>) => {
    setWorkflows((prev) =>
      prev.map((w) =>
        w.id === id
          ? { ...w, ...patch, updated_at: new Date().toISOString() }
          : w,
      ),
    )
  }, [])

  const createWorkflow = useCallback(
    (input: {
      name: string
      primary_persona: string
      manual_effort_minutes: number
      hourly_cost: number
      bluconn_monthly_charge: number
      description?: string
    }) => {
      const now = new Date().toISOString()
      const id = `wf_custom_${filters.accountId}_${Date.now()}`
      setWorkflows((prev) => [
        ...prev,
        {
          id,
          account_id: filters.accountId,
          name: input.name,
          description: input.description ?? 'Custom workflow',
          primary_persona: input.primary_persona,
          manual_effort_minutes: input.manual_effort_minutes,
          hourly_cost: input.hourly_cost,
          bluconn_monthly_charge: input.bluconn_monthly_charge,
          created_at: now,
          updated_at: now,
          assigned: true,
        },
      ])
    },
    [filters.accountId],
  )

  const assignWorkflows = useCallback((ids: string[]) => {
    setWorkflows((prev) =>
      prev.map((w) =>
        ids.includes(w.id) ? { ...w, assigned: true, updated_at: new Date().toISOString() } : w,
      ),
    )
  }, [])

  const unassignWorkflow = useCallback((id: string) => {
    setWorkflows((prev) =>
      prev.map((w) =>
        w.id === id ? { ...w, assigned: false, updated_at: new Date().toISOString() } : w,
      ),
    )
    setFilters((prev) => ({
      ...prev,
      workflowIds: prev.workflowIds.filter((wid) => wid !== id),
    }))
  }, [])

  const customerInvestment = investments[filters.accountId] ?? 0

  const setCustomerInvestment = useCallback(
    (value: number) => {
      setInvestments((prev) => ({ ...prev, [filters.accountId]: value }))
    },
    [filters.accountId],
  )

  const accountWorkflows = useMemo(
    () =>
      workflows.filter(
        (w) => w.account_id === filters.accountId && w.assigned !== false,
      ),
    [workflows, filters.accountId],
  )

  const availableWorkflows = useMemo(
    () =>
      workflows.filter(
        (w) => w.account_id === filters.accountId && w.assigned === false,
      ),
    [workflows, filters.accountId],
  )

  const workflowById = useMemo(
    () => new Map(workflows.map((w) => [w.id, w])),
    [workflows],
  )

  const filteredExecutions = useMemo(() => {
    const assignedIds = new Set(accountWorkflows.map((w) => w.id))
    return filterExecutions(executions, filters)
      .filter((exec) => assignedIds.has(exec.workflow_id))
      .map((exec) => enrichExecution(exec, workflowById.get(exec.workflow_id)))
  }, [executions, filters, workflowById, accountWorkflows])

  const analytics = useMemo(
    () =>
      calculateAnalytics(
        filteredExecutions,
        customerInvestment,
        accountWorkflows,
      ),
    [filteredExecutions, customerInvestment, accountWorkflows],
  )

  const selectedAccount =
    accounts.find((a) => a.id === filters.accountId) ?? accounts[0]!

  const value: DashboardContextValue = {
    accounts,
    executions,
    workflows,
    page,
    setPage,
    filters,
    setAccountId,
    setWorkflowIds,
    setDateRange,
    clearWorkflowFilter,
    updateWorkflow,
    createWorkflow,
    assignWorkflows,
    unassignWorkflow,
    customerInvestment,
    setCustomerInvestment,
    accountWorkflows,
    availableWorkflows,
    filteredExecutions,
    analytics,
    selectedAccount,
  }

  return (
    <DashboardContext.Provider value={value}>
      {children}
    </DashboardContext.Provider>
  )
}

export function useDashboard() {
  const ctx = useContext(DashboardContext)
  if (!ctx) throw new Error('useDashboard must be used within DashboardProvider')
  return ctx
}

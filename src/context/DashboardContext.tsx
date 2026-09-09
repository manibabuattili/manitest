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
    return seeded.map((w) => byId.get(w.id) ?? w)
  } catch {
    return seeded
  }
}

function defaultInvestments(workflows: Workflow[]): Record<string, number> {
  const totals: Record<string, number> = {}
  for (const w of workflows) {
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
  customerInvestment: number
  setCustomerInvestment: (value: number) => void
  accountWorkflows: Workflow[]
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

  const customerInvestment = investments[filters.accountId] ?? 0

  const setCustomerInvestment = useCallback(
    (value: number) => {
      setInvestments((prev) => ({ ...prev, [filters.accountId]: value }))
    },
    [filters.accountId],
  )

  const accountWorkflows = useMemo(
    () => workflows.filter((w) => w.account_id === filters.accountId),
    [workflows, filters.accountId],
  )

  const workflowById = useMemo(
    () => new Map(workflows.map((w) => [w.id, w])),
    [workflows],
  )

  const filteredExecutions = useMemo(() => {
    return filterExecutions(executions, filters).map((exec) =>
      enrichExecution(exec, workflowById.get(exec.workflow_id)),
    )
  }, [executions, filters, workflowById])

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
    customerInvestment,
    setCustomerInvestment,
    accountWorkflows,
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

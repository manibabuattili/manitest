import type {
  AnalyticsSummary,
  EnrichedExecution,
  Execution,
  Workflow,
  WorkflowBreakdown,
} from '../types'

export function timeSavedMinutes(
  manualEffort: number,
  actualMinutes: number,
): number {
  return Math.max(0, manualEffort - actualMinutes)
}

export function amountSaved(
  savedMinutes: number,
  hourlyCost: number,
): number {
  return (savedMinutes / 60) * hourlyCost
}

export function enrichExecution(
  execution: Execution,
  workflow: Workflow | undefined,
): EnrichedExecution {
  const manual = workflow?.manual_effort_minutes ?? 0
  const cost = workflow?.hourly_cost ?? 0
  const saved = timeSavedMinutes(manual, execution.actual_execution_time_minutes)
  return {
    ...execution,
    workflow_name: workflow?.name ?? 'Unknown',
    manual_effort_minutes: manual,
    hourly_cost: cost,
    time_saved_minutes: saved,
    amount_saved: amountSaved(saved, cost),
  }
}

export function filterExecutions(
  executions: Execution[],
  filters: {
    accountId: string
    workflowIds: string[]
    startDate: string
    endDate: string
  },
): Execution[] {
  const start = new Date(`${filters.startDate}T00:00:00`)
  const end = new Date(`${filters.endDate}T23:59:59.999`)
  return executions.filter((exec) => {
    if (exec.account_id !== filters.accountId) return false
    if (
      filters.workflowIds.length > 0 &&
      !filters.workflowIds.includes(exec.workflow_id)
    ) {
      return false
    }
    const at = new Date(exec.executed_at)
    return at >= start && at <= end
  })
}

export function calculateAnalytics(
  filtered: EnrichedExecution[],
  customerInvestment: number,
  workflows: Workflow[],
): AnalyticsSummary {
  const totalExecutions = filtered.length
  const totalTimeSavedMinutes = filtered.reduce(
    (sum, exec) => sum + exec.time_saved_minutes,
    0,
  )
  const totalAmountSaved = filtered.reduce(
    (sum, exec) => sum + exec.amount_saved,
    0,
  )
  const currentROI =
    customerInvestment > 0
      ? ((totalAmountSaved - customerInvestment) / customerInvestment) * 100
      : null

  const ids = new Set(filtered.map((e) => e.workflow_id))
  const valueByWorkflow: WorkflowBreakdown[] = workflows
    .filter((w) => ids.has(w.id))
    .map((workflow) => {
      const rows = filtered.filter((e) => e.workflow_id === workflow.id)
      const timeSaved = rows.reduce((s, e) => s + e.time_saved_minutes, 0)
      const amount = rows.reduce((s, e) => s + e.amount_saved, 0)
      return {
        workflow_id: workflow.id,
        workflow_name: workflow.name,
        executions: rows.length,
        time_saved_minutes: timeSaved,
        amount_saved: amount,
        avg_value_per_execution: rows.length ? amount / rows.length : 0,
      }
    })
    .sort((a, b) => b.amount_saved - a.amount_saved)

  return {
    totalExecutions,
    totalTimeSavedHours: totalTimeSavedMinutes / 60,
    totalAmountSaved,
    currentROI,
    valueByWorkflow,
  }
}

export function uniqueEmployees(executions: Execution[]): number {
  return new Set(executions.map((e) => e.employee_id)).size
}

export function averageExecutionsPerUser(executions: Execution[]): number {
  const users = uniqueEmployees(executions)
  if (!users) return 0
  return executions.length / users
}

export interface ProjectionResult {
  currentUsers: number
  projectedUsers: number
  currentExecutions: number
  projectedExecutions: number
  currentTimeSavedHours: number
  projectedTimeSavedHours: number
  currentValue: number
  projectedValue: number
  currentROI: number | null
  projectedROI: number | null
  additionalValue: number
  additionalHours: number
  executionLiftPct: number
  valueLiftPct: number
}

export function calculateProjection(args: {
  workflowExecutions: EnrichedExecution[]
  additionalUsers: number
  usagePerUserPerMonth: number
  customerInvestment: number
}): ProjectionResult {
  const { workflowExecutions, additionalUsers, usagePerUserPerMonth, customerInvestment } =
    args
  const currentUsers = uniqueEmployees(workflowExecutions)
  const currentExecutions = workflowExecutions.length
  const currentTimeSavedMinutes = workflowExecutions.reduce(
    (s, e) => s + e.time_saved_minutes,
    0,
  )
  const currentValue = workflowExecutions.reduce((s, e) => s + e.amount_saved, 0)
  const avgTimeSavedMinutes =
    currentExecutions > 0 ? currentTimeSavedMinutes / currentExecutions : 0
  const avgAmountSaved =
    currentExecutions > 0 ? currentValue / currentExecutions : 0

  const projectedExecutions =
    currentExecutions + additionalUsers * usagePerUserPerMonth
  const projectedTimeSavedMinutes = projectedExecutions * avgTimeSavedMinutes
  const projectedValue = projectedExecutions * avgAmountSaved
  const currentTimeSavedHours = currentTimeSavedMinutes / 60
  const projectedTimeSavedHours = projectedTimeSavedMinutes / 60

  const currentROI =
    customerInvestment > 0
      ? ((currentValue - customerInvestment) / customerInvestment) * 100
      : null
  const projectedROI =
    customerInvestment > 0
      ? ((projectedValue - customerInvestment) / customerInvestment) * 100
      : null

  return {
    currentUsers,
    projectedUsers: currentUsers + additionalUsers,
    currentExecutions,
    projectedExecutions,
    currentTimeSavedHours,
    projectedTimeSavedHours,
    currentValue,
    projectedValue,
    currentROI,
    projectedROI,
    additionalValue: projectedValue - currentValue,
    additionalHours: projectedTimeSavedHours - currentTimeSavedHours,
    executionLiftPct:
      currentExecutions > 0
        ? ((projectedExecutions - currentExecutions) / currentExecutions) * 100
        : 0,
    valueLiftPct:
      currentValue > 0
        ? ((projectedValue - currentValue) / currentValue) * 100
        : 0,
  }
}

export function roiMultiple(amountSaved: number, investment: number): number | null {
  if (investment <= 0) return null
  return amountSaved / investment
}

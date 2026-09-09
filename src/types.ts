export type ExecutionStatus =
  | 'completed'
  | 'in_progress'
  | 'stopped'
  | 'failed'

export interface Account {
  id: string
  name: string
  employees_count: number
}

export interface Workflow {
  id: string
  account_id: string
  name: string
  description: string
  primary_persona: string
  manual_effort_minutes: number
  hourly_cost: number
  bluconn_monthly_charge: number
  created_at: string
  updated_at: string
  assigned: boolean
}

export interface Execution {
  id: string
  account_id: string
  workflow_id: string
  employee_id: string
  employee_name: string
  employee_code: string
  branch: string
  department: string
  designation: string
  executed_at: string
  actual_execution_time_minutes: number
  status: ExecutionStatus
}

export type PageId =
  | 'workflows'
  | 'flow-tracking'
  | 'analytics'
  | 'value-potential'

export interface Filters {
  accountId: string
  workflowIds: string[]
  startDate: string
  endDate: string
}

export interface EnrichedExecution extends Execution {
  workflow_name: string
  manual_effort_minutes: number
  hourly_cost: number
  time_saved_minutes: number
  amount_saved: number
}

export interface WorkflowBreakdown {
  workflow_id: string
  workflow_name: string
  executions: number
  time_saved_minutes: number
  amount_saved: number
  avg_value_per_execution: number
}

export interface AnalyticsSummary {
  totalExecutions: number
  totalTimeSavedHours: number
  totalAmountSaved: number
  currentROI: number | null
  valueByWorkflow: WorkflowBreakdown[]
}

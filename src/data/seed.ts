import type { Account, Execution, ExecutionStatus, Workflow } from '../types'

function mulberry32(seed: number) {
  let a = seed
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function pick<T>(rng: () => number, list: T[]): T {
  return list[Math.floor(rng() * list.length)]!
}

function randInt(rng: () => number, min: number, max: number): number {
  return Math.floor(rng() * (max - min + 1)) + min
}

const FIRST = [
  'Amit',
  'Priya',
  'Rahul',
  'Sneha',
  'Vikram',
  'Ananya',
  'John',
  'Meera',
  'Arjun',
  'Kavita',
  'Sanjay',
  'Neha',
  'Ravi',
  'Deepa',
  'Nikhil',
]
const LAST = [
  'Sharma',
  'Patel',
  'Reddy',
  'Singh',
  'Iyer',
  'Das',
  'Khan',
  'Nair',
  'Gupta',
  'Banerjee',
]
const BRANCHES = ['TARATALA', 'RAJARHAT', 'HOWRAH', 'SALT LAKE']
const DEPTS = ['OTHERS - TCPL', 'CONTRACT - TCPL', 'OPERATIONS', 'PROCUREMENT']
const DESIG = ['Contract', 'OFFICE', 'Site Staff', 'Driver']

export const ACCOUNTS: Account[] = [
  {
    id: 'acc_001',
    name: 'Trans Concrete Pvt Ltd',
    employees_count: 210,
  },
  {
    id: 'acc_002',
    name: 'XYZ Construction Ltd',
    employees_count: 50,
  },
  {
    id: 'acc_003',
    name: 'Metro Infra Services',
    employees_count: 80,
  },
]

const WORKFLOW_TEMPLATES: Omit<Workflow, 'id' | 'account_id'>[] = [
  {
    name: 'DPR Entry',
    description: 'Daily progress report capture for site engineers',
    primary_persona: 'Site Engineer',
    manual_effort_minutes: 30,
    hourly_cost: 300,
    bluconn_monthly_charge: 5000,
    created_at: '2026-09-01T00:00:00Z',
    updated_at: '2026-09-01T00:00:00Z',
    assigned: true,
  },
  {
    name: 'Face Attendance',
    description: 'Face attendance workflow for non-WhatsApp users',
    primary_persona: 'Site Manager',
    manual_effort_minutes: 20,
    hourly_cost: 250,
    bluconn_monthly_charge: 3000,
    created_at: '2026-09-01T00:00:00Z',
    updated_at: '2026-09-01T00:00:00Z',
    assigned: true,
  },
  {
    name: 'Material Request',
    description: 'Procurement material request and approval flow',
    primary_persona: 'Procurement Officer',
    manual_effort_minutes: 45,
    hourly_cost: 350,
    bluconn_monthly_charge: 4000,
    created_at: '2026-09-01T00:00:00Z',
    updated_at: '2026-09-01T00:00:00Z',
    assigned: true,
  },
  {
    name: 'Trip Workflow',
    description: 'Driver trip logging and odometer capture',
    primary_persona: 'Driver',
    manual_effort_minutes: 25,
    hourly_cost: 200,
    bluconn_monthly_charge: 2500,
    created_at: '2026-09-01T00:00:00Z',
    updated_at: '2026-09-01T00:00:00Z',
    assigned: true,
  },
  {
    name: 'odometer',
    description: 'Odometer capture for fleet trips',
    primary_persona: 'Driver',
    manual_effort_minutes: 12,
    hourly_cost: 180,
    bluconn_monthly_charge: 1500,
    created_at: '2026-09-01T00:00:00Z',
    updated_at: '2026-09-01T00:00:00Z',
    assigned: false,
  },
]

const SLUG: Record<string, string> = {
  'DPR Entry': 'dpr',
  'Face Attendance': 'attendance',
  'Material Request': 'material',
  'Trip Workflow': 'trip',
  odometer: 'odometer',
}

export function buildWorkflows(): Workflow[] {
  return ACCOUNTS.flatMap((account, accIndex) =>
    WORKFLOW_TEMPLATES.map((tpl, i) => {
      const slug = SLUG[tpl.name] ?? `wf${i}`
      const costNudge = accIndex * 10
      return {
        ...tpl,
        id: `wf_${slug}_${account.id.slice(-3)}`,
        account_id: account.id,
        hourly_cost: tpl.hourly_cost + costNudge,
        bluconn_monthly_charge: tpl.bluconn_monthly_charge + accIndex * 250,
      }
    }),
  )
}

function actualDuration(rng: () => number, manual: number): number {
  const bucket = rng()
  if (bucket < 0.3) return randInt(rng, 5, 15)
  if (bucket < 0.8) return randInt(rng, 20, 35)
  if (bucket < 0.95) return randInt(rng, 40, Math.max(40, manual + 5))
  return randInt(rng, manual + 1, manual + 20)
}

function statusFor(rng: () => number): ExecutionStatus {
  const n = rng()
  if (n < 0.9) return 'completed'
  if (n < 0.94) return 'in_progress'
  if (n < 0.97) return 'stopped'
  return 'failed'
}

interface Employee {
  id: string
  name: string
  code: string
  branch: string
  department: string
  designation: string
}

function employeesForAccount(account: Account, rng: () => number): Employee[] {
  const count = Math.min(40, Math.max(12, Math.round(account.employees_count / 8)))
  return Array.from({ length: count }, (_, i) => {
    const name = `${pick(rng, FIRST)} ${pick(rng, LAST)}`
    return {
      id: `emp_${account.id}_${String(i + 1).padStart(3, '0')}`,
      name: i === 0 && account.id === 'acc_001' ? 'Dispatch Officer T46' : name,
      code: `T${i + 10}`,
      branch: pick(rng, BRANCHES),
      department: pick(rng, DEPTS),
      designation: pick(rng, DESIG),
    }
  })
}

export function buildExecutions(workflows: Workflow[]): Execution[] {
  const rng = mulberry32(20260909)
  const executions: Execution[] = []
  let execN = 1

  for (const account of ACCOUNTS) {
    const employees = employeesForAccount(account, rng)
    const accountWorkflows = workflows.filter(
      (w) => w.account_id === account.id && w.assigned,
    )

    for (const workflow of accountWorkflows) {
      const count = randInt(rng, 80, 140)
      const adopters = employees.slice(
        0,
        Math.max(3, Math.round(employees.length * (0.25 + rng() * 0.5))),
      )

      for (let i = 0; i < count; i++) {
        const emp = pick(rng, adopters)
        const day = randInt(rng, 1, 9)
        const hour = randInt(rng, 4, 18)
        const minute = randInt(rng, 0, 59)
        const iso = new Date(
          Date.UTC(2026, 8, day, hour, minute, randInt(rng, 0, 59)),
        ).toISOString()

        executions.push({
          id: `exec_${String(execN++).padStart(5, '0')}`,
          account_id: account.id,
          workflow_id: workflow.id,
          employee_id: emp.id,
          employee_name: emp.name,
          employee_code: emp.code,
          branch: emp.branch,
          department: emp.department,
          designation: emp.designation,
          executed_at: iso,
          actual_execution_time_minutes: actualDuration(
            rng,
            workflow.manual_effort_minutes,
          ),
          status: statusFor(rng),
        })
      }
    }
  }

  return executions.sort(
    (a, b) => new Date(b.executed_at).getTime() - new Date(a.executed_at).getTime(),
  )
}

export const DEFAULT_START_DATE = '2026-09-01'
export const DEFAULT_END_DATE = '2026-09-09'

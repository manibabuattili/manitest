import {
  Activity,
  BarChart3,
  Bell,
  Play,
  UserPlus,
  Users,
} from 'lucide-react'
import { useState } from 'react'
import { useDashboard } from '../context/DashboardContext'
import type { PageId } from '../types'
import { DashboardFilters } from './FilterControls'
import { PrimaryButton, inputClass } from './ui'

const CATEGORIES: {
  id: string
  label: string
  icon: typeof BarChart3
  page: PageId | null
}[] = [
  {
    id: 'flow',
    label: 'Flow Tracking Analytics',
    icon: BarChart3,
    page: 'flow-tracking',
  },
  {
    id: 'cross',
    label: 'Cross-Account Performance',
    icon: Users,
    page: null,
  },
  {
    id: 'employee',
    label: 'Employee Activity',
    icon: Activity,
    page: 'flow-tracking',
  },
  {
    id: 'signups',
    label: 'Daily Signups',
    icon: UserPlus,
    page: null,
  },
  {
    id: 'reengage',
    label: 'Re-Engagement Status',
    icon: Bell,
    page: null,
  },
]

export function AnalyticsHub() {
  const { setPage, selectedAccount } = useDashboard()
  const [selected, setSelected] = useState(CATEGORIES[0]!.id)
  const cat = CATEGORIES.find((c) => c.id === selected) ?? CATEGORIES[0]!

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900">Analytics Dashboard</h1>
      <p className="mb-5 text-sm font-medium text-slate-600">
        Select an Analytics Category
      </p>

      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-5">
        {CATEGORIES.map((c) => {
          const Icon = c.icon
          const active = c.id === selected
          return (
            <button
              key={c.id}
              type="button"
              onClick={() => setSelected(c.id)}
              className={`rounded-xl border bg-white px-3 py-5 text-center shadow-sm transition ${
                active
                  ? 'border-[#17A2B8] ring-1 ring-[#17A2B8]'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <span className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full border border-[#17A2B8]/30 text-[#17A2B8]">
                <Icon size={22} />
              </span>
              <span className="text-sm font-semibold text-slate-800">{c.label}</span>
            </button>
          )
        })}
      </div>

      <p className="mb-3 text-sm text-slate-500">
        Select a category above to start analyzing your data
      </p>
      <DashboardFilters />

      <div className="flex flex-wrap items-center gap-3">
        <select className={`${inputClass()} max-w-xs`} defaultValue="all" disabled>
          <option value="all">All channels</option>
        </select>
        <PrimaryButton
          type="button"
          disabled={!cat.page}
          onClick={() => cat.page && setPage(cat.page)}
          className="inline-flex items-center gap-2"
        >
          <Play size={14} fill="currentColor" />
          Proceed
        </PrimaryButton>
        {!cat.page && (
          <span className="text-sm text-slate-500">
            {cat.label} is not included in this value dashboard yet.
          </span>
        )}
        <button
          type="button"
          className="text-sm font-medium text-[#17A2B8] hover:underline"
          onClick={() => setPage('analytics')}
        >
          Open ROI dashboard for {selectedAccount.name}
        </button>
      </div>
    </div>
  )
}

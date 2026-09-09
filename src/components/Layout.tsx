import { useState } from 'react'
import {
  BarChart3,
  Bell,
  Building2,
  ChevronDown,
  Hourglass,
  LayoutDashboard,
  Menu,
  TrendingUp,
  Users,
  Workflow,
  X,
} from 'lucide-react'
import { useDashboard } from '../context/DashboardContext'
import type { PageId } from '../types'

const NAV: {
  id: PageId
  label: string
  group: 'accounts' | 'analytics'
  icon: typeof Workflow
}[] = [
  { id: 'workflows', label: 'Workflows', group: 'accounts', icon: Workflow },
  {
    id: 'hub',
    label: 'Analytics',
    group: 'analytics',
    icon: LayoutDashboard,
  },
  {
    id: 'analytics',
    label: 'Dashboards',
    group: 'analytics',
    icon: BarChart3,
  },
  {
    id: 'flow-tracking',
    label: 'Flow Tracking',
    group: 'analytics',
    icon: Hourglass,
  },
  {
    id: 'value-potential',
    label: 'Value Potential',
    group: 'analytics',
    icon: TrendingUp,
  },
]

export function Sidebar({
  open,
  onClose,
}: {
  open: boolean
  onClose: () => void
}) {
  const { page, setPage } = useDashboard()
  const [accountsOpen, setAccountsOpen] = useState(true)
  const [analyticsOpen, setAnalyticsOpen] = useState(true)

  const go = (id: PageId) => {
    setPage(id)
    onClose()
  }

  return (
    <>
      {open && (
        <button
          className="fixed inset-0 z-30 bg-black/30 md:hidden"
          aria-label="Close navigation"
          onClick={onClose}
        />
      )}
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-slate-200 bg-white transition-transform md:static md:translate-x-0 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center gap-2 border-b border-slate-100 px-5 py-4">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#17A2B8] text-sm font-bold text-white">
            ✦
          </div>
          <div>
            <div className="text-base font-semibold text-slate-900">Bluconn</div>
            <div className="text-[11px] uppercase tracking-wide text-slate-400">
              Partner portal
            </div>
          </div>
          <button className="ml-auto md:hidden" onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4 text-sm">
          <MutedItem icon={Bell} label="Support" />
          <MutedItem icon={LayoutDashboard} label="Feature Management" />
          <MutedItem icon={Building2} label="Administration" />

          <button
            className="mt-3 flex w-full items-center justify-between rounded-md px-2 py-2 font-medium text-slate-700 hover:bg-slate-50"
            onClick={() => setAccountsOpen((v) => !v)}
          >
            <span className="flex items-center gap-2">
              <Users size={16} /> Accounts
            </span>
            <ChevronDown
              size={14}
              className={accountsOpen ? 'rotate-180' : ''}
            />
          </button>
          {accountsOpen && (
            <div className="ml-4 border-l border-slate-100 pl-2">
              <MutedItem label="Organizational Setup" nested />
              {NAV.filter((n) => n.group === 'accounts').map((item) => (
                <NavItem
                  key={item.id}
                  id={item.id}
                  label={item.label}
                  icon={item.icon}
                  active={page === item.id}
                  onClick={() => go(item.id)}
                />
              ))}
              <MutedItem label="Reports" nested />
              <MutedItem label="Entity" nested />
              <MutedItem label="Custom Screens" nested />
              <MutedItem label="Charts" nested />
            </div>
          )}

          <button
            className="mt-2 flex w-full items-center justify-between rounded-md px-2 py-2 font-medium text-slate-700 hover:bg-slate-50"
            onClick={() => setAnalyticsOpen((v) => !v)}
          >
            <span className="flex items-center gap-2">
              <BarChart3 size={16} /> Analytics
            </span>
            <ChevronDown
              size={14}
              className={analyticsOpen ? 'rotate-180' : ''}
            />
          </button>
          {analyticsOpen && (
            <div className="ml-4 border-l border-slate-100 pl-2">
              {NAV.filter((n) => n.group === 'analytics').map((item) => (
                <NavItem
                  key={item.id}
                  id={item.id}
                  label={item.label}
                  icon={item.icon}
                  active={page === item.id}
                  onClick={() => go(item.id)}
                />
              ))}
            </div>
          )}
        </nav>
      </aside>
    </>
  )
}

function NavItem({
  id,
  label,
  icon: Icon,
  active,
  onClick,
}: {
  id: PageId
  label: string
  icon: typeof Workflow
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      data-nav={id}
      className={`flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left ${
        active
          ? 'bg-[#e6f6f8] font-medium text-[#0f6c7c]'
          : 'text-slate-600 hover:bg-slate-50'
      }`}
    >
      <Icon size={15} />
      {label}
    </button>
  )
}

function MutedItem({
  label,
  icon: Icon,
}: {
  label: string
  icon?: typeof Workflow
  nested?: boolean
}) {
  return (
    <div className="flex items-center gap-2 rounded-md px-2 py-1.5 text-slate-400">
      {Icon ? <Icon size={16} /> : null}
      {label}
    </div>
  )
}

export function TopBar({ onMenu }: { onMenu: () => void }) {
  const { accounts, filters, setAccountId, selectedAccount } = useDashboard()

  return (
    <header className="flex items-center gap-3 border-b border-slate-200 bg-white px-4 py-3">
      <button
        className="rounded-md p-1 text-slate-600 hover:bg-slate-100 md:hidden"
        onClick={onMenu}
        aria-label="Open navigation"
      >
        <Menu size={20} />
      </button>
      <div className="hidden text-sm text-slate-500 md:block">
        Value & Impact Dashboard
      </div>
      <div className="ml-auto flex items-center gap-2">
        <label className="sr-only" htmlFor="account-select">
          Account
        </label>
        <select
          id="account-select"
          className="max-w-[220px] rounded-md border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-800"
          value={filters.accountId}
          onChange={(e) => setAccountId(e.target.value)}
        >
          {accounts.map((a) => (
            <option key={a.id} value={a.id}>
              {a.name}
            </option>
          ))}
        </select>
        <div className="hidden h-8 w-8 items-center justify-center rounded-full bg-[#17A2B8] text-xs font-semibold text-white sm:flex">
          {selectedAccount.name.slice(0, 2).toUpperCase()}
        </div>
      </div>
    </header>
  )
}

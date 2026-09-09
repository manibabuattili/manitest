import { useState } from 'react'
import { AnalyticsPage } from './components/AnalyticsPage'
import { FlowTrackingPage } from './components/FlowTrackingPage'
import { Sidebar, TopBar } from './components/Layout'
import { ValuePotentialPage } from './components/ValuePotentialPage'
import { WorkflowsPage } from './components/WorkflowsPage'
import { DashboardProvider, useDashboard } from './context/DashboardContext'

function Shell() {
  const { page } = useDashboard()
  const [navOpen, setNavOpen] = useState(false)

  return (
    <div className="flex min-h-svh bg-[#F5F7FA] text-[#212529]">
      <Sidebar open={navOpen} onClose={() => setNavOpen(false)} />
      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar onMenu={() => setNavOpen(true)} />
        <main className="flex-1 overflow-x-hidden p-4 md:p-6">
          {page === 'workflows' && <WorkflowsPage />}
          {page === 'flow-tracking' && <FlowTrackingPage />}
          {page === 'analytics' && <AnalyticsPage />}
          {page === 'value-potential' && <ValuePotentialPage />}
        </main>
      </div>
    </div>
  )
}

export default function App() {
  return (
    <DashboardProvider>
      <Shell />
    </DashboardProvider>
  )
}

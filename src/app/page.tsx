"use client";

import { PortalShell } from "@/components/layout/PortalShell";
import { UploadPanel } from "@/components/suite/UploadPanel";
import { SuiteSummary } from "@/components/suite/SuiteSummary";
import { ScenarioList } from "@/components/suite/ScenarioList";
import { ScenarioPreview } from "@/components/suite/ScenarioPreview";
import { ExecutionConfig } from "@/components/config/ExecutionConfig";
import { LiveDashboard } from "@/components/dashboard/LiveDashboard";
import { WorkerStrip } from "@/components/dashboard/WorkerStrip";
import { ExecutionTable } from "@/components/dashboard/ExecutionTable";
import { ExecutionDetail } from "@/components/dashboard/ExecutionDetail";
import { BatchReportCard } from "@/components/dashboard/BatchReportCard";
import { useTestSimulator } from "@/hooks/useTestSimulator";
import { SAMPLE_SUITE_DESCRIPTION } from "@/lib/excel/sampleData";

export default function TestSimulatorPage() {
  const sim = useTestSimulator();

  return (
    <PortalShell>
      <div className="mx-auto grid max-w-[1600px] gap-4 xl:grid-cols-[380px_minmax(0,1fr)]">
        <div className="flex flex-col gap-4">
          <UploadPanel
            sourceName={sim.suite.sourceName}
            onUpload={sim.uploadFile}
            onLoadSample={sim.loadSample}
            parseError={sim.parseError}
          />
          <p className="px-1 text-[11px] leading-relaxed text-slate-500">
            {SAMPLE_SUITE_DESCRIPTION} Upload a suite or keep the sample data to demo the full
            flow immediately.
          </p>
          <SuiteSummary
            scenarioCount={sim.suite.scenarios.length}
            totalSteps={sim.totalSteps}
            errorCount={sim.errorCount}
            warningCount={sim.warningCount}
            issues={sim.suite.issues}
          />
          <ScenarioList
            scenarios={sim.suite.scenarios}
            selectedIds={sim.selectedIds}
            previewId={sim.previewId}
            onToggle={sim.toggleScenario}
            onSelectAll={sim.selectAll}
            onPreview={sim.setPreviewId}
          />
          <ScenarioPreview scenario={sim.previewScenario} />
          <ExecutionConfig
            selectedCount={sim.selectedScenarios.length}
            runsPerScenario={sim.runsPerScenario}
            concurrency={sim.concurrency}
            totalExecutions={sim.totalExecutions}
            canRun={sim.canRun}
            phase={sim.phase}
            errorCount={sim.errorCount}
            onRunsChange={sim.setRunsPerScenario}
            onConcurrencyChange={sim.setConcurrency}
            onStart={sim.start}
            onStop={sim.stop}
            onReset={sim.resetRun}
          />
        </div>
        <div className="flex min-w-0 flex-col gap-4">
          <LiveDashboard progress={sim.progress} />
          <WorkerStrip workers={sim.workers} />
          <BatchReportCard report={sim.report} executions={sim.executions} />
          <ExecutionTable
            executions={sim.executions}
            selectedId={sim.selectedExecutionId}
            onSelect={sim.setSelectedExecutionId}
          />
          <ExecutionDetail execution={sim.selectedExecution} />
        </div>
      </div>
    </PortalShell>
  );
}

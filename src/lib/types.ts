export type Actor = string;
export type InputType = string;

export interface WorkflowStep {
  stepNo: number;
  actor: Actor;
  inputType: InputType;
  message: string;
  expectedResponse: string;
  testData: string;
  endOfScenario: boolean;
  rowNumber: number;
}

export interface TestScenario {
  id: string;
  name: string;
  steps: WorkflowStep[];
}

export interface ValidationIssue {
  level: "error" | "warning";
  row?: number;
  scenarioId?: string;
  message: string;
}

export interface TestSuite {
  scenarios: TestScenario[];
  issues: ValidationIssue[];
  sourceName: string;
  rawRowCount: number;
}

export type ExecutionStatus =
  | "queued"
  | "running"
  | "passed"
  | "failed"
  | "cancelled";

export type StepStatus = "pending" | "running" | "passed" | "failed" | "skipped";

export interface StepExecutionResult {
  stepNo: number;
  actor: Actor;
  inputType: InputType;
  message: string;
  expectedResponse: string;
  actualResponse: string;
  status: StepStatus;
  durationMs: number;
  startedAt?: number;
  finishedAt?: number;
  failureReason?: string;
}

export interface ScenarioExecution {
  executionId: string;
  sessionId: string;
  scenarioId: string;
  scenarioName: string;
  runIndex: number;
  totalRuns: number;
  status: ExecutionStatus;
  steps: StepExecutionResult[];
  startedAt?: number;
  finishedAt?: number;
  durationMs: number;
  currentStepNo?: number;
  workerSlot?: number;
}

export interface WorkerSlot {
  slot: number;
  executionId: string | null;
  scenarioId: string | null;
  scenarioName: string | null;
  stepNo: number | null;
  actor: string | null;
}

export interface BatchProgress {
  total: number;
  queued: number;
  running: number;
  passed: number;
  failed: number;
  cancelled: number;
  completed: number;
  percentComplete: number;
}

export interface FailureTally {
  key: string;
  label: string;
  count: number;
}

export interface BatchReport {
  passRate: number;
  avgDurationMs: number;
  p50DurationMs: number;
  p95DurationMs: number;
  mostCommonFailureScenario?: FailureTally;
  mostCommonFailureStep?: FailureTally;
}

export interface ExecutionContext {
  executionId: string;
  sessionId: string;
  scenario: TestScenario;
  runIndex: number;
}

export interface StepExecuteRequest {
  context: ExecutionContext;
  step: WorkflowStep;
  priorSteps: StepExecutionResult[];
}

export interface StepExecuteResponse {
  actualResponse: string;
  passed: boolean;
  failureReason?: string;
}

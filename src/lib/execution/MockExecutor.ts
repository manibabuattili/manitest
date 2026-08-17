import type {
  ExecutionContext,
  StepExecuteRequest,
  StepExecuteResponse,
} from "@/lib/types";
import type { AgentExecutor } from "./AgentExecutor";
import { hash32, unitRandom } from "./ids";

interface MockSession {
  history: string[];
  createdAt: number;
}

/**
 * In-browser stand-in for a real agent runtime.
 * Replace with RealAgentExecutor without changing the queue or UI contracts.
 */
export class MockExecutor implements AgentExecutor {
  private sessions = new Map<string, MockSession>();

  beginSession(sessionId: string): void {
    this.sessions.set(sessionId, { history: [], createdAt: Date.now() });
  }

  endSession(sessionId: string): void {
    this.sessions.delete(sessionId);
  }

  async executeStep(request: StepExecuteRequest): Promise<StepExecuteResponse> {
    const session = this.sessions.get(request.context.sessionId);
    if (!session) {
      throw new Error(`Unknown session ${request.context.sessionId}`);
    }

    const latency = this.latencyMs(request);
    await new Promise((r) => setTimeout(r, latency));

    session.history.push(`${request.step.actor}:${request.step.message}`);

    const fail = this.shouldFail(request.context, request.step.stepNo);
    if (!fail) {
      return {
        actualResponse: this.passingResponse(request.step.expectedResponse),
        passed: true,
      };
    }

    return this.failingResponse(request);
  }

  private latencyMs(request: StepExecuteRequest): number {
    const { step } = request;
    const jitter = 120 + (hash32(`${request.context.sessionId}:${step.stepNo}`) % 420);
    let multiplier = 1;
    if (step.actor === "SYSTEM") multiplier = 1.85;
    if (step.actor === "MANAGER") multiplier = 1.25;
    if (step.inputType === "image" || step.inputType === "file") multiplier += 0.55;
    return Math.round(jitter * multiplier);
  }

  private failRate(scenarioId: string, stepNo: number): number {
    if (scenarioId === "S-02" && stepNo === 3) return 0.62;
    if (scenarioId === "S-02") return 0.28;
    if (scenarioId === "S-04" && stepNo === 3) return 0.3;
    if (scenarioId === "S-05" && stepNo === 3) return 0.24;
    if (scenarioId === "S-06" && stepNo === 3) return 0.2;
    if (scenarioId === "S-01") return 0.07;
    return 0.12;
  }

  private shouldFail(context: ExecutionContext, stepNo: number): boolean {
    const rate = this.failRate(context.scenario.id, stepNo);
    return unitRandom(`${context.sessionId}:${stepNo}:fail`) < rate;
  }

  private passingResponse(expected: string): string {
    const trimmed = expected.trim();
    if (!trimmed) return '{"ok":true}';
    try {
      const parsed = JSON.parse(trimmed);
      return JSON.stringify(parsed);
    } catch {
      return trimmed;
    }
  }

  private failingResponse(request: StepExecuteRequest): StepExecuteResponse {
    const { step, context } = request;
    const kind = hash32(`${context.sessionId}:${step.stepNo}:kind`) % 3;

    if (context.scenario.id === "S-02" && step.stepNo === 3) {
      return {
        actualResponse: '{"amount":84.5,"currency":"USD","confidence":0.44}',
        passed: false,
        failureReason: "OCR amount mismatch: expected 84.5 with high confidence, received transposed digits without correction path.",
      };
    }

    if (kind === 0) {
      return {
        actualResponse: this.mutateExpected(step.expectedResponse),
        passed: false,
        failureReason: "Response payload did not match expected schema or values.",
      };
    }
    if (kind === 1) {
      return {
        actualResponse: '{"error":"timeout","code":"AGENT_STEP_TIMEOUT"}',
        passed: false,
        failureReason: "Mock agent step exceeded the simulated SLA.",
      };
    }
    return {
      actualResponse: `{"status":"unexpected","actor":"${step.actor}","echo":"${step.message.slice(0, 40)}"}`,
      passed: false,
      failureReason: "Unexpected actor output for this workflow step.",
    };
  }

  private mutateExpected(expected: string): string {
    try {
      const parsed = JSON.parse(expected) as Record<string, unknown>;
      const keys = Object.keys(parsed);
      if (keys.length) {
        const key = keys[0];
        if (typeof parsed[key] === "number") parsed[key] = Number(parsed[key]) * 10;
        else if (typeof parsed[key] === "string") parsed[key] = `${parsed[key]}_UNEXPECTED`;
        else parsed.unexpected = true;
      } else {
        parsed.unexpected = true;
      }
      return JSON.stringify(parsed);
    } catch {
      return `${expected} [UNEXPECTED]`;
    }
  }
}

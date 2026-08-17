import type { StepExecuteRequest, StepExecuteResponse } from "@/lib/types";

export interface AgentExecutor {
  /**
   * Isolated per execution via sessionId. A future RealAgentExecutor can
   * open a real agent session here instead of the in-memory mock store.
   */
  beginSession(sessionId: string, executionId: string): Promise<void> | void;
  executeStep(request: StepExecuteRequest): Promise<StepExecuteResponse>;
  endSession(sessionId: string): Promise<void> | void;
}

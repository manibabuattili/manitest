import type { StepExecuteResponse } from "@/lib/types";
import type { AgentExecutor } from "./AgentExecutor";

/**
 * Placeholder for a production agent runtime.
 * Swap MockExecutor for this class in useTestSimulator when a real API exists.
 * Session isolation must remain 1:1 with execution_id / session_id.
 */
export class RealAgentExecutor implements AgentExecutor {
  async beginSession(): Promise<void> {
    throw new Error("RealAgentExecutor is not wired in this prototype.");
  }

  async executeStep(): Promise<StepExecuteResponse> {
    throw new Error("RealAgentExecutor is not wired in this prototype.");
  }

  async endSession(): Promise<void> {
    throw new Error("RealAgentExecutor is not wired in this prototype.");
  }
}

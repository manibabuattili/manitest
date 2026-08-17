# Partner Portal · AI Agent Workflow Bulk Test Simulator

Prototype of a future Partner Portal Test Simulator. Users upload an Excel test suite, select scenarios, and run them through a **queue-based mock execution engine** with configurable concurrency.

## Run locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Sample suite data is loaded automatically so the full experience can be demonstrated without an upload. Use **Download template** to export the Excel format, or **Sample** to restore demo scenarios.

## Excel columns

`Scenario_ID` · `Scenario_Name` · `Step_No` · `Actor` · `Input_Type` · `Message` · `Expected_Response` · `Test_Data` · `End_of_Scenario`

Rows are grouped by `Scenario_ID` into `TestScenario` objects. Actors are free-form (`USER`, `SYSTEM`, `MANAGER`, …).

## Architecture

| Concern | Location |
| --- | --- |
| Excel parse / validate / group | `src/lib/excel/` |
| Scenario model | `src/lib/types.ts` |
| Queue + concurrency | `src/lib/execution/ExecutionQueue.ts` |
| Mock engine | `src/lib/execution/MockExecutor.ts` (`AgentExecutor` interface) |
| Reporting + export | `src/lib/reporting/` |
| UI | `src/components/` |

`MockExecutor` can be replaced later with `RealAgentExecutor` without changing the queue or dashboard contracts. Each execution has an isolated `execution_id` and `session_id`.

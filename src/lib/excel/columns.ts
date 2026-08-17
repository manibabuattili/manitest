export const REQUIRED_COLUMNS = [
  "Scenario_ID",
  "Scenario_Name",
  "Step_No",
  "Actor",
  "Input_Type",
  "Message",
  "Expected_Response",
  "Test_Data",
  "End_of_Scenario",
] as const;

export type ExcelColumn = (typeof REQUIRED_COLUMNS)[number];

export function normalizeHeader(value: unknown): string {
  return String(value ?? "")
    .trim()
    .replace(/\s+/g, "_");
}

export function headerKey(value: unknown): string {
  return normalizeHeader(value).toLowerCase();
}

export const HEADER_ALIASES: Record<string, ExcelColumn> = {
  scenario_id: "Scenario_ID",
  scenarioid: "Scenario_ID",
  scenario_name: "Scenario_Name",
  scenarioname: "Scenario_Name",
  step_no: "Step_No",
  stepno: "Step_No",
  step_number: "Step_No",
  actor: "Actor",
  input_type: "Input_Type",
  inputtype: "Input_Type",
  message: "Message",
  expected_response: "Expected_Response",
  expectedresponse: "Expected_Response",
  test_data: "Test_Data",
  testdata: "Test_Data",
  end_of_scenario: "End_of_Scenario",
  endofscenario: "End_of_Scenario",
};

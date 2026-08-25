export type ShiftId =
  | "night-6pm-6am"
  | "day-6am-6pm"
  | "0930-1815"
  | "2000-0800"
  | "0800-1700";

export type HistoryChange = {
  id: string;
  savedAt: string;
  clockInFrom: string | null;
  clockInTo: string | null;
  clockOutFrom: string | null;
  clockOutTo: string | null;
  shiftFrom: ShiftId | null;
  shiftTo: ShiftId | null;
};

export type AttendanceRow = {
  id: string;
  name: string;
  employeeId: string;
  initials: string;
  avatarClass: string;
  shiftId: ShiftId | null;
  clockIn: string | null;
  clockOut: string | null;
  clockInRegularized: boolean;
  clockOutRegularized: boolean;
  overtime: string | null;
  history: HistoryChange[];
};

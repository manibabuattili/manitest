import { CustomerSidebar } from "@/components/layout/customer-sidebar";
import { AttendanceShell } from "@/features/attendance/attendance-shell";

export default function AttendanceLayout({ children }: { children: React.ReactNode }) {
  return (
    <AttendanceShell sidebar={<CustomerSidebar />}>
      {children}
    </AttendanceShell>
  );
}

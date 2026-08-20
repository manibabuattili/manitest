import * as React from "react";
import { cn } from "@/lib/utils";

const Badge = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { tone?: "default" | "success" | "warning" | "info" | "danger" | "purple" | "pink" }
>(({ className, tone = "default", ...props }, ref) => {
  const tones = {
    default: "bg-gray-100 text-gray-700 ring-gray-200",
    success: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    warning: "bg-orange-50 text-orange-700 ring-orange-200",
    info: "bg-blue-50 text-blue-700 ring-blue-200",
    danger: "bg-red-50 text-red-700 ring-red-200",
    purple: "bg-violet-50 text-violet-700 ring-violet-200",
    pink: "bg-pink-50 text-pink-700 ring-pink-200",
  };
  return (
    <div
      ref={ref}
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset",
        tones[tone],
        className
      )}
      {...props}
    />
  );
});
Badge.displayName = "Badge";

export { Badge };

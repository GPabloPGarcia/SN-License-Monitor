import { cn } from "@/lib/utils";

const STATUS_STYLES: Record<string, string> = {
  compliant: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  withinlimit: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  ok: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  overallocated: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  under: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  atrisk: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
  expiring: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
  expired: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400",
  active: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400"
};

// Maps normalized API codes to human-readable labels matching the platform's display
const DISPLAY_NAMES: Record<string, string> = {
  compliant: "Compliant",
  withinlimit: "Compliant",
  ok: "Compliant",
  overallocated: "Over-Allocated",
  under: "Over-Allocated",
  atrisk: "At Risk",
  expiring: "Expiring",
  expired: "Expired",
  active: "Active"
};

function normalizeStatus(status: string) {
  return status.trim().toLowerCase().replace(/[-\s_]/g, "");
}

export function PlatformStatusBadge({ status }: { status: string | null }) {
  if (!status) return <span className="text-muted-foreground">-</span>;

  const key = normalizeStatus(status);
  const style = STATUS_STYLES[key];
  const label = DISPLAY_NAMES[key] ?? status;

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
        style ?? "bg-secondary text-secondary-foreground"
      )}
    >
      {label}
    </span>
  );
}

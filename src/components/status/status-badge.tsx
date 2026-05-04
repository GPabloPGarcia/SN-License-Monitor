import type { CollectorStatus } from "@prisma/client";
import { Badge } from "@/components/ui/badge";

export function StatusBadge({ status }: { status: CollectorStatus | "PENDING" }) {
  if (status === "SUCCESS") {
    return <Badge variant="low">SUCCESS</Badge>;
  }

  if (status === "PARTIAL") {
    return <Badge variant="medium">PARTIAL</Badge>;
  }

  if (status === "FAILED") {
    return <Badge variant="critical">FAILED</Badge>;
  }

  if (status === "RUNNING") {
    return <Badge variant="secondary">RUNNING</Badge>;
  }

  return <Badge variant="outline">PENDING</Badge>;
}

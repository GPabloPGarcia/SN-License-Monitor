import type { RiskLevel } from "@prisma/client";
import { Badge } from "@/components/ui/badge";

export function RiskBadge({ riskLevel }: { riskLevel: RiskLevel }) {
  const variant = {
    LOW: "low",
    MEDIUM: "medium",
    HIGH: "high",
    CRITICAL: "critical"
  }[riskLevel] as "low" | "medium" | "high" | "critical";

  return <Badge variant={variant}>{riskLevel}</Badge>;
}

import { NextResponse } from "next/server";
import { runWeeklyCollection } from "@/services/CollectorRunService";

export async function POST(request: Request) {
  const cronSecret = process.env.CRON_SECRET;
  const authorization = request.headers.get("authorization");
  const token = authorization?.replace(/^Bearer\s+/i, "");

  if (!cronSecret || token !== cronSecret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const run = await runWeeklyCollection();

  return NextResponse.json({
    id: run.id,
    status: run.status,
    totalInstances: run.totalInstances,
    totalSuccess: run.totalSuccess,
    totalFailed: run.totalFailed,
    totalSnapshots: run.totalSnapshots
  });
}

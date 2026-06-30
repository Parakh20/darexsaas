import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/auth/session";
import { tenantPrisma } from "@/lib/prisma";
import { ok } from "@/lib/utils";

export async function GET(req: NextRequest) {
  const user = await requireSession();
  const tp = tenantPrisma(user);

  const [activeOpps, pipeline, pendingTasks, recentContacts, recentAuditLogs] = await Promise.all([
    tp.opportunity.count({ where: { stage: { not: "CLOSED_LOST" } } }),
    tp.opportunity.aggregate({ where: { stage: { not: "CLOSED_LOST" } }, _sum: { value: true } }),
    tp.task.count({ where: { status: "PENDING" } }),
    tp.contact.count({ where: { status: "ACTIVE" } }),
    tp.auditLog.findMany({ where: { aiInitiated: true }, orderBy: { createdAt: "desc" }, take: 10 }),
  ]);

  return NextResponse.json(ok({
    activeOpportunities: activeOpps,
    revenuePipeline: pipeline._sum.value ?? 0,
    pendingFollowUps: pendingTasks,
    activeContacts: recentContacts,
    aiAlerts: recentAuditLogs.map((log) => ({ id: log.id, action: log.action, createdAt: log.createdAt, details: log.details })),
  }));
}

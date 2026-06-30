import { prisma } from "@/lib/prisma";
import { createAuditLog } from "@/lib/prisma";
import type { ToolDefinition, FetchBusinessMetricsInput } from "./types";
import type { ToolContext } from "./types";

export const fetchBusinessMetricsTool: ToolDefinition<FetchBusinessMetricsInput> = {
  name: "fetchBusinessMetrics",
  description: "Fetch business KPIs and dashboard statistics",
  parameters: { type: "object", properties: { metric: { type: "string", enum: ["all","opportunities","tasks","contacts","pipeline"] } } },
  async execute({ metric = "all" }, { user }: ToolContext) {
    const [opps, tasks, contacts, pipeline] = await Promise.all([
      (metric === "all" || metric === "opportunities") ? prisma.opportunity.count({ where: { tenantId: user.tenantId, stage: { not: "CLOSED_LOST" } } }) : 0,
      (metric === "all" || metric === "tasks") ? prisma.task.count({ where: { tenantId: user.tenantId, status: "PENDING" } }) : 0,
      (metric === "all" || metric === "contacts") ? prisma.contact.count({ where: { tenantId: user.tenantId, status: "ACTIVE" } }) : 0,
      (metric === "all" || metric === "pipeline") ? prisma.opportunity.aggregate({ where: { tenantId: user.tenantId, stage: { not: "CLOSED_LOST" } }, _sum: { value: true } }) : { _sum: { value: 0 } },
    ]);
    await createAuditLog({ tenantId: user.tenantId, userId: user.id, action: "ai.fetchMetrics", details: { metric }, aiInitiated: true });
    return { activeOpportunities: opps, pendingTasks: tasks, activeContacts: contacts, revenuePipeline: pipeline._sum.value ?? 0 };
  },
};

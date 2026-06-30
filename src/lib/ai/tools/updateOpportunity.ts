import { prisma } from "@/lib/prisma";
import { createAuditLog } from "@/lib/prisma";
import type { ToolDefinition, UpdateOpportunityInput } from "./types";
import type { ToolContext } from "./types";

export const updateOpportunityTool: ToolDefinition<UpdateOpportunityInput> = {
  name: "updateOpportunity",
  description: "Update a CRM opportunity stage, value, or notes",
  parameters: {
    type: "object",
    properties: {
      opportunityId: { type: "string" },
      stage: { type: "string", enum: ["LEAD","QUALIFIED","PROPOSAL","NEGOTIATION","CLOSED_WON","CLOSED_LOST"] },
      value: { type: "number" },
      notes: { type: "string" },
      probability: { type: "number" },
    },
    required: ["opportunityId"],
  },
  async execute({ opportunityId, stage, value, notes, probability }, { user }: ToolContext) {
    const existing = await prisma.opportunity.findFirst({ where: { id: opportunityId, tenantId: user.tenantId } });
    if (!existing) return { error: "Opportunity not found" };
    const updated = await prisma.opportunity.update({
      where: { id: opportunityId },
      data: { ...(stage && { stage: stage as import("@prisma/client").OpportunityStage }), ...(value !== undefined && { value }), ...(notes && { notes }), ...(probability !== undefined && { probability }) },
    });
    await createAuditLog({ tenantId: user.tenantId, userId: user.id, action: "ai.updateOpportunity", entityType: "Opportunity", entityId: opportunityId, details: { stage, value }, aiInitiated: true });
    return { id: updated.id, stage: updated.stage, value: updated.value };
  },
};

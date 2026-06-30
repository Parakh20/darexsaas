import { prisma } from "@/lib/prisma";
import { createAuditLog } from "@/lib/prisma";
import type { ToolDefinition, CreateTaskInput } from "./types";
import type { ToolContext } from "./types";
import { addDays } from "date-fns";

export const createTaskTool: ToolDefinition<CreateTaskInput> = {
  name: "createTask",
  description: "Create a reminder or follow-up task",
  parameters: {
    type: "object",
    properties: {
      title: { type: "string" },
      description: { type: "string" },
      contactId: { type: "string" },
      opportunityId: { type: "string" },
      dueDate: { type: "string", description: "ISO date string or relative like 'tomorrow'" },
      priority: { type: "string", enum: ["LOW","MEDIUM","HIGH","URGENT"] },
    },
    required: ["title"],
  },
  async execute({ title, description, contactId, opportunityId, dueDate, priority = "MEDIUM" }, { user }: ToolContext) {
    let parsedDue: Date | undefined;
    if (dueDate) {
      if (dueDate.toLowerCase() === "tomorrow") parsedDue = addDays(new Date(), 1);
      else parsedDue = new Date(dueDate);
    }
    const task = await prisma.task.create({
      data: { tenantId: user.tenantId, assigneeId: user.id, title, description, contactId, opportunityId, dueDate: parsedDue, priority: priority as import("@prisma/client").Priority, aiGenerated: true },
    });
    await createAuditLog({ tenantId: user.tenantId, userId: user.id, action: "ai.createTask", entityType: "Task", entityId: task.id, details: { title, dueDate }, aiInitiated: true });
    return { id: task.id, title: task.title, dueDate: task.dueDate?.toISOString() ?? null, status: task.status };
  },
};

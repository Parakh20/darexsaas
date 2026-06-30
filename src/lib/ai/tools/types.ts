import type { SessionUser } from "@/lib/types";

export interface ToolContext {
  user: SessionUser;
}

export interface ToolDefinition<TInput = Record<string, unknown>> {
  name: string;
  description: string;
  parameters: Record<string, unknown>;
  execute(args: TInput, context: ToolContext): Promise<unknown>;
}

export interface SearchContactsInput {
  query: string;
  limit?: number;
}

export interface CreateTaskInput {
  title: string;
  description?: string;
  contactId?: string;
  opportunityId?: string;
  dueDate?: string;
  priority?: string;
}

export interface UpdateOpportunityInput {
  opportunityId: string;
  stage?: string;
  value?: number;
  notes?: string;
  probability?: number;
}

export interface SendWhatsAppInput {
  to: string;
  message: string;
  contactId?: string;
}

export interface FetchBusinessMetricsInput {
  metric?: "all" | "opportunities" | "tasks" | "contacts" | "pipeline";
}

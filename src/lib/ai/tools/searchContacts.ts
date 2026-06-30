import { prisma } from "@/lib/prisma";
import { createAuditLog } from "@/lib/prisma";
import type { ToolDefinition, SearchContactsInput } from "./types";
import type { ToolContext } from "./types";

export const searchContactsTool: ToolDefinition<SearchContactsInput> = {
  name: "searchContacts",
  description: "Search for contacts/customers by name, email, phone, or company",
  parameters: {
    type: "object",
    properties: {
      query: { type: "string", description: "Search query" },
      limit: { type: "number", description: "Max results (default 5)" },
    },
    required: ["query"],
  },
  async execute({ query, limit = 5 }, { user }: ToolContext) {
    const contacts = await prisma.contact.findMany({
      where: {
        tenantId: user.tenantId,
        OR: [
          { name: { contains: query, mode: "insensitive" } },
          { email: { contains: query, mode: "insensitive" } },
          { phone: { contains: query, mode: "insensitive" } },
          { company: { contains: query, mode: "insensitive" } },
        ],
      },
      take: limit,
      orderBy: { updatedAt: "desc" },
    });
    await createAuditLog({ tenantId: user.tenantId, userId: user.id, action: "ai.searchContacts", details: { query, resultCount: contacts.length }, aiInitiated: true });
    return contacts.map((c) => ({ id: c.id, name: c.name, email: c.email, phone: c.phone, company: c.company, leadScore: c.leadScore }));
  },
};

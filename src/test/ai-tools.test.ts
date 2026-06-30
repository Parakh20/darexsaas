import { describe, it, expect, vi } from "vitest";
import type { SessionUser } from "@/lib/types";

const mockContacts = [{ id: "c1", name: "Rahul Sharma", email: "rahul@acme.com", phone: "+919876543210", company: "Acme Corp", leadScore: 85 }];

vi.mock("@/lib/prisma", () => ({
  prisma: {
    contact: { findMany: vi.fn().mockResolvedValue(mockContacts) },
    task: { create: vi.fn().mockResolvedValue({ id: "t1", title: "Follow up with Rahul", dueDate: new Date(), status: "PENDING" }) },
    conversation: { findFirst: vi.fn().mockResolvedValue(null), create: vi.fn().mockResolvedValue({ id: "conv1" }) },
    message: { create: vi.fn().mockResolvedValue({ id: "msg1" }) },
  },
  createAuditLog: vi.fn(),
}));

const mockUser: SessionUser = { id: "u1", email: "owner@tenant.com", name: "Owner", tenantId: "tenant1", role: "OWNER", image: null };

describe("AI Tool: searchContacts", () => {
  it("returns matching contacts for query", async () => {
    const { searchContactsTool } = await import("@/lib/ai/tools/searchContacts");
    const result = await searchContactsTool.execute({ query: "Rahul" }, { user: mockUser });
    expect(result).toHaveLength(1);
    expect((result as typeof mockContacts)[0].name).toBe("Rahul Sharma");
  });

  it("limits results", async () => {
    const { searchContactsTool } = await import("@/lib/ai/tools/searchContacts");
    const result = await searchContactsTool.execute({ query: "a", limit: 1 }, { user: mockUser });
    expect(Array.isArray(result)).toBe(true);
  });
});

describe("AI Tool: createTask", () => {
  it("creates a task for follow-up", async () => {
    const { createTaskTool } = await import("@/lib/ai/tools/createTask");
    const result = await createTaskTool.execute(
      { title: "Follow up with Rahul", dueDate: "tomorrow", priority: "HIGH", contactId: "c1" },
      { user: mockUser }
    ) as { id: string; title: string; status: string };
    expect(result.id).toBe("t1");
    expect(result.status).toBe("PENDING");
  });
});

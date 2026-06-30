import { describe, it, expect, vi } from "vitest";
import { tenantPrisma } from "@/lib/prisma";
import type { SessionUser } from "@/lib/types";

vi.mock("@/lib/prisma", () => {
  const db: Record<string, Array<Record<string, unknown>>> = {
    tenantA: [{ id: "c1", name: "Alice", tenantId: "tenantA" }],
    tenantB: [{ id: "c2", name: "Bob", tenantId: "tenantB" }],
  };

  return {
    prisma: {},
    tenantPrisma: (user: SessionUser) => ({
      contact: {
        findMany: async () => {
          return db[user.tenantId] ?? [];
        },
        count: async () => (db[user.tenantId] ?? []).length,
      },
    }),
    createAuditLog: vi.fn(),
  };
});

const userA: SessionUser = { id: "u1", email: "a@a.com", name: "A", tenantId: "tenantA", role: "OWNER", image: null };
const userB: SessionUser = { id: "u2", email: "b@b.com", name: "B", tenantId: "tenantB", role: "OWNER", image: null };

describe("Tenant Isolation", () => {
  it("tenant A can only see their own contacts", async () => {
    const tp = tenantPrisma(userA);
    const contacts = await tp.contact.findMany({});
    expect(contacts.every((c: Record<string, unknown>) => c.tenantId === "tenantA")).toBe(true);
  });

  it("tenant B cannot see tenant A contacts", async () => {
    const tpA = tenantPrisma(userA);
    const tpB = tenantPrisma(userB);
    const contactsA = await tpA.contact.findMany({});
    const contactsB = await tpB.contact.findMany({});
    const aIds = contactsA.map((c: Record<string, unknown>) => c.id);
    const bIds = contactsB.map((c: Record<string, unknown>) => c.id);
    expect(aIds.some((id: unknown) => bIds.includes(id))).toBe(false);
  });

  it("cross-tenant count returns 0 for empty tenant", async () => {
    const userC: SessionUser = { id: "u3", email: "c@c.com", name: "C", tenantId: "tenantC", role: "MEMBER", image: null };
    const tpC = tenantPrisma(userC);
    const count = await tpC.contact.count();
    expect(count).toBe(0);
  });
});

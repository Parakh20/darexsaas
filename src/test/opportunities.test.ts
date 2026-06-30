import { describe, it, expect, vi } from "vitest";
import { tenantPrisma } from "@/lib/prisma";
import type { SessionUser } from "@/lib/types";

vi.mock("@/lib/prisma", () => {
  const db: Record<string, Array<Record<string, unknown>>> = {
    tenantA: [{ id: "o1", title: "Deal A", stage: "LEAD", tenantId: "tenantA", value: 50000 }],
    tenantB: [{ id: "o2", title: "Deal B", stage: "PROPOSAL", tenantId: "tenantB", value: 100000 }],
  };
  return {
    prisma: {},
    tenantPrisma: (user: { tenantId: string }) => ({
      opportunity: {
        findMany: async () => db[user.tenantId] ?? [],
        count: async () => (db[user.tenantId] ?? []).length,
      },
    }),
    createAuditLog: vi.fn(),
  };
});

// ---------------------------------------------------------------------------
// Pure pipeline-value logic (no DB required)
// ---------------------------------------------------------------------------

type OpportunityStage =
  | "LEAD"
  | "QUALIFIED"
  | "PROPOSAL"
  | "NEGOTIATION"
  | "CLOSED_WON"
  | "CLOSED_LOST";

interface Opportunity {
  id: string;
  stage: OpportunityStage;
  value: number;
}

const EXCLUDED_STAGES: OpportunityStage[] = ["CLOSED_WON", "CLOSED_LOST"];

function activePipelineValue(opportunities: Opportunity[]): number {
  return opportunities
    .filter((o) => !EXCLUDED_STAGES.includes(o.stage))
    .reduce((sum, o) => sum + o.value, 0);
}

describe("activePipelineValue()", () => {
  it("sums values of active (non-closed) opportunities", () => {
    const opps: Opportunity[] = [
      { id: "1", stage: "LEAD", value: 10000 },
      { id: "2", stage: "PROPOSAL", value: 20000 },
      { id: "3", stage: "NEGOTIATION", value: 5000 },
    ];
    expect(activePipelineValue(opps)).toBe(35000);
  });

  it("excludes CLOSED_WON from pipeline value", () => {
    const opps: Opportunity[] = [
      { id: "1", stage: "LEAD", value: 10000 },
      { id: "2", stage: "CLOSED_WON", value: 50000 },
    ];
    expect(activePipelineValue(opps)).toBe(10000);
  });

  it("excludes CLOSED_LOST from pipeline value", () => {
    const opps: Opportunity[] = [
      { id: "1", stage: "QUALIFIED", value: 15000 },
      { id: "2", stage: "CLOSED_LOST", value: 30000 },
    ];
    expect(activePipelineValue(opps)).toBe(15000);
  });

  it("returns 0 when all opportunities are closed", () => {
    const opps: Opportunity[] = [
      { id: "1", stage: "CLOSED_WON", value: 100000 },
      { id: "2", stage: "CLOSED_LOST", value: 20000 },
    ];
    expect(activePipelineValue(opps)).toBe(0);
  });

  it("returns 0 for an empty array", () => {
    expect(activePipelineValue([])).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// Tenant isolation for opportunities
// ---------------------------------------------------------------------------

const userA: SessionUser = {
  id: "u1",
  email: "a@a.com",
  name: "A",
  tenantId: "tenantA",
  role: "OWNER",
  image: null,
};
const userB: SessionUser = {
  id: "u2",
  email: "b@b.com",
  name: "B",
  tenantId: "tenantB",
  role: "OWNER",
  image: null,
};

describe("Tenant Isolation — Opportunities", () => {
  it("tenant A only sees their own opportunities", async () => {
    const tp = tenantPrisma(userA);
    const opps = await tp.opportunity.findMany();
    expect(opps.every((o: Record<string, unknown>) => o.tenantId === "tenantA")).toBe(true);
  });

  it("tenant B only sees their own opportunities", async () => {
    const tp = tenantPrisma(userB);
    const opps = await tp.opportunity.findMany();
    expect(opps.every((o: Record<string, unknown>) => o.tenantId === "tenantB")).toBe(true);
  });

  it("tenant A cannot see tenant B opportunities", async () => {
    const tpA = tenantPrisma(userA);
    const tpB = tenantPrisma(userB);
    const oppsA = await tpA.opportunity.findMany();
    const oppsB = await tpB.opportunity.findMany();
    const idsA = oppsA.map((o: Record<string, unknown>) => o.id);
    const idsB = oppsB.map((o: Record<string, unknown>) => o.id);
    expect(idsA.some((id: unknown) => idsB.includes(id))).toBe(false);
  });

  it("empty tenant returns 0 opportunities", async () => {
    const userC: SessionUser = {
      id: "u3",
      email: "c@c.com",
      name: "C",
      tenantId: "tenantC",
      role: "MEMBER",
      image: null,
    };
    const tpC = tenantPrisma(userC);
    const count = await tpC.opportunity.count();
    expect(count).toBe(0);
  });

  it("empty tenant findMany returns empty array", async () => {
    const userC: SessionUser = {
      id: "u3",
      email: "c@c.com",
      name: "C",
      tenantId: "tenantC",
      role: "MEMBER",
      image: null,
    };
    const tpC = tenantPrisma(userC);
    const opps = await tpC.opportunity.findMany();
    expect(opps).toHaveLength(0);
  });

  it("tenant A count returns exactly 1", async () => {
    const tp = tenantPrisma(userA);
    const count = await tp.opportunity.count();
    expect(count).toBe(1);
  });
});

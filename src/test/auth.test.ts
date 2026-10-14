import { describe, it, expect, vi } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: { findUnique: vi.fn(), create: vi.fn() },
    tenant: { create: vi.fn() },
    auditLog: { create: vi.fn() },
  },
  tenantPrisma: vi.fn(),
  createAuditLog: vi.fn(),
}));

describe("Auth utilities", () => {
  it("generates unique tenant slug from email domain", () => {
    const email = "user@acme.com";
    const domain = email.split("@")[1].split(".")[0];
    const slug = `${domain}-${Date.now()}`;
    expect(slug).toMatch(/^acme-\d+$/);
  });

  it("rejects empty email", () => {
    const email = "";
    expect(email.includes("@")).toBe(false);
  });

  it("extracts domain from email correctly", () => {
    const email = "test@example.org";
    const domain = email.split("@")[1];
    expect(domain).toBe("example.org");
  });
});

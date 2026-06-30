import { PrismaClient } from "@prisma/client";
import type { SessionUser } from "./types";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
});

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

export function tenantPrisma(user: SessionUser) {
  return prisma.$extends({
    query: {
      contact: {
        async findMany({ args, query }) { args.where = { ...args.where, tenantId: user.tenantId }; return query(args); },
        async findFirst({ args, query }) { args.where = { ...args.where, tenantId: user.tenantId }; return query(args); },
        async findUnique({ args }) { return prisma.contact.findFirst({ ...args, where: { ...args.where, tenantId: user.tenantId } }); },
        async create({ args, query }) { (args.data as Record<string, unknown>)["tenantId"] = user.tenantId; return query(args); },
        async update({ args, query }) { args.where = { ...args.where, tenantId: user.tenantId } as typeof args.where; return query(args); },
        async delete({ args, query }) { args.where = { ...args.where, tenantId: user.tenantId } as typeof args.where; return query(args); },
        async count({ args, query }) { args.where = { ...args.where, tenantId: user.tenantId }; return query(args); },
      },
      opportunity: {
        async findMany({ args, query }) { args.where = { ...args.where, tenantId: user.tenantId }; return query(args); },
        async findFirst({ args, query }) { args.where = { ...args.where, tenantId: user.tenantId }; return query(args); },
        async create({ args, query }) { (args.data as Record<string, unknown>)["tenantId"] = user.tenantId; return query(args); },
        async update({ args, query }) { args.where = { ...args.where, tenantId: user.tenantId } as typeof args.where; return query(args); },
        async count({ args, query }) { args.where = { ...args.where, tenantId: user.tenantId }; return query(args); },
      },
      conversation: {
        async findMany({ args, query }) { args.where = { ...args.where, tenantId: user.tenantId }; return query(args); },
        async findFirst({ args, query }) { args.where = { ...args.where, tenantId: user.tenantId }; return query(args); },
        async create({ args, query }) { (args.data as Record<string, unknown>)["tenantId"] = user.tenantId; return query(args); },
        async count({ args, query }) { args.where = { ...args.where, tenantId: user.tenantId }; return query(args); },
      },
      chatConversation: {
        async findMany({ args, query }) { args.where = { ...args.where, tenantId: user.tenantId }; return query(args); },
        async findFirst({ args, query }) { args.where = { ...args.where, tenantId: user.tenantId }; return query(args); },
        async create({ args, query }) { (args.data as Record<string, unknown>)["tenantId"] = user.tenantId; return query(args); },
      },
      task: {
        async findMany({ args, query }) { args.where = { ...args.where, tenantId: user.tenantId }; return query(args); },
        async findFirst({ args, query }) { args.where = { ...args.where, tenantId: user.tenantId }; return query(args); },
        async create({ args, query }) { (args.data as Record<string, unknown>)["tenantId"] = user.tenantId; return query(args); },
        async update({ args, query }) { args.where = { ...args.where, tenantId: user.tenantId } as typeof args.where; return query(args); },
        async count({ args, query }) { args.where = { ...args.where, tenantId: user.tenantId }; return query(args); },
      },
      auditLog: {
        async findMany({ args, query }) { args.where = { ...args.where, tenantId: user.tenantId }; return query(args); },
        async create({ args, query }) { (args.data as Record<string, unknown>)["tenantId"] = user.tenantId; return query(args); },
      },
      workflowRun: {
        async findMany({ args, query }) { args.where = { ...args.where, tenantId: user.tenantId }; return query(args); },
        async create({ args, query }) { (args.data as Record<string, unknown>)["tenantId"] = user.tenantId; return query(args); },
      },
    },
  });
}

export async function createAuditLog(params: {
  tenantId: string; userId?: string; action: string; entityType?: string;
  entityId?: string; details?: Record<string, unknown>; aiInitiated?: boolean; ipAddress?: string;
}) {
  return prisma.auditLog.create({ data: params as unknown as import("@prisma/client").Prisma.AuditLogUncheckedCreateInput });
}

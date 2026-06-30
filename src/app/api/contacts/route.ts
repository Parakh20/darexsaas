import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/auth/session";
import { tenantPrisma } from "@/lib/prisma";
import { ok, err } from "@/lib/utils";
import { z } from "zod";

const CreateContactSchema = z.object({
  name: z.string().min(1).max(200),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  company: z.string().optional(),
  position: z.string().optional(),
  notes: z.string().optional(),
  source: z.string().optional(),
  tags: z.array(z.string()).optional(),
});

export async function GET(req: NextRequest) {
  const user = await requireSession();
  const tp = tenantPrisma(user);
  const url = new URL(req.url);
  const q = url.searchParams.get("q");
  const page = parseInt(url.searchParams.get("page") ?? "1");
  const limit = 20;

  const where = q ? { OR: [{ name: { contains: q, mode: "insensitive" as const } }, { email: { contains: q, mode: "insensitive" as const } }, { company: { contains: q, mode: "insensitive" as const } }] } : {};
  const [contacts, total] = await Promise.all([
    tp.contact.findMany({ where, take: limit, skip: (page - 1) * limit, orderBy: { updatedAt: "desc" } }),
    tp.contact.count({ where }),
  ]);
  return NextResponse.json(ok({ data: contacts, total, page, limit }));
}

export async function POST(req: NextRequest) {
  const user = await requireSession();
  const body = await req.json();
  const parsed = CreateContactSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json(err(parsed.error.message), { status: 400 });
  const tp = tenantPrisma(user);
  const contact = await tp.contact.create({ data: { ...parsed.data, tenantId: user.tenantId, tags: parsed.data.tags ?? [] } });
  return NextResponse.json(ok(contact), { status: 201 });
}

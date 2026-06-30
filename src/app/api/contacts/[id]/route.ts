import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/auth/session";
import { tenantPrisma } from "@/lib/prisma";
import { ok, err } from "@/lib/utils";
import { z } from "zod";

const UpdateContactSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  company: z.string().optional(),
  position: z.string().optional(),
  notes: z.string().optional(),
  status: z.enum(["ACTIVE", "INACTIVE", "BLOCKED"]).optional(),
  leadScore: z.number().min(0).max(100).optional(),
  tags: z.array(z.string()).optional(),
});

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await requireSession();
  const tp = tenantPrisma(user);
  const contact = await tp.contact.findFirst({ where: { id: params.id } });
  if (!contact) return NextResponse.json(err("Not found"), { status: 404 });
  return NextResponse.json(ok(contact));
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await requireSession();
  const body = await req.json();
  const parsed = UpdateContactSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json(err(parsed.error.message), { status: 400 });
  const tp = tenantPrisma(user);
  const existing = await tp.contact.findFirst({ where: { id: params.id } });
  if (!existing) return NextResponse.json(err("Not found"), { status: 404 });
  const updated = await tp.contact.update({ where: { id: params.id }, data: parsed.data });
  return NextResponse.json(ok(updated));
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await requireSession();
  const tp = tenantPrisma(user);
  const existing = await tp.contact.findFirst({ where: { id: params.id } });
  if (!existing) return NextResponse.json(err("Not found"), { status: 404 });
  await tp.contact.delete({ where: { id: params.id } });
  return NextResponse.json(ok({ deleted: true }));
}

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ contactId: string }> }
) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { contactId } = await params;
  const accountId = session.user.accountId;

  const contact = await prisma.contact.findFirst({
    where: { id: contactId, accountId },
    include: {
      interactions: { orderBy: { date: "desc" } },
      deals: { orderBy: { createdAt: "desc" } },
      conversations: {
        include: { agent: { select: { name: true } } },
        orderBy: { updatedAt: "desc" },
      },
    },
  });

  if (!contact) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(contact);
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ contactId: string }> }
) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { contactId } = await params;
  const accountId = session.user.accountId;
  const body = await req.json();

  const contact = await prisma.contact.findFirst({ where: { id: contactId, accountId } });
  if (!contact) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const updated = await prisma.contact.update({
    where: { id: contactId },
    data: {
      name: body.name,
      email: body.email,
      phone: body.phone,
      company: body.company,
      notes: body.notes,
      tags: body.tags,
    },
  });

  return NextResponse.json(updated);
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ contactId: string }> }
) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { contactId } = await params;
  const accountId = session.user.accountId;

  const contact = await prisma.contact.findFirst({ where: { id: contactId, accountId } });
  if (!contact) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.contact.delete({ where: { id: contactId } });
  return NextResponse.json({ ok: true });
}
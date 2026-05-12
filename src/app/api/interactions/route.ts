import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const accountId = (session.user as any).accountId;
  const { searchParams } = new URL(req.url);
  const contactId = searchParams.get("contactId");
  const type = searchParams.get("type");

  // Need to filter by account through contact
  const where: any = {};
  if (contactId) where.contactId = contactId;
  if (type) where.type = type;

  const interactions = await prisma.interaction.findMany({
    where: {
      ...where,
      contact: { accountId },
    },
    include: { contact: { select: { name: true } } },
    orderBy: { date: "desc" },
  });

  return NextResponse.json(interactions);
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { type, subject, description, date, contactId } = await req.json();

  const interaction = await prisma.interaction.create({
    data: {
      type,
      subject,
      description,
      date: date ? new Date(date) : new Date(),
      contactId,
    },
  });

  return NextResponse.json(interaction, { status: 201 });
}
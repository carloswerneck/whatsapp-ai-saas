import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const accountId = (session.user as any).accountId;
  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search");
  const limit = parseInt(searchParams.get("limit") || "50");
  const offset = parseInt(searchParams.get("offset") || "0");

  const where: any = { accountId };
  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { email: { contains: search, mode: "insensitive" } },
      { phone: { contains: search } },
      { company: { contains: search, mode: "insensitive" } },
    ];
  }

  const contacts = await prisma.contact.findMany({
    where,
    include: {
      _count: { select: { deals: true, interactions: true, conversations: true } },
    },
    orderBy: { createdAt: "desc" },
    take: limit,
    skip: offset,
  });

  const total = await prisma.contact.count({ where });

  return NextResponse.json({ contacts, total });
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const accountId = (session.user as any).accountId;
  const { name, email, phone, company, notes, tags, source } = await req.json();

  const contact = await prisma.contact.create({
    data: {
      name,
      email,
      phone,
      company,
      notes,
      tags: tags || [],
      source: source || "manual",
      accountId,
    },
  });

  return NextResponse.json(contact, { status: 201 });
}
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ conversationId: string }> }
) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { conversationId } = await params;
  const accountId = session.user.accountId;

  const conversation = await prisma.conversation.findFirst({
    where: { id: conversationId, accountId },
    include: {
      agent: true,
      contact: true,
      messages: { orderBy: { createdAt: "asc" } },
    },
  });

  if (!conversation) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(conversation);
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ conversationId: string }> }
) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { conversationId } = await params;
  const accountId = session.user.accountId;
  const { status, assignedTo } = await req.json();

  const conversation = await prisma.conversation.findFirst({
    where: { id: conversationId, accountId },
  });
  if (!conversation) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const updated = await prisma.conversation.update({
    where: { id: conversationId },
    data: { ...(status && { status }), ...(assignedTo !== undefined && { assignedTo }) },
  });

  return NextResponse.json(updated);
}
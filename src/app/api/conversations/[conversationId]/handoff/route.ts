import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ conversationId: string }> }
) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { conversationId } = await params;
  const accountId = (session.user as any).accountId;
  const userId = session.user.id;

  const conversation = await prisma.conversation.findFirst({
    where: { id: conversationId, accountId },
  });
  if (!conversation) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const updated = await prisma.conversation.update({
    where: { id: conversationId },
    data: { status: "HANDOFF", assignedTo: userId },
  });

  return NextResponse.json(updated);
}
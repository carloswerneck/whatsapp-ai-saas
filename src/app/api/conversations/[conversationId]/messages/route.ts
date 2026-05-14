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
  const { searchParams } = new URL(req.url);
  const limit = parseInt(searchParams.get("limit") || "50");
  const offset = parseInt(searchParams.get("offset") || "0");

  const messages = await prisma.message.findMany({
    where: { conversationId },
    orderBy: { createdAt: "asc" },
    take: limit,
    skip: offset,
  });

  return NextResponse.json(messages);
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ conversationId: string }> }
) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { conversationId } = await params;
  const accountId = session.user.accountId;
  const { content } = await req.json();

  const conversation = await prisma.conversation.findFirst({
    where: { id: conversationId, accountId },
    include: { agent: true, contact: true },
  });
  if (!conversation) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Store human message
  const message = await prisma.message.create({
    data: {
      conversationId,
      direction: "OUTBOUND",
      sender: "HUMAN",
      content,
    },
  });

  // If agent is connected, send via WhatsApp
  if (conversation.agent.waInstanceId && conversation.agent.waStatus === "CONNECTED") {
    const { EvolutionAPI } = await import("@/lib/evolution-api");
    const phone = conversation.contact.phone;
    if (phone) {
      await EvolutionAPI.sendMessage(conversation.agent.waInstanceId, phone, content);
    }
  }

  return NextResponse.json(message, { status: 201 });
}
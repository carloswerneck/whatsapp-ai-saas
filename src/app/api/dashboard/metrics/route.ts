import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const accountId = (session.user as any).accountId;

  // Agent-level metrics
  const agentMetrics = await prisma.agentMetric.findMany({
    where: {
      agent: { accountId },
      date: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
    },
    include: { agent: { select: { name: true } } },
    orderBy: { date: "desc" },
  });

  // Aggregate totals
  const totals = agentMetrics.reduce(
    (acc, m) => ({
      messagesInbound: acc.messagesInbound + m.messagesInbound,
      messagesOutbound: acc.messagesOutbound + m.messagesOutbound,
      conversationsTotal: acc.conversationsTotal + m.conversationsTotal,
      conversationsResolved: acc.conversationsResolved + m.conversationsResolved,
      handoffs: acc.handoffs + m.handoffs,
      tokensUsed: acc.tokensUsed + m.tokensUsed,
    }),
    {
      messagesInbound: 0,
      messagesOutbound: 0,
      conversationsTotal: 0,
      conversationsResolved: 0,
      handoffs: 0,
      tokensUsed: 0,
    }
  );

  // Active agents count
  const activeAgents = await prisma.agent.count({
    where: { accountId, status: "ACTIVE" },
  });

  // Active conversations
  const activeConversations = await prisma.conversation.count({
    where: { accountId, status: "ACTIVE" },
  });

  // Contacts count
  const contactsCount = await prisma.contact.count({
    where: { accountId },
  });

  return NextResponse.json({
    totals,
    activeAgents,
    activeConversations,
    contactsCount,
    dailyMetrics: agentMetrics,
  });
}
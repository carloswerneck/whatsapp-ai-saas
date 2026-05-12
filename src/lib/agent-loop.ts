import { prisma } from "@/lib/prisma";
import { EvolutionAPI } from "@/lib/evolution-api";
import { openai } from "@/lib/openai";
import { performRAGRetrieval } from "@/lib/rag/retrieve";

interface WhatsAppMessage {
  key: {
    remoteJid: string;
    id: string;
  };
  message?: {
    conversation?: string;
  };
  pushName?: string;
}

interface WhatsAppWebhookPayload {
  instance: string;
  data: WhatsAppMessage;
}

export async function processIncomingMessage(payload: WhatsAppWebhookPayload) {
  const instanceName = payload.instance;
  const { key, message, pushName } = payload.data;

  // 1. Resolve agent from instance name
  const agent = await prisma.agent.findFirst({
    where: { waInstanceId: instanceName },
  });
  if (!agent || agent.status !== "ACTIVE") return;

  // 2. Extract phone number
  const phone = key.remoteJid.replace("@s.whatsapp.net", "").replace("@g.us", "");

  // 3. Find or create contact
  let contact = await prisma.contact.findFirst({
    where: { accountId: agent.accountId, phone },
  });
  if (!contact) {
    contact = await prisma.contact.create({
      data: {
        name: pushName || phone,
        phone,
        accountId: agent.accountId,
        source: "whatsapp",
      },
    });
  }

  // 4. Find or create conversation
  let conversation = await prisma.conversation.findUnique({
    where: { agentId_contactId: { agentId: agent.id, contactId: contact.id } },
    include: { messages: { orderBy: { createdAt: "desc" }, take: 20 } },
  });
  if (!conversation) {
    conversation = await prisma.conversation.create({
      data: {
        agentId: agent.id,
        contactId: contact.id,
        accountId: agent.accountId,
      },
      include: { messages: true },
    });
  }

  // 5. Store inbound message
  const content = message?.conversation || "";
  if (!content) return; // Skip non-text messages for now

  await prisma.message.create({
    data: {
      conversationId: conversation.id,
      direction: "INBOUND",
      sender: "CONTACT",
      content,
      waMessageId: key.id,
    },
  });

  // 6. Check handoff
  if (conversation.status === "HANDOFF") return;
  if (
    agent.humanHandoff &&
    content.toLowerCase().includes(agent.handoffKeyword.toLowerCase())
  ) {
    await prisma.conversation.update({
      where: { id: conversation.id },
      data: { status: "HANDOFF" },
    });
    await EvolutionAPI.sendMessage(
      instanceName,
      phone,
      "Você foi conectado a um atendente humano. Aguarde um momento."
    );
    return;
  }

  if (!agent.autoReply) return;

  // 7. Build AI context
  const history = conversation.messages
    .reverse()
    .map((m: any) => ({
      role: m.sender === "CONTACT" ? ("user" as const) : ("assistant" as const),
      content: m.content,
    }));

  let ragContext = "";
  if (agent.ragEnabled) {
    ragContext = await performRAGRetrieval(agent.id, content);
  }

  // 8. Call OpenAI
  const startTime = Date.now();
  const messages: any[] = [
    { role: "system", content: agent.systemPrompt },
    ...(ragContext
      ? [{ role: "system" as const, content: `Knowledge base context:\n${ragContext}` }]
      : []),
    ...history,
    { role: "user", content },
  ];

  let aiContent: string;
  let tokensUsed: number | undefined;

  try {
    const completion = await openai.chat.completions.create({
      model: agent.model,
      temperature: agent.temperature,
      max_tokens: agent.maxTokens,
      messages,
    });
    aiContent =
      completion.choices[0]?.message?.content ||
      "Desculpe, não consegui processar sua mensagem.";
    tokensUsed = completion.usage?.total_tokens;
  } catch (error) {
    console.error("OpenAI error:", error);
    aiContent =
      "Desculpe, estou com dificuldades técnicas. Digite 'humano' para falar com um atendente.";
    tokensUsed = 0;
  }

  const responseMs = Date.now() - startTime;

  // 9. Store outbound message
  await prisma.message.create({
    data: {
      conversationId: conversation.id,
      direction: "OUTBOUND",
      sender: "AI",
      content: aiContent,
      aiModel: agent.model,
      tokensUsed,
    },
  });

  // 10. Send via WhatsApp
  await EvolutionAPI.sendMessage(instanceName, phone, aiContent);

  // 11. Update metrics
  await updateAgentMetric(agent.id, {
    messagesOutbound: 1,
    tokensUsed: tokensUsed || 0,
    responseMs,
  });
}

async function updateAgentMetric(
  agentId: string,
  data: { messagesOutbound?: number; tokensUsed?: number; responseMs?: number }
) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const existing = await prisma.agentMetric.findUnique({
    where: { agentId_date: { agentId, date: today } },
  });

  if (existing) {
    const newAvgResponseMs = data.responseMs
      ? Math.round(
          (existing.avgResponseMs * existing.messagesOutbound +
            data.responseMs) /
            (existing.messagesOutbound + 1)
        )
      : existing.avgResponseMs;

    await prisma.agentMetric.update({
      where: { id: existing.id },
      data: {
        messagesOutbound: existing.messagesOutbound + (data.messagesOutbound || 0),
        tokensUsed: existing.tokensUsed + (data.tokensUsed || 0),
        avgResponseMs: newAvgResponseMs,
      },
    });
  } else {
    await prisma.agentMetric.create({
      data: {
        agentId,
        date: today,
        messagesOutbound: data.messagesOutbound || 0,
        tokensUsed: data.tokensUsed || 0,
        avgResponseMs: data.responseMs || 0,
      },
    });
  }
}
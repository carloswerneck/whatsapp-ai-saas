import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { EvolutionAPI } from "@/lib/evolution-api";
import { NextResponse } from "next/server";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ agentId: string }> }
) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { agentId } = await params;
  const accountId = session.user.accountId;

  const agent = await prisma.agent.findFirst({ where: { id: agentId, accountId } });
  if (!agent) return NextResponse.json({ error: "Agent not found" }, { status: 404 });

  if (agent.waStatus === "CONNECTED") {
    return NextResponse.json({ error: "Agent already connected" }, { status: 400 });
  }

  const instanceName = `acct_${accountId}_agent_${agentId}`;

  try {
    // Create instance in Evolution API
    await EvolutionAPI.createInstance(instanceName);

    // Connect and get QR code
    await EvolutionAPI.connect(instanceName);

    // Update agent with instance info
    await prisma.agent.update({
      where: { id: agentId },
      data: {
        waInstanceId: instanceName,
        waStatus: "CONNECTING",
      },
    });

    return NextResponse.json({ instanceName, status: "CONNECTING" });
  } catch (error) {
    console.error("Evolution API connect error:", error);
    return NextResponse.json(
      { error: "Failed to connect to WhatsApp" },
      { status: 500 }
    );
  }
}
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ agentId: string }> }
) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { agentId } = await params;
  const accountId = (session.user as any).accountId;

  const documents = await prisma.document.findMany({
    where: { agentId, accountId },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(documents);
}
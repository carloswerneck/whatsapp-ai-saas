import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const accountId = (session.user as any).accountId;

  const account = await prisma.account.findUnique({
    where: { id: accountId },
    include: {
      subscriptions: { where: { status: { in: ["ACTIVE", "TRIALING"] } } },
    },
  });

  if (!account) return NextResponse.json({ error: "Account not found" }, { status: 404 });

  return NextResponse.json({
    id: account.id,
    name: account.name,
    slug: account.slug,
    plan: account.plan,
    trialEndsAt: account.trialEndsAt,
    subscribedAt: account.subscribedAt,
    subscription: account.subscriptions?.[0] || null,
  });
}
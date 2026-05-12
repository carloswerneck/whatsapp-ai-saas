import { stripe } from "@/lib/stripe";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const accountId = (session.user as any).accountId;
  const account = await prisma.account.findUnique({ where: { id: accountId } });

  if (!account?.stripeCustomerId) {
    return NextResponse.json({ error: "No Stripe customer" }, { status: 400 });
  }

  const portalSession = await stripe.billingPortal.sessions.create({
    customer: account.stripeCustomerId,
    return_url: `${process.env.NEXT_PUBLIC_APP_URL}/settings/billing`,
  });

  return NextResponse.json({ url: portalSession.url });
}
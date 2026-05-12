import Stripe from "stripe";

export const PLAN_PRICES = {
  STARTER: process.env.STRIPE_STARTER_PRICE_ID!,
  PRO: process.env.STRIPE_PRO_PRICE_ID!,
  BUSINESS: process.env.STRIPE_BUSINESS_PRICE_ID!,
} as const;

export const PLAN_LIMITS = {
  FREE: { agents: 1, messagesPerMonth: 100, documents: 1 },
  STARTER: { agents: 1, messagesPerMonth: 1000, documents: 5 },
  PRO: { agents: 3, messagesPerMonth: 10000, documents: 25 },
  BUSINESS: { agents: 10, messagesPerMonth: Infinity, documents: Infinity },
} as const;

let _stripe: Stripe | null = null;

export function getStripe(): Stripe {
  if (!_stripe) {
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: "2026-04-22.dahlia",
    });
  }
  return _stripe;
}

// Keep stripe export for backward compatibility but lazy
export const stripe = new Proxy({} as Stripe, {
  get(_target, prop) {
    return Reflect.get(getStripe(), prop);
  },
});

function mapPriceToPlan(priceId: string): "FREE" | "STARTER" | "PRO" | "BUSINESS" {
  if (priceId === PLAN_PRICES.STARTER) return "STARTER" as const;
  if (priceId === PLAN_PRICES.PRO) return "PRO" as const;
  if (priceId === PLAN_PRICES.BUSINESS) return "BUSINESS" as const;
  return "FREE" as const;
}

export async function checkSubscription(accountId: string): Promise<{
  allowed: boolean;
  reason?: string;
}> {
  const { prisma } = await import("@/lib/prisma");
  const account = await prisma.account.findUnique({ where: { id: accountId } });
  if (!account) return { allowed: false, reason: "Account not found" };

  if (account.plan === "FREE") {
    if (account.trialEndsAt && new Date() < account.trialEndsAt) {
      return { allowed: true };
    }
    return { allowed: false, reason: "Trial expired. Please subscribe to continue." };
  }

  const sub = await prisma.subscription.findFirst({
    where: { accountId, status: { in: ["ACTIVE", "TRIALING"] } },
  });
  if (!sub) return { allowed: false, reason: "No active subscription" };

  return { allowed: true };
}

export async function checkAgentLimit(accountId: string): Promise<boolean> {
  const { prisma } = await import("@/lib/prisma");
  const account = await prisma.account.findUnique({ where: { id: accountId } });
  const agentCount = await prisma.agent.count({ where: { accountId } });
  const limits = PLAN_LIMITS[account!.plan as keyof typeof PLAN_LIMITS];
  return agentCount < limits.agents;
}

export async function checkMessageLimit(accountId: string): Promise<boolean> {
  const { prisma } = await import("@/lib/prisma");
  const account = await prisma.account.findUnique({ where: { id: accountId } });
  const limits = PLAN_LIMITS[account!.plan as keyof typeof PLAN_LIMITS];
  if (limits.messagesPerMonth === Infinity) return true;

  const thisMonth = await prisma.message.count({
    where: {
      conversation: { accountId },
      direction: "OUTBOUND",
      createdAt: {
        gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
      },
    },
  });
  return thisMonth < limits.messagesPerMonth;
}
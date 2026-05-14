import { prisma } from "@/lib/prisma";
import { stripe, PLAN_PRICES } from "@/lib/stripe";
import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { Prisma } from "@/generated/prisma/client";

function mapPriceToPlan(priceId: string): "FREE" | "STARTER" | "PRO" | "BUSINESS" {
  if (priceId === PLAN_PRICES.STARTER) return "STARTER" as const;
  if (priceId === PLAN_PRICES.PRO) return "PRO" as const;
  if (priceId === PLAN_PRICES.BUSINESS) return "BUSINESS" as const;
  return "FREE" as const;
}

export async function POST(req: Request) {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature")!;

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  // Idempotency check
  const existing = await prisma.stripeEvent.findUnique({
    where: { stripeEventId: event.id },
  });
  if (existing) return NextResponse.json({ received: true });

  await prisma.stripeEvent.create({
    data: {
      stripeEventId: event.id,
      type: event.type,
      payload: event.data.object as unknown as Prisma.InputJsonValue,
    },
  });

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const accountId = session.metadata?.accountId ?? "";
      const subscription = await stripe.subscriptions.retrieve(
        session.subscription as string
      );

      const subItem = subscription.items.data[0];

      await prisma.account.update({
        where: { id: accountId },
        data: {
          plan: mapPriceToPlan(subItem.price.id),
          stripeCustomerId: session.customer as string,
          subscribedAt: new Date(),
          trialEndsAt: subscription.trial_end
            ? new Date(subscription.trial_end * 1000)
            : null,
        },
      });

      await prisma.subscription.create({
        data: {
          accountId,
          stripeSubId: subscription.id,
          stripePriceId: subItem.price.id,
          status: subscription.status === "trialing" ? "TRIALING" : "ACTIVE",
          currentPeriodStart: new Date(subItem.current_period_start * 1000),
          currentPeriodEnd: new Date(subItem.current_period_end * 1000),
        },
      });
      break;
    }

    case "customer.subscription.updated": {
      const sub = event.data.object as Stripe.Subscription;
      const subItem = sub.items.data[0];
      await prisma.subscription.update({
        where: { stripeSubId: sub.id as string },
        data: {
          status: (sub.status.toUpperCase() as "ACTIVE" | "PAST_DUE" | "CANCELED" | "TRIALING"),
          currentPeriodStart: new Date(subItem.current_period_start * 1000),
          currentPeriodEnd: new Date(subItem.current_period_end * 1000),
          cancelAtPeriodEnd: sub.cancel_at_period_end,
        },
      });
      const newPlan = mapPriceToPlan(sub.items.data[0].price.id);
      await prisma.account.update({
        where: { stripeCustomerId: sub.customer as string },
        data: { plan: newPlan },
      });
      break;
    }

    case "customer.subscription.deleted": {
      const sub = event.data.object as Stripe.Subscription;
      await prisma.subscription.update({
        where: { stripeSubId: sub.id as string },
        data: { status: "CANCELED" },
      });
      await prisma.account.update({
        where: { stripeCustomerId: sub.customer as string },
        data: { plan: "FREE" as const },
      });
      break;
    }
  }

  // Mark processed
  await prisma.stripeEvent.update({
    where: { stripeEventId: event.id },
    data: { processed: true },
  });

  return NextResponse.json({ received: true });
}
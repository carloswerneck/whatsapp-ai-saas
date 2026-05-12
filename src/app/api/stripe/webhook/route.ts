import { prisma } from "@/lib/prisma";
import { stripe, PLAN_PRICES } from "@/lib/stripe";
import { NextResponse } from "next/server";

function mapPriceToPlan(priceId: string): "FREE" | "STARTER" | "PRO" | "BUSINESS" {
  if (priceId === PLAN_PRICES.STARTER) return "STARTER" as const;
  if (priceId === PLAN_PRICES.PRO) return "PRO" as const;
  if (priceId === PLAN_PRICES.BUSINESS) return "BUSINESS" as const;
  return "FREE" as const;
}

export async function POST(req: Request) {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature")!;

  let event;
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
      payload: event.data.object as any,
    },
  });

  // Using `as any` for Stripe event objects since the types vary by event type
  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as any;
      const accountId = session.metadata?.accountId;
      const subscription = await stripe.subscriptions.retrieve(
        session.subscription
      );

      await prisma.account.update({
        where: { id: accountId },
        data: {
          plan: mapPriceToPlan(subscription.items.data[0].price.id as string),
          stripeCustomerId: session.customer as string,
          subscribedAt: new Date(),
          trialEndsAt: (subscription as any).trial_end
            ? new Date(((subscription as any).trial_end as number) * 1000)
            : null,
        },
      });

      await prisma.subscription.create({
        data: {
          accountId,
          stripeSubId: subscription.id,
          stripePriceId: subscription.items.data[0].price.id as string,
          status: subscription.status === "trialing" ? "TRIALING" : "ACTIVE",
          currentPeriodStart: new Date((subscription as any).current_period_start * 1000),
          currentPeriodEnd: new Date((subscription as any).current_period_end * 1000),
        },
      });
      break;
    }

    case "customer.subscription.updated": {
      const sub = event.data.object as any;
      await prisma.subscription.update({
        where: { stripeSubId: sub.id as string },
        data: {
          status: (sub.status as string).toUpperCase() as any,
          currentPeriodStart: new Date(sub.current_period_start * 1000),
          currentPeriodEnd: new Date(sub.current_period_end * 1000),
          cancelAtPeriodEnd: sub.cancel_at_period_end as boolean,
        },
      });
      const newPlan = mapPriceToPlan(sub.items.data[0].price.id as string);
      await prisma.account.update({
        where: { stripeCustomerId: sub.customer as string },
        data: { plan: newPlan },
      });
      break;
    }

    case "customer.subscription.deleted": {
      const sub = event.data.object as any;
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
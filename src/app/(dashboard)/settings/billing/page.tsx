"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PLANS } from "@/types";
import { Check } from "lucide-react";

export default function BillingPage() {
  const [loading, setLoading] = useState<string | null>(null);
  const [currentPlan, setCurrentPlan] = useState<string>("FREE");

  useEffect(() => {
    fetch("/api/account")
      .then((res) => res.json())
      .then((data) => setCurrentPlan(data.plan))
      .catch(() => {});
  }, []);

  async function handleUpgrade(priceId: string, planName: string) {
    setLoading(planName);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ priceId }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } finally {
      setLoading(null);
    }
  }

  async function handleManage() {
    const res = await fetch("/api/stripe/portal", { method: "POST" });
    const data = await res.json();
    if (data.url) {
      window.location.href = data.url;
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Assinatura</h1>
        {currentPlan !== "FREE" && (
          <Button variant="outline" onClick={handleManage}>
            Gerenciar no Stripe
          </Button>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {PLANS.map((plan) => (
          <Card
            key={plan.value}
            className={
              currentPlan === plan.value ? "border-primary" : ""
            }
          >
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>{plan.label}</CardTitle>
                {currentPlan === plan.value && (
                  <Badge>Atual</Badge>
                )}
              </div>
              <div className="text-2xl font-bold">
                {plan.price === 0
                  ? "Grátis"
                  : `R$ ${plan.price}/mês`}
              </div>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4" />
                <span>
                  {plan.agents} agente{plan.agents > 1 ? "s" : ""}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4" />
                <span>
                  {plan.messages === Infinity
                    ? "Mensagens ilimitadas"
                    : `${plan.messages.toLocaleString()} mensagens/mês`}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4" />
                <span>
                  {plan.docs === Infinity
                    ? "Documentos ilimitados"
                    : `${plan.docs} documento${plan.docs > 1 ? "s" : ""}`}
                </span>
              </div>
              {currentPlan !== plan.value && plan.price > 0 && (
                <Button
                  className="w-full mt-4"
                  onClick={() => handleUpgrade("", plan.value)}
                  disabled={loading === plan.value}
                >
                  {loading === plan.value ? "Processando..." : "Assinar"}
                </Button>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
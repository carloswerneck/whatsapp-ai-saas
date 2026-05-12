"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PLANS } from "@/types";

interface Account {
  id: string;
  name: string;
  plan: string;
  trialEndsAt?: string;
}

export default function SettingsPage() {
  const [account, setAccount] = useState<Account | null>(null);

  useEffect(() => {
    fetch("/api/account")
      .then((res) => res.json())
      .then(setAccount)
      .catch(() => {});
  }, []);

  const currentPlan = PLANS.find((p) => p.value === account?.plan);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Configurações</h1>

      <Card>
        <CardHeader>
          <CardTitle>Conta</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Nome</span>
            <span>{account?.name}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Plano</span>
            <Badge>{currentPlan?.label || account?.plan}</Badge>
          </div>
          {account?.trialEndsAt && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Trial até</span>
              <span>
                {new Date(account.trialEndsAt).toLocaleDateString("pt-BR")}
              </span>
            </div>
          )}
          <div className="pt-4">
            <Link href="/settings/billing">
              <button className="text-primary hover:underline">
                Gerenciar assinatura
              </button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Bot, MessageSquare, Users, TrendingUp } from "lucide-react";

interface Metrics {
  totals: {
    messagesInbound: number;
    messagesOutbound: number;
    conversationsTotal: number;
    conversationsResolved: number;
    handoffs: number;
    tokensUsed: number;
  };
  activeAgents: number;
  activeConversations: number;
  contactsCount: number;
}

export default function DashboardPage() {
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/dashboard/metrics")
      .then((res) => res.json())
      .then((data) => {
        setMetrics(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="text-muted-foreground">Carregando...</div>;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Dashboard</h1>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Agentes Ativos</CardTitle>
            <Bot className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {metrics?.activeAgents ?? 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Conversas Ativas</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {metrics?.activeConversations ?? 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Contatos</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {metrics?.contactsCount ?? 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Mensagens Trocadas</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {metrics
                ? metrics.totals.messagesInbound +
                  metrics.totals.messagesOutbound
                : 0}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Resolução</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {metrics && metrics.totals.conversationsTotal > 0
                ? Math.round(
                    (metrics.totals.conversationsResolved /
                      metrics.totals.conversationsTotal) *
                      100
                  )
                : 0}
              %
            </div>
            <p className="text-sm text-muted-foreground">
              Taxa de resolução automática
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Handoffs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {metrics?.totals.handoffs ?? 0}
            </div>
            <p className="text-sm text-muted-foreground">
              Transferências para atendente humano
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
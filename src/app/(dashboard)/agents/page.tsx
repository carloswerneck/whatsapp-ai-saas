"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Bot, Wifi, WifiOff } from "lucide-react";
import { AGENT_PURPOSES } from "@/types";

interface Agent {
  id: string;
  name: string;
  description?: string;
  purpose: string;
  status: string;
  waStatus: string;
  ragEnabled: boolean;
  createdAt: string;
}

export default function AgentsPage() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/agents")
      .then((res) => res.json())
      .then((data) => {
        setAgents(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const getPurposeLabel = (value: string) =>
    AGENT_PURPOSES.find((p) => p.value === value)?.label || value;

  const getStatusColor = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return "bg-green-500";
      case "INACTIVE":
        return "bg-gray-400";
      case "PAUSED":
        return "bg-yellow-500";
      default:
        return "bg-gray-400";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Agentes</h1>
        <Link href="/agents/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Novo Agente
          </Button>
        </Link>
      </div>

      {loading ? (
        <div className="text-muted-foreground">Carregando...</div>
      ) : agents.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Bot className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium">Nenhum agente criado</h3>
            <p className="text-muted-foreground mb-4">
              Crie seu primeiro agente de WhatsApp para começar
            </p>
            <Link href="/agents/new">
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Criar Agente
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {agents.map((agent) => (
            <Link key={agent.id} href={`/agents/${agent.id}`}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-base">{agent.name}</CardTitle>
                  {agent.waStatus === "CONNECTED" ? (
                    <Wifi className="h-4 w-4 text-green-500" />
                  ) : (
                    <WifiOff className="h-4 w-4 text-muted-foreground" />
                  )}
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2 mb-2">
                    <Badge
                      variant="secondary"
                      className={getStatusColor(agent.status)}
                    >
                      {agent.status === "ACTIVE" ? "Ativo" : agent.status === "PAUSED" ? "Pausado" : "Inativo"}
                    </Badge>
                    <Badge variant="outline">
                      {getPurposeLabel(agent.purpose)}
                    </Badge>
                    {agent.ragEnabled && (
                      <Badge variant="outline">RAG</Badge>
                    )}
                  </div>
                  {agent.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {agent.description}
                    </p>
                  )}
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
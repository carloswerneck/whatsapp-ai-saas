"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Wifi,
  WifiOff,
  QrCode,
  Trash2,
  Power,
  PowerOff,
  BookOpen,
  MessageSquare,
} from "lucide-react";
import { AGENT_PURPOSES } from "@/types";

interface Agent {
  id: string;
  name: string;
  description?: string;
  purpose: string;
  status: string;
  waStatus: string;
  waInstanceId?: string;
  waPhone?: string;
  systemPrompt: string;
  model: string;
  temperature: number;
  ragEnabled: boolean;
  humanHandoff: boolean;
  handoffKeyword: string;
  greetingMessage?: string;
  awayMessage?: string;
  autoReply: boolean;
  documents?: { id: string; title: string; status: string }[];
  _count?: { conversations: number };
}

export default function AgentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const agentId = params.agentId as string;
  const [agent, setAgent] = useState<Agent | null>(null);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [qrCode, setQrCode] = useState<string | null>(null);

  const fetchAgent = useCallback(async () => {
    const res = await fetch(`/api/agents/${agentId}`);
    if (res.ok) {
      setAgent(await res.json());
    }
    setLoading(false);
  }, [agentId]);

  useEffect(() => {
    fetchAgent();
  }, [fetchAgent]);

  async function handleConnect() {
    setConnecting(true);
    try {
      const res = await fetch(`/api/agents/${agentId}/connect`, { method: "POST" });
      if (res.ok) {
        // Poll for QR code
        const pollQR = async () => {
          const qrRes = await fetch(`/api/agents/${agentId}/qr`);
          if (qrRes.ok) {
            const data = await qrRes.json();
            if (data.qr) {
              setQrCode(data.qr);
            }
            if (data.status !== "CONNECTED") {
              setTimeout(pollQR, 3000);
            } else {
              setQrCode(null);
              fetchAgent();
            }
          }
        };
        pollQR();
      }
    } finally {
      setConnecting(false);
    }
  }

  async function handleDisconnect() {
    if (!confirm("Desconectar o WhatsApp deste agente?")) return;
    await fetch(`/api/agents/${agentId}/disconnect`, { method: "POST" });
    fetchAgent();
  }

  async function handleToggle(status: string) {
    await fetch(`/api/agents/${agentId}/toggle`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    fetchAgent();
  }

  async function handleDelete() {
    if (!confirm("Excluir este agente? Esta ação não pode ser desfeita.")) return;
    await fetch(`/api/agents/${agentId}`, { method: "DELETE" });
    router.push("/agents");
  }

  if (loading) return <div className="text-muted-foreground">Carregando...</div>;
  if (!agent) return <div>Agente não encontrado</div>;

  const getPurposeLabel = (value: string) =>
    AGENT_PURPOSES.find((p) => p.value === value)?.label || value;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{agent.name}</h1>
          <p className="text-muted-foreground">
            {getPurposeLabel(agent.purpose)}
          </p>
        </div>
        <div className="flex gap-2">
          {agent.status === "ACTIVE" ? (
            <Button
              variant="outline"
              onClick={() => handleToggle("INACTIVE")}
            >
              <PowerOff className="mr-2 h-4 w-4" />
              Pausar
            </Button>
          ) : (
            <Button
              variant="outline"
              onClick={() => handleToggle("ACTIVE")}
            >
              <Power className="mr-2 h-4 w-4" />
              Ativar
            </Button>
          )}
          <Button variant="destructive" onClick={handleDelete}>
            <Trash2 className="mr-2 h-4 w-4" />
            Excluir
          </Button>
        </div>
      </div>

      <Tabs defaultValue="whatsapp">
        <TabsList>
          <TabsTrigger value="whatsapp">WhatsApp</TabsTrigger>
          <TabsTrigger value="conversations">
            Conversas ({agent._count?.conversations || 0})
          </TabsTrigger>
          <TabsTrigger value="knowledge">
            <BookOpen className="mr-2 h-4 w-4" />
            Conhecimento
          </TabsTrigger>
        </TabsList>

        <TabsContent value="whatsapp" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {agent.waStatus === "CONNECTED" ? (
                  <Wifi className="h-5 w-5 text-green-500" />
                ) : (
                  <WifiOff className="h-5 w-5 text-muted-foreground" />
                )}
                Conexão WhatsApp
              </CardTitle>
            </CardHeader>
            <CardContent>
              {agent.waStatus === "CONNECTED" ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Badge className="bg-green-500">Conectado</Badge>
                    {agent.waPhone && (
                      <span className="text-sm text-muted-foreground">
                        {agent.waPhone}
                      </span>
                    )}
                  </div>
                  <Button variant="destructive" onClick={handleDisconnect}>
                    <WifiOff className="mr-2 h-4 w-4" />
                    Desconectar
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {qrCode ? (
                    <div className="flex flex-col items-center gap-4">
                      <img src={qrCode} alt="QR Code" className="w-64 h-64" />
                      <p className="text-sm text-muted-foreground">
                        Escaneie o QR code com o WhatsApp
                      </p>
                    </div>
                  ) : (
                    <Button onClick={handleConnect} disabled={connecting}>
                      <QrCode className="mr-2 h-4 w-4" />
                      {connecting ? "Conectando..." : "Conectar WhatsApp"}
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="conversations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Conversas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                As conversas aparecerão aqui quando o agente estiver conectado ao WhatsApp.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="knowledge" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Base de Conhecimento (RAG)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2">
                <Badge variant={agent.ragEnabled ? "default" : "secondary"}>
                  {agent.ragEnabled ? "RAG Ativo" : "RAG Inativo"}
                </Badge>
              </div>
              {agent.documents && agent.documents.length > 0 ? (
                <div className="space-y-2">
                  {agent.documents.map((doc) => (
                    <div
                      key={doc.id}
                      className="flex items-center justify-between rounded-md border p-3"
                    >
                      <span className="text-sm">{doc.title}</span>
                      <Badge
                        variant={
                          doc.status === "READY" ? "default" : "secondary"
                        }
                      >
                        {doc.status === "READY"
                          ? "Processado"
                          : doc.status === "PROCESSING"
                          ? "Processando"
                          : "Erro"}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Nenhum documento adicionado. Use a aba de Conhecimento para
                  fazer upload.
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Card>
        <CardHeader>
          <CardTitle>Configuração do Agente</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Modelo</span>
            <span>{agent.model}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Temperatura</span>
            <span>{agent.temperature}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Handoff</span>
            <span>
              {agent.humanHandoff
                ? `Ativo (palavra: "${agent.handoffKeyword}")`
                : "Inativo"}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Auto-resposta</span>
            <span>{agent.autoReply ? "Sim" : "Não"}</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AGENT_PURPOSES } from "@/types";

export default function NewAgentPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: "",
    description: "",
    purpose: "SUPPORT",
    systemPrompt: "",
    model: "gpt-4o",
    temperature: 0.7,
    maxTokens: 2048,
    ragEnabled: false,
    humanHandoff: true,
    handoffKeyword: "humano",
    greetingMessage: "",
    awayMessage: "",
    autoReply: true,
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch("/api/agents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (res.ok) {
        const agent = await res.json();
        router.push(`/agents/${agent.id}`);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">Novo Agente</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Informações Básicas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome do Agente</Label>
              <Input
                id="name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Ex: Atendimento Suporte"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
                placeholder="Descreva o que este agente faz..."
                rows={2}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="purpose">Tipo de Atendimento</Label>
              <Select
                value={form.purpose}
                onValueChange={(value) => setForm({ ...form, purpose: value ?? "SUPPORT" })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {AGENT_PURPOSES.map((p) => (
                    <SelectItem key={p.value} value={p.value}>
                      {p.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Comportamento da IA</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="systemPrompt">
                Prompt do Sistema (Instruções para a IA)
              </Label>
              <Textarea
                id="systemPrompt"
                value={form.systemPrompt}
                onChange={(e) =>
                  setForm({ ...form, systemPrompt: e.target.value })
                }
                placeholder="Você é um assistente de atendimento da empresa X. Seja educado, objetivo e sempre tente resolver o problema do cliente..."
                rows={6}
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="model">Modelo</Label>
                <Select
                  value={form.model}
                  onValueChange={(value) => setForm({ ...form, model: value ?? "gpt-4o" })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="gpt-4o">GPT-4o</SelectItem>
                    <SelectItem value="gpt-4o-mini">GPT-4o Mini</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="temperature">Temperatura: {form.temperature}</Label>
                <Input
                  type="range"
                  id="temperature"
                  min="0"
                  max="1"
                  step="0.1"
                  value={form.temperature}
                  onChange={(e) =>
                    setForm({ ...form, temperature: parseFloat(e.target.value) })
                  }
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="greetingMessage">Mensagem de Saudação (opcional)</Label>
              <Input
                id="greetingMessage"
                value={form.greetingMessage}
                onChange={(e) =>
                  setForm({ ...form, greetingMessage: e.target.value })
                }
                placeholder="Olá! Como posso ajudar?"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="awayMessage">Mensagem de Ausência (opcional)</Label>
              <Input
                id="awayMessage"
                value={form.awayMessage}
                onChange={(e) =>
                  setForm({ ...form, awayMessage: e.target.value })
                }
                placeholder="No momento estamos fora do horário de atendimento..."
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Transferência para Humano</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="humanHandoff"
                checked={form.humanHandoff}
                onChange={(e) =>
                  setForm({ ...form, humanHandoff: e.target.checked })
                }
              />
              <Label htmlFor="humanHandoff">
                Permitir transferência para atendente humano
              </Label>
            </div>
            {form.humanHandoff && (
              <div className="space-y-2">
                <Label htmlFor="handoffKeyword">Palavra-chave para handoff</Label>
                <Input
                  id="handoffKeyword"
                  value={form.handoffKeyword}
                  onChange={(e) =>
                    setForm({ ...form, handoffKeyword: e.target.value })
                  }
                  placeholder="humano"
                />
              </div>
            )}
          </CardContent>
        </Card>

        <div className="flex justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
          >
            Cancelar
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? "Criando..." : "Criar Agente"}
          </Button>
        </div>
      </form>
    </div>
  );
}
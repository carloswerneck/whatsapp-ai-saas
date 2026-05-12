"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus } from "lucide-react";
import { STAGES } from "@/types";

interface Deal {
  id: string;
  title: string;
  value?: number;
  stage: string;
  contact: { id: string; name: string };
  createdAt: string;
}

export default function DealsPage() {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ title: "", value: "", contactId: "" });
  const [contacts, setContacts] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
    fetchDeals();
    fetchContacts();
  }, []);

  async function fetchDeals() {
    const res = await fetch("/api/deals");
    const data = await res.json();
    setDeals(data);
    setLoading(false);
  }

  async function fetchContacts() {
    const res = await fetch("/api/contacts");
    const data = await res.json();
    setContacts(data.contacts || []);
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/deals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: form.title,
        value: form.value ? parseFloat(form.value) : null,
        contactId: form.contactId,
        stage: "lead",
      }),
    });
    if (res.ok) {
      setDialogOpen(false);
      setForm({ title: "", value: "", contactId: "" });
      fetchDeals();
    }
  }

  async function handleStageChange(dealId: string, newStage: string) {
    await fetch(`/api/deals/${dealId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ stage: newStage }),
    });
    fetchDeals();
  }

  const dealsByStage = STAGES.map((stage) => ({
    ...stage,
    deals: deals.filter((d) => d.stage === stage.value),
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Pipeline</h1>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger render={<Button />}>
              <Plus className="mr-2 h-4 w-4" />
              Novo Deal
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Novo Deal</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Título</Label>
                <Input
                  id="title"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="value">Valor (R$)</Label>
                <Input
                  id="value"
                  type="number"
                  value={form.value}
                  onChange={(e) => setForm({ ...form, value: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Contato</Label>
                <Select
                  value={form.contactId}
                  onValueChange={(v) => setForm({ ...form, contactId: v ?? "" })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um contato" />
                  </SelectTrigger>
                  <SelectContent>
                    {contacts.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button type="submit" className="w-full">
                Criar Deal
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="text-muted-foreground">Carregando...</div>
      ) : (
        <div className="grid grid-cols-6 gap-4 overflow-x-auto">
          {dealsByStage.map((stage) => (
            <div key={stage.value} className="min-w-[200px]">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold">{stage.label}</h3>
                <span className="text-xs text-muted-foreground">
                  {stage.deals.length}
                </span>
              </div>
              <div className="space-y-2">
                {stage.deals.map((deal) => (
                  <Card
                    key={deal.id}
                    className="cursor-pointer hover:shadow-md transition-shadow"
                  >
                    <CardContent className="p-3">
                      <div className="text-sm font-medium">{deal.title}</div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {deal.contact?.name}
                      </div>
                      {deal.value && (
                        <div className="text-sm font-semibold mt-2">
                          R$ {deal.value.toLocaleString()}
                        </div>
                      )}
                      <div className="mt-2">
                        <Select
                          value={deal.stage}
                          onValueChange={(v) => handleStageChange(deal.id, v ?? "lead")}
                        >
                          <SelectTrigger className="h-7 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {STAGES.map((s) => (
                              <SelectItem key={s.value} value={s.value}>
                                {s.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
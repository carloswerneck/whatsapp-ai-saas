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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus } from "lucide-react";
import { INTERACTION_TYPES } from "@/types";

interface Interaction {
  id: string;
  type: string;
  subject: string;
  description?: string;
  date: string;
  contact: { id: string; name: string };
}

export default function InteractionsPage() {
  const [interactions, setInteractions] = useState<Interaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [contacts, setContacts] = useState<{ id: string; name: string }[]>([]);
  const [form, setForm] = useState({
    type: "note",
    subject: "",
    description: "",
    contactId: "",
  });

  useEffect(() => {
    fetchInteractions();
    fetchContacts();
  }, []);

  async function fetchInteractions() {
    const res = await fetch("/api/interactions");
    const data = await res.json();
    setInteractions(data);
    setLoading(false);
  }

  async function fetchContacts() {
    const res = await fetch("/api/contacts");
    const data = await res.json();
    setContacts(data.contacts || []);
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/interactions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (res.ok) {
      setDialogOpen(false);
      setForm({ type: "note", subject: "", description: "", contactId: "" });
      fetchInteractions();
    }
  }

  const getTypeLabel = (type: string) =>
    INTERACTION_TYPES.find((t) => t.value === type)?.label || type;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Interações</h1>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger render={<Button />}>
              <Plus className="mr-2 h-4 w-4" />
              Nova Interação
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nova Interação</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="space-y-2">
                <Label>Tipo</Label>
                <Select
                  value={form.type}
                  onValueChange={(v) => setForm({ ...form, type: v ?? "note" })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {INTERACTION_TYPES.map((t) => (
                      <SelectItem key={t.value} value={t.value}>
                        {t.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
              <div className="space-y-2">
                <Label htmlFor="subject">Assunto</Label>
                <Input
                  id="subject"
                  value={form.subject}
                  onChange={(e) => setForm({ ...form, subject: e.target.value })}
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
                  rows={3}
                />
              </div>
              <Button type="submit" className="w-full">
                Criar Interação
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="text-muted-foreground">Carregando...</div>
      ) : interactions.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-muted-foreground">Nenhuma interação registrada.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {interactions.map((interaction) => (
            <Card key={interaction.id}>
              <CardContent className="flex items-center justify-between p-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{interaction.subject}</span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-muted">
                      {getTypeLabel(interaction.type)}
                    </span>
                  </div>
                  {interaction.description && (
                    <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                      {interaction.description}
                    </p>
                  )}
                  <span className="text-xs text-muted-foreground">
                    {interaction.contact?.name}
                  </span>
                </div>
                <span className="text-xs text-muted-foreground">
                  {new Date(interaction.date).toLocaleDateString("pt-BR")}
                </span>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
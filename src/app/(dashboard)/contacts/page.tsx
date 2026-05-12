"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Plus, Search, Phone, Mail, Building } from "lucide-react";

interface Contact {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  company?: string;
  tags: string[];
  source?: string;
  _count?: { deals: number; interactions: number; conversations: number };
}

export default function ContactsPage() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    company: "",
    notes: "",
  });

  useEffect(() => {
    fetchContacts();
  }, [search]);

  async function fetchContacts() {
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    const res = await fetch(`/api/contacts?${params}`);
    const data = await res.json();
    setContacts(data.contacts || []);
    setLoading(false);
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/contacts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (res.ok) {
      setDialogOpen(false);
      setForm({ name: "", email: "", phone: "", company: "", notes: "" });
      fetchContacts();
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Contatos</h1>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger render={<Button />}>
              <Plus className="mr-2 h-4 w-4" />
              Novo Contato
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Novo Contato</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome</Label>
                <Input
                  id="name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Telefone</Label>
                <Input
                  id="phone"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="company">Empresa</Label>
                <Input
                  id="company"
                  value={form.company}
                  onChange={(e) =>
                    setForm({ ...form, company: e.target.value })
                  }
                />
              </div>
              <Button type="submit" className="w-full">
                Criar Contato
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar contatos..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      {loading ? (
        <div className="text-muted-foreground">Carregando...</div>
      ) : contacts.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-muted-foreground">Nenhum contato encontrado.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {contacts.map((contact) => (
            <Link key={contact.id} href={`/contacts/${contact.id}`}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="flex items-center justify-between p-4">
                  <div className="flex-1">
                    <div className="font-medium">{contact.name}</div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                      {contact.email && (
                        <span className="flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          {contact.email}
                        </span>
                      )}
                      {contact.phone && (
                        <span className="flex items-center gap-1">
                          <Phone className="h-3 w-3" />
                          {contact.phone}
                        </span>
                      )}
                      {contact.company && (
                        <span className="flex items-center gap-1">
                          <Building className="h-3 w-3" />
                          {contact.company}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {contact.source && (
                      <Badge variant="outline">{contact.source}</Badge>
                    )}
                    {contact.tags?.map((tag) => (
                      <Badge key={tag} variant="secondary">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
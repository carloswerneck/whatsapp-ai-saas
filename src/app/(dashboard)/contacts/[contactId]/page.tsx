"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Mail, Phone, Building } from "lucide-react";

interface Contact {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  company?: string;
  notes?: string;
  tags: string[];
  source?: string;
  createdAt: string;
  interactions: { id: string; type: string; subject: string; date: string }[];
  deals: { id: string; title: string; value?: number; stage: string }[];
}

export default function ContactDetailPage() {
  const params = useParams();
  const router = useRouter();
  const contactId = params.contactId as string;
  const [contact, setContact] = useState<Contact | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/contacts/${contactId}`)
      .then((res) => res.json())
      .then((data) => {
        setContact(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [contactId]);

  if (loading) return <div className="text-muted-foreground">Carregando...</div>;
  if (!contact) return <div>Contato não encontrado</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">{contact.name}</h1>
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
      </div>

      {contact.tags?.length > 0 && (
        <div className="flex gap-2">
          {contact.tags.map((tag) => (
            <Badge key={tag} variant="secondary">
              {tag}
            </Badge>
          ))}
          {contact.source && <Badge variant="outline">{contact.source}</Badge>}
        </div>
      )}

      {contact.notes && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Notas</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">
              {contact.notes}
            </p>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Deals ({contact.deals.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {contact.deals.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhum deal</p>
          ) : (
            <div className="space-y-2">
              {contact.deals.map((deal) => (
                <div
                  key={deal.id}
                  className="flex items-center justify-between rounded-md border p-3"
                >
                  <span className="text-sm font-medium">{deal.title}</span>
                  <div className="flex items-center gap-2">
                    {deal.value && (
                      <span className="text-sm text-muted-foreground">
                        R$ {deal.value.toLocaleString()}
                      </span>
                    )}
                    <Badge variant="outline">{deal.stage}</Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Interações ({contact.interactions.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {contact.interactions.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhuma interação</p>
          ) : (
            <div className="space-y-2">
              {contact.interactions.map((interaction) => (
                <div
                  key={interaction.id}
                  className="flex items-center justify-between rounded-md border p-3"
                >
                  <div>
                    <span className="text-sm font-medium">{interaction.subject}</span>
                    <Badge variant="outline" className="ml-2">{interaction.type}</Badge>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {new Date(interaction.date).toLocaleDateString("pt-BR")}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
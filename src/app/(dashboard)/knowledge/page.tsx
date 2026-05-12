"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Upload, FileText, Trash2 } from "lucide-react";

interface Agent {
  id: string;
  name: string;
}

interface Document {
  id: string;
  title: string;
  filename: string;
  status: string;
  chunkCount: number;
  createdAt: string;
  agent?: { id: string; name: string };
}

export default function KnowledgePage() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [selectedAgent, setSelectedAgent] = useState<string>("");
  const [documents, setDocuments] = useState<Document[]>([]);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/agents")
      .then((res) => res.json())
      .then((data) => {
        setAgents(data);
        if (data.length > 0) setSelectedAgent(data[0].id);
      });
  }, []);

  useEffect(() => {
    if (!selectedAgent) return;
    setLoading(true);
    fetch(`/api/agents/${selectedAgent}/documents`)
      .then((res) => res.json())
      .then((data) => {
        setDocuments(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [selectedAgent]);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !selectedAgent) return;

    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("agentId", selectedAgent);

    try {
      const res = await fetch("/api/rag/upload", {
        method: "POST",
        body: formData,
      });
      if (res.ok) {
        // Refresh documents
        const docs = await fetch(`/api/agents/${selectedAgent}/documents`).then(
          (r) => r.json()
        );
        setDocuments(docs);
      }
    } finally {
      setUploading(false);
    }
  }

  async function handleDelete(docId: string) {
    if (!confirm("Excluir este documento?")) return;
    await fetch(`/api/rag/documents/${docId}`, { method: "DELETE" });
    setDocuments(documents.filter((d) => d.id !== docId));
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Base de Conhecimento</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Upload de Documentos</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Selecione o Agente</label>
            <Select value={selectedAgent} onValueChange={(v) => setSelectedAgent(v ?? "")}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione um agente" />
              </SelectTrigger>
              <SelectContent>
                {agents.map((agent) => (
                  <SelectItem key={agent.id} value={agent.id}>
                    {agent.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedAgent && (
            <div>
              <label className="flex items-center gap-2 cursor-pointer rounded-md border border-dashed p-6 hover:bg-muted/50 transition-colors">
                <Upload className="h-8 w-8 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">
                    {uploading ? "Enviando..." : "Clique para upload"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    PDF ou TXT (máx. 10MB)
                  </p>
                </div>
                <input
                  type="file"
                  accept=".pdf,.txt"
                  className="hidden"
                  onChange={handleUpload}
                  disabled={uploading}
                />
              </label>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Documentos</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-muted-foreground">Carregando...</p>
          ) : documents.length === 0 ? (
            <p className="text-muted-foreground">
              Nenhum documento adicionado ainda.
            </p>
          ) : (
            <div className="space-y-2">
              {documents.map((doc) => (
                <div
                  key={doc.id}
                  className="flex items-center justify-between rounded-md border p-3"
                >
                  <div className="flex items-center gap-3">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">{doc.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {doc.chunkCount} chunks
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
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
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(doc.id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
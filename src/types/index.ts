export const STAGES = [
  { value: "lead", label: "Lead", color: "bg-slate-500" },
  { value: "contacted", label: "Contactado", color: "bg-blue-500" },
  { value: "proposal", label: "Proposta", color: "bg-yellow-500" },
  { value: "negotiation", label: "Negociação", color: "bg-orange-500" },
  { value: "closed_won", label: "Ganho", color: "bg-green-500" },
  { value: "closed_lost", label: "Perdido", color: "bg-red-500" },
] as const;

export const INTERACTION_TYPES = [
  { value: "call", label: "Ligação" },
  { value: "email", label: "E-mail" },
  { value: "meeting", label: "Reunião" },
  { value: "note", label: "Nota" },
  { value: "whatsapp_message", label: "WhatsApp" },
] as const;

export const AGENT_PURPOSES = [
  { value: "SCHEDULING", label: "Agendamento" },
  { value: "SUPPORT", label: "Suporte" },
  { value: "FAQ", label: "FAQ / Dúvidas" },
  { value: "SALES", label: "Vendas" },
  { value: "CUSTOM", label: "Personalizado" },
] as const;

export const PLANS = [
  { value: "FREE", label: "Gratuito", price: 0, agents: 1, messages: 100, docs: 1 },
  { value: "STARTER", label: "Starter", price: 29, agents: 1, messages: 1000, docs: 5 },
  { value: "PRO", label: "Pro", price: 79, agents: 3, messages: 10000, docs: 25 },
  { value: "BUSINESS", label: "Business", price: 199, agents: 10, messages: Infinity, docs: Infinity },
] as const;

export type Stage = (typeof STAGES)[number]["value"];
export type InteractionType = (typeof INTERACTION_TYPES)[number]["value"];
export type AgentPurpose = (typeof AGENT_PURPOSES)[number]["value"];
export type Plan = (typeof PLANS)[number]["value"];
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  Bot,
  Contact,
  LayoutDashboard,
  MessageSquare,
  Settings,
  BookOpen,
  Kanban,
  LogOut,
} from "lucide-react";
import { signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";

const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/agents", label: "Agentes", icon: Bot },
  { href: "/contacts", label: "Contatos", icon: Contact },
  { href: "/deals", label: "Pipeline", icon: Kanban },
  { href: "/interactions", label: "Interações", icon: MessageSquare },
  { href: "/knowledge", label: "Conhecimento", icon: BookOpen },
  { href: "/settings", label: "Configurações", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex h-screen w-64 flex-col border-r bg-card">
      <div className="flex h-14 items-center border-b px-4">
        <Link href="/" className="flex items-center gap-2 font-semibold">
          <Bot className="h-6 w-6 text-primary" />
          <span>WA Agent</span>
        </Link>
      </div>
      <nav className="flex-1 space-y-1 p-2">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
              pathname === item.href || (item.href !== "/" && pathname?.startsWith(item.href))
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            <item.icon className="h-4 w-4" />
            {item.label}
          </Link>
        ))}
      </nav>
      <div className="border-t p-2">
        <Button
          variant="ghost"
          className="w-full justify-start gap-3 text-muted-foreground"
          onClick={() => signOut({ callbackUrl: "/login" })}
        >
          <LogOut className="h-4 w-4" />
          Sair
        </Button>
      </div>
    </aside>
  );
}
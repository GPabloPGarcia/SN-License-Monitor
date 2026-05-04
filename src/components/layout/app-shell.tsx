"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  Building2,
  ChevronRight,
  Database,
  History,
  LogOut,
  ShieldAlert,
  Server,
  Settings,
  UserCircle
} from "lucide-react";
import { logoutAction } from "@/app/(app)/actions";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import type { SessionUser } from "@/lib/auth/token";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: BarChart3 },
  { href: "/clients", label: "Clientes", icon: Building2 },
  { href: "/instances", label: "Instancias", icon: Server },
  { href: "/licenses", label: "Licencas", icon: ShieldAlert },
  { href: "/collector-runs", label: "Coletas", icon: History },
  { href: "/settings", label: "Configuracoes", icon: Settings }
];

const breadcrumbLabels: Record<string, string> = {
  dashboard: "Dashboard",
  clients: "Clientes",
  new: "Novo",
  instances: "Instancias",
  licenses: "Licencas",
  "collector-runs": "Coletas",
  settings: "Configuracoes",
  edit: "Editar"
};

function Breadcrumb() {
  const pathname = usePathname();
  const parts = pathname.split("/").filter(Boolean);

  return (
    <nav className="flex min-w-0 items-center gap-1 text-sm text-muted-foreground">
      {parts.map((part, index) => {
        const isLast = index === parts.length - 1;
        return (
          <span key={`${part}-${index}`} className="flex min-w-0 items-center gap-1">
            {index > 0 ? <ChevronRight className="h-4 w-4 shrink-0" /> : null}
            <span className={cn(isLast && "font-medium text-foreground")}>
              {breadcrumbLabels[part] ?? part}
            </span>
          </span>
        );
      })}
    </nav>
  );
}

export function AppShell({
  user,
  children
}: {
  user: SessionUser;
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-background">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 border-r bg-card md:flex md:flex-col">
        <div className="flex h-16 items-center gap-3 border-b px-5">
          <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <Database className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">SN-License Monitor</p>
            <p className="truncate text-xs text-muted-foreground">ServiceNow</p>
          </div>
        </div>

        <nav className="flex flex-1 flex-col gap-1 p-3">
          {navItems.map((item) => {
            const active =
              pathname === item.href || pathname.startsWith(`${item.href}/`);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex h-10 items-center gap-3 rounded-md px-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground",
                  active && "bg-secondary text-foreground"
                )}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>

      <div className="md:pl-64">
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b bg-background/95 px-4 backdrop-blur md:px-6">
          <div className="min-w-0">
            <Breadcrumb />
          </div>

          <div className="flex items-center gap-2">
            <ThemeToggle />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon" aria-label="Menu do usuario">
                  <UserCircle className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>
                  <span className="block truncate">{user.name}</span>
                  <span className="block truncate text-xs font-normal text-muted-foreground">
                    {user.role}
                  </span>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <form action={logoutAction} className="w-full">
                    <button className="flex w-full items-center gap-2">
                      <LogOut className="h-4 w-4" />
                      Sair
                    </button>
                  </form>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        <nav className="flex gap-1 overflow-auto border-b bg-card px-4 py-2 md:hidden">
          {navItems.map((item) => {
            const active =
              pathname === item.href || pathname.startsWith(`${item.href}/`);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex h-9 shrink-0 items-center gap-2 rounded-md px-3 text-sm text-muted-foreground",
                  active && "bg-secondary text-foreground"
                )}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <main className="mx-auto w-full max-w-7xl px-4 py-6 md:px-6">
          {children}
        </main>
      </div>
    </div>
  );
}

"use client";

import { useState, useMemo } from "react";
import { ChevronDown, ChevronRight, Search, X } from "lucide-react";
import { StatusBadge } from "@/components/status/status-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { cn, formatDateTime } from "@/lib/utils";
import type { CollectorScope, CollectorStatus } from "@prisma/client";

export type LogRunItem = {
  id: string;
  scope: CollectorScope;
  status: CollectorStatus;
  startedAt: string;
  finishedAt: string | null;
  clientName: string | null;
  instanceName: string | null;
  totalInstances: number;
  totalSuccess: number;
  totalFailed: number;
  totalSnapshots: number;
  errorMessage: string | null;
  createdByUser: string | null;
};

const SCOPE_LABELS: Record<CollectorScope, string> = {
  GENERAL: "Geral",
  CLIENT: "Cliente",
  INSTANCE: "Instancia"
};

function durationLabel(startedAt: string, finishedAt: string | null): string {
  if (!finishedAt) return "em andamento";
  const secs = Math.round(
    (new Date(finishedAt).getTime() - new Date(startedAt).getTime()) / 1000
  );
  if (secs < 60) return `${secs}s`;
  return `${Math.floor(secs / 60)}m ${secs % 60}s`;
}

export function LogsTable({ runs }: { runs: LogRunItem[] }) {
  const [filter, setFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState<CollectorStatus | "">("");
  const [scopeFilter, setScopeFilter] = useState<CollectorScope | "">("");
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  function toggleRow(id: string) {
    setExpandedRows((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const filtered = useMemo(() => {
    let result = runs;

    if (statusFilter) {
      result = result.filter((r) => r.status === statusFilter);
    }

    if (scopeFilter) {
      result = result.filter((r) => r.scope === scopeFilter);
    }

    if (filter.trim()) {
      const q = filter.trim().toLowerCase();
      result = result.filter((r) =>
        [r.clientName ?? "", r.instanceName ?? "", r.errorMessage ?? "", r.createdByUser ?? ""]
          .join(" ")
          .toLowerCase()
          .includes(q)
      );
    }

    return result;
  }, [runs, filter, statusFilter, scopeFilter]);

  const failedCount = runs.filter(
    (r) => r.status === "FAILED" || r.status === "PARTIAL"
  ).length;

  const hasActiveFilters = !!(filter || statusFilter || scopeFilter);

  function clearFilters() {
    setFilter("");
    setStatusFilter("");
    setScopeFilter("");
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex flex-1 items-center gap-2">
          <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
          <Input
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Buscar por cliente, instancia, mensagem de erro, usuario..."
            className="max-w-sm"
          />
          {filter && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setFilter("")}
              className="h-8 w-8 shrink-0"
              aria-label="Limpar busca"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as CollectorStatus | "")}
          className="rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        >
          <option value="">Todos os status</option>
          <option value="RUNNING">Running</option>
          <option value="SUCCESS">Success</option>
          <option value="PARTIAL">Partial</option>
          <option value="FAILED">Failed</option>
        </select>

        <select
          value={scopeFilter}
          onChange={(e) => setScopeFilter(e.target.value as CollectorScope | "")}
          className="rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        >
          <option value="">Todos os escopos</option>
          <option value="GENERAL">Geral</option>
          <option value="CLIENT">Cliente</option>
          <option value="INSTANCE">Instancia</option>
        </select>

        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={clearFilters}>
            <X className="mr-1 h-3 w-3" />
            Limpar filtros
          </Button>
        )}
      </div>

      {failedCount > 0 && (
        <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/20 dark:text-red-300">
          <strong>{failedCount}</strong> execucao(oes) com falha ou parcial. Clique nas linhas
          destacadas para expandir os detalhes do erro.
        </div>
      )}

      <div className="rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-8" />
              <TableHead>Inicio</TableHead>
              <TableHead>Duracao</TableHead>
              <TableHead>Escopo</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Cliente / Instancia</TableHead>
              <TableHead>Sucesso / Falha</TableHead>
              <TableHead>Snapshots</TableHead>
              <TableHead>Disparado por</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center text-muted-foreground">
                  Nenhum registro encontrado.
                </TableCell>
              </TableRow>
            ) : (
              filtered.flatMap((run) => {
                const isExpanded = expandedRows.has(run.id);
                const hasError = !!run.errorMessage;

                const mainRow = (
                  <TableRow
                    key={run.id}
                    onClick={() => hasError && toggleRow(run.id)}
                    className={cn(
                      hasError &&
                        "cursor-pointer bg-red-50/40 hover:bg-red-50/70 dark:bg-red-950/10 dark:hover:bg-red-950/20"
                    )}
                  >
                    <TableCell>
                      {hasError ? (
                        isExpanded ? (
                          <ChevronDown className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <ChevronRight className="h-4 w-4 text-muted-foreground" />
                        )
                      ) : null}
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-xs">
                      {formatDateTime(run.startedAt)}
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                      {durationLabel(run.startedAt, run.finishedAt)}
                    </TableCell>
                    <TableCell className="text-sm">{SCOPE_LABELS[run.scope]}</TableCell>
                    <TableCell>
                      <StatusBadge status={run.status} />
                    </TableCell>
                    <TableCell className="text-sm">
                      {run.clientName ?? "-"}
                      {run.instanceName && (
                        <span className="text-muted-foreground"> / {run.instanceName}</span>
                      )}
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      <span className="text-green-600 dark:text-green-400">{run.totalSuccess}</span>
                      {" / "}
                      <span
                        className={cn(
                          run.totalFailed > 0 && "font-semibold text-red-600 dark:text-red-400"
                        )}
                      >
                        {run.totalFailed}
                      </span>
                    </TableCell>
                    <TableCell>{run.totalSnapshots}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {run.createdByUser ?? "job interno"}
                    </TableCell>
                  </TableRow>
                );

                if (!isExpanded || !run.errorMessage) return [mainRow];

                const detailRow = (
                  <TableRow
                    key={`${run.id}-detail`}
                    className="bg-red-50/60 dark:bg-red-950/20"
                  >
                    <TableCell colSpan={9} className="px-6 pb-4 pt-0">
                      <div className="rounded-md border border-red-200 bg-background p-4 dark:border-red-900">
                        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-red-700 dark:text-red-300">
                          Detalhes do erro
                        </p>
                        <pre className="whitespace-pre-wrap font-mono text-xs text-red-600 dark:text-red-300">
                          {run.errorMessage}
                        </pre>
                      </div>
                    </TableCell>
                  </TableRow>
                );

                return [mainRow, detailRow];
              })
            )}
          </TableBody>
        </Table>
      </div>

      <p className="text-right text-xs text-muted-foreground">
        Exibindo {filtered.length} de {runs.length} registros
      </p>
    </div>
  );
}

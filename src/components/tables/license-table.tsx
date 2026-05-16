"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowDown, ArrowUp, ArrowUpDown, Search, X } from "lucide-react";
import { PlatformStatusBadge } from "@/components/status/platform-status-badge";
import { RiskBadge } from "@/components/status/risk-badge";
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
import { cn, formatDate, formatNumber, formatPercent } from "@/lib/utils";
import type { RiskLevel } from "@prisma/client";

export type LicenseTableItem = {
  id: string;
  name: string;
  productCode: string;
  meterType: string | null;
  purchased: number | null;
  allocated: number | null;
  available: number | null;
  usagePercent: number | null;
  status: string | null;
  riskLevel: RiskLevel;
  endDate: string | null;
  weeklyVariation: number | null;
};

type SortKey = keyof LicenseTableItem;
type SortDir = "asc" | "desc";

const RISK_ORDER: Record<RiskLevel, number> = { LOW: 1, MEDIUM: 2, HIGH: 3, CRITICAL: 4 };

function compareItems(a: LicenseTableItem, b: LicenseTableItem, key: SortKey): number {
  const av = a[key];
  const bv = b[key];
  if (av === null && bv === null) return 0;
  if (av === null) return 1;
  if (bv === null) return -1;
  if (key === "riskLevel") return RISK_ORDER[av as RiskLevel] - RISK_ORDER[bv as RiskLevel];
  if (typeof av === "number" && typeof bv === "number") return av - bv;
  return String(av).localeCompare(String(bv), "pt-BR");
}

function SortIcon({
  col,
  sortKey,
  sortDir
}: {
  col: SortKey;
  sortKey: SortKey | null;
  sortDir: SortDir;
}) {
  if (sortKey !== col) return <ArrowUpDown className="ml-1 inline h-3 w-3 opacity-40" />;
  return sortDir === "asc" ? (
    <ArrowUp className="ml-1 inline h-3 w-3 text-primary" />
  ) : (
    <ArrowDown className="ml-1 inline h-3 w-3 text-primary" />
  );
}

const COLUMNS: { key: SortKey; label: string }[] = [
  { key: "name", label: "Nome" },
  { key: "productCode", label: "Product Code" },
  { key: "purchased", label: "Comprado" },
  { key: "allocated", label: "Alocado" },
  { key: "available", label: "Disponivel" },
  { key: "usagePercent", label: "Uso %" },
  { key: "status", label: "Status" },
  { key: "riskLevel", label: "Risco" },
  { key: "endDate", label: "Vencimento" },
  { key: "weeklyVariation", label: "Variacao Semanal" }
];

export function LicenseTable({ licenses }: { licenses: LicenseTableItem[] }) {
  const [filter, setFilter] = useState("");
  const [sortKey, setSortKey] = useState<SortKey | null>(null);
  const [sortDir, setSortDir] = useState<SortDir>("asc");

  function handleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  }

  const query = filter.trim().toLowerCase();

  let displayed = query
    ? licenses.filter((l) =>
        [l.name, l.productCode, l.meterType ?? "", l.status ?? ""]
          .join(" ")
          .toLowerCase()
          .includes(query)
      )
    : [...licenses];

  if (sortKey) {
    displayed = displayed.sort((a, b) => {
      const cmp = compareItems(a, b, sortKey);
      return sortDir === "asc" ? cmp : -cmp;
    });
  }

  return (
    <div className="rounded-lg border bg-card">
      <div className="flex flex-wrap items-center gap-2 border-b p-4">
        <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
        <Input
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          placeholder="Filtrar por nome, product code, meter type ou status..."
          className="max-w-lg"
        />
        {filter && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setFilter("")}
            className="h-8 w-8 shrink-0"
            aria-label="Limpar filtro"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
        {query && (
          <span className="shrink-0 text-sm text-muted-foreground">
            {displayed.length} resultado(s) de {licenses.length}
          </span>
        )}
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            {COLUMNS.map((col) => (
              <TableHead
                key={col.key}
                onClick={() => handleSort(col.key)}
                className={cn(
                  "cursor-pointer select-none whitespace-nowrap hover:text-foreground",
                  sortKey === col.key && "text-foreground"
                )}
              >
                {col.label}
                <SortIcon col={col.key} sortKey={sortKey} sortDir={sortDir} />
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {displayed.length === 0 ? (
            <TableRow>
              <TableCell colSpan={10} className="text-center text-muted-foreground">
                {query
                  ? "Nenhuma licenca encontrada para esse filtro."
                  : "Nenhuma licenca encontrada."}
              </TableCell>
            </TableRow>
          ) : (
            displayed.map((license) => (
              <TableRow key={license.id}>
                <TableCell>
                  <Link href={`/licenses/${license.id}`} className="font-medium hover:underline">
                    {license.name}
                  </Link>
                </TableCell>
                <TableCell>{license.productCode}</TableCell>
                <TableCell>{formatNumber(license.purchased)}</TableCell>
                <TableCell>{formatNumber(license.allocated)}</TableCell>
                <TableCell>{formatNumber(license.available)}</TableCell>
                <TableCell>{formatPercent(license.usagePercent)}</TableCell>
                <TableCell><PlatformStatusBadge status={license.status} /></TableCell>
                <TableCell>
                  <RiskBadge riskLevel={license.riskLevel} />
                </TableCell>
                <TableCell>{formatDate(license.endDate)}</TableCell>
                <TableCell>{formatPercent(license.weeklyVariation)}</TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}

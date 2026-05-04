"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { RiskBadge } from "@/components/status/risk-badge";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { formatDate, formatNumber, formatPercent } from "@/lib/utils";
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

export function LicenseTable({ licenses }: { licenses: LicenseTableItem[] }) {
  const [filter, setFilter] = useState("");
  const normalizedFilter = filter.trim().toLowerCase();
  const filteredLicenses = useMemo(() => {
    if (!normalizedFilter) {
      return licenses;
    }

    return licenses.filter((license) =>
      [license.name, license.productCode, license.meterType ?? "", license.status ?? ""]
        .join(" ")
        .toLowerCase()
        .includes(normalizedFilter)
    );
  }, [licenses, normalizedFilter]);

  return (
    <div className="rounded-lg border bg-card">
      <div className="flex items-center gap-2 border-b p-4">
        <Search className="h-4 w-4 text-muted-foreground" />
        <Input
          value={filter}
          onChange={(event) => setFilter(event.target.value)}
          placeholder="Filtrar por nome, product code, meter type ou status"
          className="max-w-lg"
        />
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nome</TableHead>
            <TableHead>Product Code</TableHead>
            <TableHead>Meter Type</TableHead>
            <TableHead>Comprado</TableHead>
            <TableHead>Alocado</TableHead>
            <TableHead>Disponivel</TableHead>
            <TableHead>Uso %</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Risco</TableHead>
            <TableHead>Vencimento</TableHead>
            <TableHead>Variacao semanal</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredLicenses.length === 0 ? (
            <TableRow>
              <TableCell colSpan={11} className="text-center text-muted-foreground">
                Nenhuma licenca encontrada.
              </TableCell>
            </TableRow>
          ) : (
            filteredLicenses.map((license) => (
              <TableRow key={license.id}>
                <TableCell>
                  <Link href={`/licenses/${license.id}`} className="font-medium hover:underline">
                    {license.name}
                  </Link>
                </TableCell>
                <TableCell>{license.productCode}</TableCell>
                <TableCell>{license.meterType ?? "-"}</TableCell>
                <TableCell>{formatNumber(license.purchased)}</TableCell>
                <TableCell>{formatNumber(license.allocated)}</TableCell>
                <TableCell>{formatNumber(license.available)}</TableCell>
                <TableCell>{formatPercent(license.usagePercent)}</TableCell>
                <TableCell>{license.status ?? "-"}</TableCell>
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

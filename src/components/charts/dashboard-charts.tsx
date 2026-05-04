"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const palette = ["#0CA678", "#339AF0", "#F59F00", "#E03131", "#748FFC", "#15AABF"];
const riskColors: Record<string, string> = {
  LOW: "#0CA678",
  MEDIUM: "#339AF0",
  HIGH: "#F59F00",
  CRITICAL: "#E03131"
};

const tooltipProps = {
  contentStyle: {
    backgroundColor: "hsl(var(--card))",
    borderColor: "hsl(var(--border))",
    borderRadius: "8px",
    color: "hsl(var(--card-foreground))",
    boxShadow: "0 12px 30px hsl(220 14% 9% / 0.18)"
  },
  labelStyle: {
    color: "hsl(var(--foreground))",
    fontWeight: 600
  },
  itemStyle: {
    color: "hsl(var(--foreground))"
  },
  cursor: {
    fill: "hsl(var(--muted) / 0.45)"
  }
};

function EmptyChart() {
  return (
    <div className="flex h-64 items-center justify-center rounded-md border border-dashed text-sm text-muted-foreground">
      Sem dados para exibir
    </div>
  );
}

export function StackedRiskChart({
  title,
  data
}: {
  title: string;
  data: Array<Record<string, string | number>>;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <EmptyChart />
        ) : (
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="instance" tickLine={false} axisLine={false} />
                <YAxis allowDecimals={false} tickLine={false} axisLine={false} />
                <Tooltip {...tooltipProps} />
                <Legend />
                {Object.entries(riskColors).map(([risk, color]) => (
                  <Bar key={risk} dataKey={risk} stackId="risk" fill={color} radius={[4, 4, 0, 0]} />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function SimpleBarChart({
  title,
  data,
  xKey,
  yKey,
  color = palette[0]
}: {
  title: string;
  data: Array<Record<string, string | number>>;
  xKey: string;
  yKey: string;
  color?: string;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <EmptyChart />
        ) : (
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey={xKey} tickLine={false} axisLine={false} />
                <YAxis tickLine={false} axisLine={false} />
                <Tooltip {...tooltipProps} />
                <Bar dataKey={yKey} fill={color} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function MultiLineChart({
  title,
  data,
  xKey,
  lines
}: {
  title: string;
  data: Array<Record<string, string | number>>;
  xKey: string;
  lines: string[];
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <EmptyChart />
        ) : (
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey={xKey} tickLine={false} axisLine={false} />
                <YAxis tickLine={false} axisLine={false} />
                <Tooltip {...tooltipProps} />
                <Legend />
                {lines.map((line, index) => (
                  <Line
                    key={line}
                    type="monotone"
                    dataKey={line}
                    stroke={palette[index % palette.length]}
                    strokeWidth={2}
                    dot={false}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function PieDistributionChart({
  title,
  data
}: {
  title: string;
  data: Array<{ name: string; value: number }>;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {data.length === 0 || data.every((item) => item.value === 0) ? (
          <EmptyChart />
        ) : (
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Tooltip {...tooltipProps} />
                <Legend />
                <Pie data={data} dataKey="value" nameKey="name" outerRadius={90}>
                  {data.map((entry, index) => (
                    <Cell
                      key={entry.name}
                      fill={riskColors[entry.name] ?? palette[index % palette.length]}
                    />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

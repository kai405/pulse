"use client";

import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

type Point = { label: string; score: number };

export function ProgressChart({ data, isSample = false }: { data: readonly Point[]; isSample?: boolean }) {
  return (
    <div className="h-[245px] w-full" aria-label={`Overall score trend across ${data.length} ${isSample ? "sample " : ""}sessions`} role="img">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={[...data]} margin={{ top: 10, right: 6, bottom: 0, left: -26 }}>
          <defs>
            <linearGradient id="scoreFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--accent)" stopOpacity={0.24} />
              <stop offset="100%" stopColor="var(--accent)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid vertical={false} stroke="var(--chart-grid)" strokeDasharray="4 4" />
          <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: "var(--chart-tick)", fontSize: 11 }} dy={8} />
          <YAxis domain={[50, 100]} axisLine={false} tickLine={false} tick={{ fill: "var(--chart-tick)", fontSize: 11 }} ticks={[60, 70, 80, 90, 100]} />
          <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid var(--line)", boxShadow: "var(--shadow-sm)", fontSize: 12 }} formatter={(value) => [`${value}/100`, "Overall"]} />
          <Area type="monotone" dataKey="score" stroke="var(--accent)" strokeWidth={3} fill="url(#scoreFill)" dot={{ r: 3, fill: "var(--surface)", stroke: "var(--accent)", strokeWidth: 2 }} activeDot={{ r: 5 }} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

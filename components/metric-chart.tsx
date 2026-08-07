"use client";

import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export function MetricChart({ data, dataKey, color, label, domain }: { data: readonly Record<string, number | string>[]; dataKey: string; color: string; label: string; domain: [number, number] }) {
  return <div className="h-40 w-full" role="img" aria-label={`${label} trend across ${data.length} sessions`}><ResponsiveContainer width="100%" height="100%"><LineChart data={[...data]} margin={{ top: 10, right: 8, bottom: 0, left: -30 }}><XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "var(--chart-tick)" }} /><YAxis domain={domain} axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "var(--chart-tick)" }} /><Tooltip contentStyle={{ borderRadius: 12, border: "1px solid var(--line)", fontSize: 12 }} formatter={(value) => [value, label]} /><Line type="monotone" dataKey={dataKey} stroke={color} strokeWidth={2.5} dot={{ fill: "var(--surface)", stroke: color, strokeWidth: 2, r: 3 }} /></LineChart></ResponsiveContainer></div>;
}

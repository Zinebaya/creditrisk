import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

interface BarChartProps {
  data: Array<{ name: string; value: number }>;
  color: string;
}

export default function TrendBarChart({ data, color }: BarChartProps) {
  return (
    <div className="h-[360px] rounded-[2rem] bg-white/80 p-5 shadow-soft">
      <div className="mb-4">
        <p className="text-sm font-medium text-slate-500">Activity</p>
        <p className="text-lg font-semibold text-slate-950">Monthly approvals</p>
      </div>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 10, right: 0, left: -10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis dataKey="name" tickLine={false} axisLine={false} stroke="#64748b" />
          <YAxis tickLine={false} axisLine={false} stroke="#64748b" />
          <Tooltip contentStyle={{ borderRadius: 18, border: "1px solid rgba(148,163,184,0.18)" }} />
          <Bar dataKey="value" fill={color} radius={[12, 12, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

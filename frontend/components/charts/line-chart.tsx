import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

interface LineChartProps {
  data: Array<{ name: string; value: number }>;
  color: string;
}

export default function CreditLineChart({ data, color }: LineChartProps) {
  return (
    <div className="h-[320px] rounded-[2rem] bg-white/80 p-5 shadow-soft">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">Trend</p>
          <p className="text-lg font-semibold text-slate-950">Prediction activity</p>
        </div>
      </div>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis dataKey="name" tickLine={false} axisLine={false} stroke="#64748b" />
          <YAxis tickLine={false} axisLine={false} stroke="#64748b" />
          <Tooltip contentStyle={{ borderRadius: 18, border: "1px solid rgba(148,163,184,0.18)" }} />
          <Line type="monotone" dataKey="value" stroke={color} strokeWidth={4} dot={{ r: 3, strokeWidth: 0 }} activeDot={{ r: 6 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";

interface PieChartProps {
  data: Array<{ name: string; value: number }>;
  colors: string[];
}

export default function RiskPieChart({ data, colors }: PieChartProps) {
  return (
    <div className="h-[320px] rounded-[2rem] bg-white/80 p-5 shadow-soft">
      <div className="mb-4">
        <p className="text-sm font-medium text-slate-500">Distribution</p>
        <p className="text-lg font-semibold text-slate-950">Risk segmentation</p>
      </div>
      <ResponsiveContainer width="100%" height="85%">
        <PieChart>
          <Pie data={data} dataKey="value" innerRadius={70} outerRadius={110} stroke="none" paddingAngle={4}>
            {data.map((entry, index) => (
              <Cell key={entry.name} fill={colors[index % colors.length]} />
            ))}
          </Pie>
          <Tooltip contentStyle={{ borderRadius: 18, border: "1px solid rgba(148,163,184,0.18)" }} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

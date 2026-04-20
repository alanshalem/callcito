"use client";

//#region Imports
import {
  Bar,
  BarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
//#endregion

//#region RevenueChart
const RevenueChart = ({
  data,
  emptyLabel,
}: {
  data: Array<{ day: string; total: number }>;
  emptyLabel: string;
}) => {
  if (data.length === 0) {
    return <p className="text-sm text-muted-foreground">{emptyLabel}</p>;
  }
  return (
    <ResponsiveContainer width="100%" height={240}>
      <BarChart data={data}>
        <XAxis dataKey="day" tick={{ fontSize: 11 }} stroke="currentColor" />
        <YAxis tick={{ fontSize: 11 }} stroke="currentColor" />
        <Tooltip
          contentStyle={{
            background: "var(--popover)",
            border: "1px solid var(--border)",
            borderRadius: "var(--radius)",
            fontSize: 12,
          }}
        />
        <Bar dataKey="total" fill="var(--primary)" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
};
//#endregion

export default RevenueChart;

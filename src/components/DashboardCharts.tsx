import { memo } from "react";
import { motion } from "framer-motion";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  RadarChart, PolarGrid, PolarAngleAxis, Radar,
} from "recharts";
import type { TimelinePoint } from "@/lib/analysis-engine";

interface DashboardChartsProps {
  timeline: TimelinePoint[];
  radarData: { metric: string; value: number }[];
}

const DashboardCharts = memo(({ timeline, radarData }: DashboardChartsProps) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="lg:col-span-2 p-6 rounded-xl bg-card border border-border"
      >
        <h3 className="font-display font-semibold mb-4">Evolution Graph</h3>
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={timeline}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 14%, 14%)" />
            <XAxis dataKey="year" stroke="hsl(215, 12%, 50%)" fontSize={12} />
            <YAxis stroke="hsl(215, 12%, 50%)" fontSize={12} />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(220, 18%, 7%)",
                border: "1px solid hsl(220, 14%, 14%)",
                borderRadius: "8px",
                fontSize: 12,
              }}
            />
            <Line
              type="monotone"
              dataKey="consistency"
              stroke="hsl(155, 70%, 45%)"
              strokeWidth={2}
              dot={{ r: 3 }}
              isAnimationActive={false}
            />
            <Line
              type="monotone"
              dataKey="architecture"
              stroke="hsl(185, 70%, 50%)"
              strokeWidth={2}
              dot={{ r: 3 }}
              isAnimationActive={false}
            />
            <Line
              type="monotone"
              dataKey="scope"
              stroke="hsl(155, 50%, 60%)"
              strokeWidth={2}
              dot={{ r: 3 }}
              isAnimationActive={false}
            />
            <Line
              type="monotone"
              dataKey="collaboration"
              stroke="hsl(185, 50%, 60%)"
              strokeWidth={2}
              dot={{ r: 3 }}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        className="p-6 rounded-xl bg-card border border-border"
      >
        <h3 className="font-display font-semibold mb-4">Growth Profile</h3>
        <ResponsiveContainer width="100%" height={280}>
          <RadarChart data={radarData}>
            <PolarGrid stroke="hsl(220, 14%, 14%)" />
            <PolarAngleAxis
              dataKey="metric"
              tick={{ fill: "hsl(215, 12%, 50%)", fontSize: 11 }}
            />
            <Radar
              dataKey="value"
              stroke="hsl(155, 70%, 45%)"
              fill="hsl(155, 70%, 45%)"
              fillOpacity={0.15}
              strokeWidth={2}
              isAnimationActive={false}
            />
          </RadarChart>
        </ResponsiveContainer>
      </motion.div>
    </div>
  );
});

DashboardCharts.displayName = "DashboardCharts";

export default DashboardCharts;

import { useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import useStore from "../../store";
import Card from "../ui/Card";
import { getAttackColor } from "../../utils/colors";

export default function BottomBar() {
  const stats = useStore((s) => s.stats);
  const attacks = useStore((s) => s.attacks);

  // Compute attack type distribution from active attacks
  const typeData = useMemo(() => {
    const counts = {};
    attacks.forEach((a) => {
      counts[a.attackType] = (counts[a.attackType] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([type, count]) => ({
        type: type.replace(/_/g, " "),
        count,
        color: getAttackColor(type),
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 6);
  }, [attacks]);

  return (
    <div className="absolute bottom-0 left-0 right-0 z-10 flex items-stretch gap-4 px-4 py-3 bg-gray-950/70 backdrop-blur-sm border-t border-gray-800/50">
      {/* Top source countries */}
      <Card className="flex-1 p-3">
        <h3 className="text-[10px] font-mono uppercase tracking-wider text-gray-500 mb-2">
          Top Source Countries
        </h3>
        <div className="flex items-end gap-1 h-12">
          {stats.topCountries.slice(0, 12).map((c, i) => {
            const maxCount = stats.topCountries[0]?.count || 1;
            const height = `${Math.max(10, (c.count / maxCount) * 100)}%`;
            return (
              <div
                key={c.country}
                className="flex-1 flex flex-col items-center justify-end group relative"
              >
                <div
                  className="w-full rounded-t-sm transition-all bg-cyber-blue/60 hover:bg-cyber-blue"
                  style={{ height }}
                />
                <span className="text-[16px] font-mono text-gray-500 mt-1 group-hover:text-white transition-colors">
                  {c.country}
                </span>
                {/* Tooltip on hover */}
                <div className="absolute bottom-full mb-1 hidden group-hover:block bg-gray-800 text-[10px] font-mono text-white px-2 py-1 rounded whitespace-nowrap z-20">
                  {c.country}: {c.count} attacks
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Attack type distribution */}
      <Card className="flex-1 p-3">
        <h3 className="text-[10px] font-mono uppercase tracking-wider text-gray-500 mb-2">
          Attack Types
        </h3>
        <ResponsiveContainer width="100%" height={52}>
          <BarChart
            data={typeData}
            layout="vertical"
            margin={{ top: 0, right: 0, bottom: 0, left: 0 }}
          >
            <XAxis type="number" hide />
            <YAxis type="category" dataKey="type" hide />
            <Tooltip
              contentStyle={{
                background: "#1f2937",
                border: "1px solid #374151",
                borderRadius: "4px",
                fontSize: "11px",
                fontFamily: "JetBrains Mono, monospace",
              }}
              formatter={(value, name) => [value, "attacks"]}
            />
            <Bar dataKey="count" radius={[0, 2, 2, 0]}>
              {typeData.map((entry, idx) => (
                <Cell key={idx} fill={entry.color} fillOpacity={0.7} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </Card>

      {/* Legend */}
      <Card className="w-48 p-3">
        <h3 className="text-[10px] font-mono uppercase tracking-wider text-gray-500 mb-2">
          Severity
        </h3>
        <div className="flex flex-col gap-1.5">
          {[
            { label: "Critical", color: "#dc2626" },
            { label: "High", color: "#ef4444" },
            { label: "Medium", color: "#f59e0b" },
            { label: "Low", color: "#22c55e" },
          ].map((s) => (
            <div key={s.label} className="flex items-center gap-2">
              <span
                className="w-2 h-2 rounded-full"
                style={{ background: s.color }}
              />
              <span className="text-[10px] font-mono text-gray-400">
                {s.label}
              </span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

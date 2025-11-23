import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "./ui/card";

import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "./ui/chart";

import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Activity, Database, Server, Zap } from "lucide-react";

interface CacheMetrics {
  cacheHits: number;
  cacheMisses: number;
  hitRatio: number;
  memoryUsage: number;
  systemStatus: "online" | "offline" | "degraded";
}

type ChartConfig = Record<
  string,
  {
    label: string;
    color: string;
  }
>;

const chartConfig: ChartConfig = {
  hits: { label: "Cache Hits", color: "#22c55e" },
  misses: { label: "Cache Misses", color: "#ef4444" },
  ratio: { label: "Hit Ratio %", color: "#3b82f6" },
  memory: { label: "Memory Usage", color: "#a855f7" },
};

export default function Dashboard() {
  const [metrics, setMetrics] = useState<CacheMetrics | null>(null);
  const [chartData, setChartData] = useState<any[]>([]);
  const [timeRange, setTimeRange] = useState("1h");
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const res = await fetch("/metric.json?ts=" + Date.now());
        const data = await res.json();

        if (!Array.isArray(data) || data.length === 0) return;

        const latest = data[data.length - 1];

        const hits = latest.hitRatio;
        const misses = latest.missRatio;
        const ratio = latest.hitRatioLifetime;
        const memory = latest.cacheSize;

        setMetrics({
          cacheHits: hits,
          cacheMisses: misses,
          hitRatio: ratio,
          memoryUsage: memory,
          systemStatus:
            ratio > 70 ? "online" : ratio > 40 ? "degraded" : "offline",
        });

        setChartData((prev) => [
          ...prev.slice(-50),
          {
            time: new Date(latest.time).toLocaleTimeString(),
            hits,
            misses,
            ratio,
            memory,
          },
        ]);
      } catch (e) {
        console.error("Failed to load metric.json", e);
      }
    }, 5000); // ← 5 seconds

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-slate-50 to-slate-200 dark:from-slate-900 dark:to-slate-800 p-6">
      <motion.h1
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-3xl font-bold mb-6 text-center text-slate-800 dark:text-white"
      >
        Cachetron Dashboard
      </motion.h1>

      {metrics && (
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <MetricCard
            title="Cache Hits"
            value={metrics.cacheHits}
            icon={<Zap className="text-green-500" />}
          />
          <MetricCard
            title="Cache Misses"
            value={metrics.cacheMisses}
            icon={<Activity className="text-red-500" />}
          />
          <MetricCard
            title="Hit Ratio"
            value={`${metrics.hitRatio}%`}
            icon={<Database className="text-blue-500" />}
          />
          <MetricCard
            title="Memory Usage"
            value={`${metrics.memoryUsage} MB`}
            icon={<Server className="text-purple-500" />}
          />
        </div>
      )}

      {/* Interactive Chart Section */}
      <Card className="pt-0">
        <CardHeader className="flex items-center gap-2 border-b py-5 sm:flex-row">
          <div className="flex-1">
            <CardTitle className="ml-6">Cache Performance Trend</CardTitle>
            <CardDescription className="ml-6 pt-3">
              Cache hits, misses, and ratio trend
            </CardDescription>
          </div>

          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-[150px] rounded-lg">
              <SelectValue placeholder="Time Range" />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="1h">Last 1 hour</SelectItem>
              <SelectItem value="6h">Last 6 hours</SelectItem>
              <SelectItem value="24h">Last 24 hours</SelectItem>
            </SelectContent>
          </Select>
        </CardHeader>

        <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
          <ChartContainer
            config={chartConfig}
            className="aspect-auto h-[350px] w-full"
          >
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="fillHits" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#22c55e" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#22c55e" stopOpacity={0.1} />
                </linearGradient>
                <linearGradient id="fillMisses" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0.1} />
                </linearGradient>
                <linearGradient id="fillRatio" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1} />
                </linearGradient>
              </defs>

              <CartesianGrid
                vertical={false}
                strokeDasharray="3 3"
                strokeOpacity={0.2}
              />
              <XAxis dataKey="time" tick={{ fill: "#94a3b8" }} />
              <YAxis tick={{ fill: "#94a3b8" }} />
              <ChartTooltip
                cursor={false}
                content={
                  <ChartTooltipContent
                    labelFormatter={(value) => `Time: ${value}`}
                    indicator="dot"
                  />
                }
              />
              <Area
                dataKey="hits"
                type="natural"
                fill="url(#fillHits)"
                stroke="#22c55e"
              />
              <Area
                dataKey="misses"
                type="natural"
                fill="url(#fillMisses)"
                stroke="#ef4444"
              />
              <Area
                dataKey="ratio"
                type="natural"
                fill="url(#fillRatio)"
                stroke="#3b82f6"
              />
              <ChartLegend content={<ChartLegendContent />} />
            </AreaChart>
          </ChartContainer>
        </CardContent>
      </Card>
    </div>
  );
}

interface MetricCardProps {
  title: string;
  value: string | number;
  icon?: React.ReactNode;
}

const MetricCard: React.FC<MetricCardProps> = ({ title, value, icon }) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.3 }}
    className="bg-white dark:bg-slate-800 shadow-sm border border-slate-200 dark:border-slate-700 rounded-2xl p-4 flex items-center gap-4 hover:shadow-md transition"
  >
    <div className="p-2 bg-slate-100 dark:bg-slate-700 rounded-xl">{icon}</div>
    <div>
      <div className="text-sm text-slate-500 dark:text-slate-400">{title}</div>
      <div className="text-2xl font-semibold text-slate-900 dark:text-white">
        {value}
      </div>
    </div>
  </motion.div>
);

"use client";

import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";
import useCachetronWS from "@/Hooks/useCachetronWs";
import type { CacheMetric } from "@/Hooks/useCachetronWs";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import CacheMetricsTable from "./Table";

const chartConfig = {
  hitRatio: { label: "Hit Ratio", color: "var(--chart-1)" },
  missRatio: { label: "Miss Ratio", color: "var(--chart-2)" },
  hitRatioLifetime: {
    label: "Hit Ratio (Lifetime)",
    color: "var(--chart-3)",
  },
  missRatioLifetime: {
    label: "Miss Ratio (Lifetime)",
    color: "var(--chart-4)",
  },
} satisfies ChartConfig;

function CacheRatioAreaChart({ isPlayground }: { isPlayground?: boolean }) {
  const chartData: CacheMetric[] = useCachetronWS();

  return (
    <div>
      <Card>
        <CardHeader></CardHeader>

        <CardContent
          className={
            isPlayground
              ? "h-[30vh] overflow-hidden p-0"
              : "h-[70vh] overflow-hidden p-0"
          }
        >
          <ChartContainer config={chartConfig} className="h-full w-full">
            <AreaChart data={chartData}>
              <CartesianGrid vertical={false} />

              <XAxis
                dataKey="time"
                tickFormatter={(v) =>
                  new Date(v).toLocaleTimeString("en-US", {
                    hour12: false,
                    minute: "2-digit",
                    second: "2-digit",
                  })
                }
              />

              <YAxis domain={[0, 1]} tickFormatter={(v) => `${v * 100}%`} />

              <ChartTooltip content={<ChartTooltipContent />} />

              <Area
                dataKey="hitRatio"
                stroke="var(--color-hitRatio)"
                fill="var(--color-hitRatio)"
              />
              <Area
                dataKey="missRatio"
                stroke="var(--color-missRatio)"
                fill="var(--color-missRatio)"
              />
              <Area
                dataKey="hitRatioLifetime"
                stroke="var(--color-hitRatioLifetime)"
                fill="var(--color-hitRatioLifetime)"
                opacity={0.4}
              />
              <Area
                dataKey="missRatioLifetime"
                stroke="var(--color-missRatioLifetime)"
                fill="var(--color-missRatioLifetime)"
                opacity={0.4}
              />

              <ChartLegend content={<ChartLegendContent />} />
            </AreaChart>
          </ChartContainer>
        </CardContent>
      </Card>
      {!isPlayground && <p className="mx-10 mt-20">TABULATED VERSION</p>}
      {!isPlayground && <CacheMetricsTable data={chartData} />}
    </div>
  );
}

export default CacheRatioAreaChart;

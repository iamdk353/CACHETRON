import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";
import useCachetronWS from "@/Hooks/useCachetronWs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";

type CacheMetric = {
  time: string;
  hitRatio: number;
  missRatio: number;
  hitRatioLifetime: number;
  missRatioLifetime: number;
};

const chartData: CacheMetric[] = [
  {
    time: "2025-11-30T13:49:55.929Z",
    hitRatio: 0,
    missRatio: 0,
    hitRatioLifetime: 0.424,
    missRatioLifetime: 0.576,
  },
  {
    time: "2025-11-30T13:50:00.946Z",
    hitRatio: 0,
    missRatio: 0,
    hitRatioLifetime: 0.424,
    missRatioLifetime: 0.576,
  },
  {
    time: "2025-11-30T13:50:05.941Z",
    hitRatio: 0,
    missRatio: 0,
    hitRatioLifetime: 0.424,
    missRatioLifetime: 0.576,
  },
];

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

function CacheRatioAreaChart() {
  useCachetronWS();
  return (
    <Card>
      <CardHeader>
        <CardTitle>Cachetron Control Center</CardTitle>
        <CardDescription>Cache hit / miss ratios</CardDescription>
      </CardHeader>

      <CardContent className="h-[70vh] overflow-hidden p-0">
        <ChartContainer config={chartConfig} className="h-full w-full">
          <AreaChart
            data={chartData}
            margin={{ top: 8, right: 12, bottom: 8, left: 12 }}
          >
            <CartesianGrid vertical={false} />

            <XAxis dataKey="time" tickLine={false} axisLine={false} />

            <YAxis
              domain={[0, 1]}
              tickFormatter={(v) => `${Math.round(v * 100)}%`}
            />

            <ChartTooltip content={<ChartTooltipContent />} />

            <Area
              dataKey="hitRatio"
              fill="var(--color-hitRatio)"
              stroke="var(--color-hitRatio)"
            />
            <Area
              dataKey="missRatio"
              fill="var(--color-missRatio)"
              stroke="var(--color-missRatio)"
            />
            <Area
              dataKey="hitRatioLifetime"
              fill="var(--color-hitRatioLifetime)"
              stroke="var(--color-hitRatioLifetime)"
              opacity={0.4}
            />
            <Area
              dataKey="missRatioLifetime"
              fill="var(--color-missRatioLifetime)"
              stroke="var(--color-missRatioLifetime)"
              opacity={0.4}
            />

            <ChartLegend content={<ChartLegendContent />} />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

export default CacheRatioAreaChart;

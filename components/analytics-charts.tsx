"use client";

import { useEffect, useState } from "react";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

type TrafficData = {
  timeLabel: string;
  pageviews: number;
  visitors: number;
};

export function TrafficChart({ data }: { data: TrafficData[] }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="h-[300px] w-full bg-black/[0.02] dark:bg-white/[0.02] animate-pulse border border-black/5 dark:border-white/5 rounded-sm mt-4" />
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="h-[300px] w-full flex items-center justify-center border border-dashed border-black/10 dark:border-white/10 rounded-sm font-mono text-xs text-zinc-400">
        No traffic data logged for this period.
      </div>
    );
  }

  const chartConfig = {
    pageviews: {
      label: "Pageviews",
      color: "#C85A41",
    },
    visitors: {
      label: "Unique Visitors",
      color: "#71717a",
    },
  };

  return (
    <div className="h-[300px] w-full mt-4">
      <ChartContainer config={chartConfig} className="h-full w-full">
        <AreaChart
          data={data}
          margin={{
            top: 10,
            right: 15,
            left: -20,
            bottom: 0,
          }}
        >
          <defs>
            <linearGradient id="colorPageviews" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#C85A41" stopOpacity={0.2} />
              <stop offset="95%" stopColor="#C85A41" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="colorVisitors" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#71717a" stopOpacity={0.2} />
              <stop offset="95%" stopColor="#71717a" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid 
            strokeDasharray="3 3" 
            vertical={false} 
            className="stroke-black/5 dark:stroke-white/5" 
          />
          <XAxis
            dataKey="timeLabel"
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            className="text-[10px] font-mono fill-zinc-400 dark:fill-zinc-500"
            tickFormatter={(value) => {
              if (value.includes("-")) {
                const parts = value.split("-");
                return `${parts[1]}/${parts[2]}`;
              }
              return value;
            }}
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            className="text-[10px] font-mono fill-zinc-400 dark:fill-zinc-500"
          />
          <ChartTooltip content={<ChartTooltipContent />} />
          <Area
            type="monotone"
            dataKey="pageviews"
            stroke="#C85A41"
            strokeWidth={1.5}
            fillOpacity={1}
            fill="url(#colorPageviews)"
          />
          <Area
            type="monotone"
            dataKey="visitors"
            stroke="#71717a"
            strokeWidth={1.5}
            fillOpacity={1}
            fill="url(#colorVisitors)"
          />
        </AreaChart>
      </ChartContainer>
    </div>
  );
}

type EventBarData = {
  eventName: string;
  count: number;
};

export function EventsBarChart({ data }: { data: EventBarData[] }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="h-[220px] w-full bg-black/[0.02] dark:bg-white/[0.02] animate-pulse border border-black/5 dark:border-white/5 rounded-sm mt-4" />
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="h-[220px] w-full flex items-center justify-center border border-dashed border-black/10 dark:border-white/10 rounded-sm font-mono text-xs text-zinc-400">
        No event data logged for this period.
      </div>
    );
  }

  const chartConfig = {
    count: {
      label: "Trigger Count",
      color: "#C85A41",
    },
  };

  return (
    <div className="h-[220px] w-full mt-4">
      <ChartContainer config={chartConfig} className="h-full w-full">
        <BarChart
          data={data}
          layout="vertical"
          margin={{
            top: 5,
            right: 15,
            left: -10,
            bottom: 5,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" horizontal={false} className="stroke-black/5 dark:stroke-white/5" />
          <XAxis type="number" tickLine={false} axisLine={false} className="text-[10px] font-mono fill-zinc-400" />
          <YAxis
            type="category"
            dataKey="eventName"
            tickLine={false}
            axisLine={false}
            className="text-[10px] font-mono fill-zinc-600 dark:fill-zinc-300"
            width={120}
          />
          <ChartTooltip content={<ChartTooltipContent />} />
          <Bar dataKey="count" fill="#C85A41" radius={[0, 4, 4, 0]} barSize={14} />
        </BarChart>
      </ChartContainer>
    </div>
  );
}

type ReferrerBarData = {
  referrer: string;
  count: number;
};

export function ReferrerBarChart({ data }: { data: ReferrerBarData[] }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="h-[220px] w-full bg-black/[0.02] dark:bg-white/[0.02] animate-pulse border border-black/5 dark:border-white/5 rounded-sm mt-4" />
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="h-[220px] w-full flex items-center justify-center border border-dashed border-black/10 dark:border-white/10 rounded-sm font-mono text-xs text-zinc-400">
        No referrer data logged for this period.
      </div>
    );
  }

  const chartConfig = {
    count: {
      label: "Referrals",
      color: "#71717a",
    },
  };

  return (
    <div className="h-[220px] w-full mt-4">
      <ChartContainer config={chartConfig} className="h-full w-full">
        <BarChart
          data={data}
          layout="vertical"
          margin={{
            top: 5,
            right: 15,
            left: -10,
            bottom: 5,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" horizontal={false} className="stroke-black/5 dark:stroke-white/5" />
          <XAxis type="number" tickLine={false} axisLine={false} className="text-[10px] font-mono fill-zinc-400" />
          <YAxis
            type="category"
            dataKey="referrer"
            tickLine={false}
            axisLine={false}
            className="text-[10px] font-mono fill-zinc-600 dark:fill-zinc-300"
            width={120}
            tickFormatter={(value) => {
              try {
                if (value.startsWith("http")) {
                  return new URL(value).hostname;
                }
              } catch {}
              return value;
            }}
          />
          <ChartTooltip content={<ChartTooltipContent />} />
          <Bar dataKey="count" fill="#71717a" radius={[0, 4, 4, 0]} barSize={14} />
        </BarChart>
      </ChartContainer>
    </div>
  );
}

type CountryBarData = {
  country: string;
  count: number;
};

export function CountryBarChart({ data }: { data: CountryBarData[] }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="h-[220px] w-full bg-black/[0.02] dark:bg-white/[0.02] animate-pulse border border-black/5 dark:border-white/5 rounded-sm mt-4" />
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="h-[220px] w-full flex items-center justify-center border border-dashed border-black/10 dark:border-white/10 rounded-sm font-mono text-xs text-zinc-400">
        No country data logged for this period.
      </div>
    );
  }

  const chartConfig = {
    count: {
      label: "Visitors",
      color: "#C85A41",
    },
  };

  return (
    <div className="h-[220px] w-full mt-4">
      <ChartContainer config={chartConfig} className="h-full w-full">
        <BarChart
          data={data}
          layout="vertical"
          margin={{
            top: 5,
            right: 15,
            left: -10,
            bottom: 5,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" horizontal={false} className="stroke-black/5 dark:stroke-white/5" />
          <XAxis type="number" tickLine={false} axisLine={false} className="text-[10px] font-mono fill-zinc-400" />
          <YAxis
            type="category"
            dataKey="country"
            tickLine={false}
            axisLine={false}
            className="text-[10px] font-mono fill-zinc-600 dark:fill-zinc-300"
            width={120}
          />
          <ChartTooltip content={<ChartTooltipContent />} />
          <Bar dataKey="count" fill="#C85A41" radius={[0, 4, 4, 0]} barSize={14} />
        </BarChart>
      </ChartContainer>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";

export type CacheMetric = {
  time: string;
  hitRatio: number;
  missRatio: number;
  hitRatioLifetime: number;
  missRatioLifetime: number;
};

const MAX_POINTS = 40;

export default function useCachetronWS() {
  const [data, setData] = useState<CacheMetric[]>([]);

  useEffect(() => {
    const ws = new WebSocket("ws://localhost:6789");

    ws.onmessage = (event) => {
      try {
        const parsed: CacheMetric[] = JSON.parse(event.data);
        const incoming = Array.isArray(parsed) ? parsed : [parsed];

        setData((prev) => [...prev, ...incoming].slice(-MAX_POINTS));
      } catch (e) {
        console.error("Invalid WS data", e);
      }
    };

    ws.onerror = (e) => console.error("WS error", e);

    return () => ws.close();
  }, []);

  return data;
}

"use client";

import { useEffect } from "react";

type CacheMetric = {
  time: string;
  hitRatio: number;
  missRatio: number;
  hitRatioLifetime: number;
  missRatioLifetime: number;
};

export default function useCachetronWS() {
  useEffect(() => {
    const ws = new WebSocket("ws://localhost:6789");

    ws.onopen = () => {
      console.log("[Cachetron WS] Connected");
    };

    ws.onmessage = (event) => {
      try {
        const data: CacheMetric[] = JSON.parse(event.data);
        console.log("[Cachetron Metrics]", data);
      } catch (err) {
        console.error("[Cachetron WS] Invalid JSON", err);
      }
    };

    ws.onerror = (err) => {
      console.error("[Cachetron WS] Error", err);
    };

    ws.onclose = () => {
      console.log("[Cachetron WS] Disconnected");
    };

    return () => {
      ws.close();
    };
  }, []);
}

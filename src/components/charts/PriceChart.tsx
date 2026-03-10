"use client";

import { useEffect, useRef, useState } from "react";
import { createChart, type IChartApi, type ISeriesApi, ColorType } from "lightweight-charts";
import { getPoolCandles } from "@/lib/api";
import type { Candle } from "@/types/api";

const INTERVALS = [
  { label: "1m", value: "1m" },
  { label: "5m", value: "5m" },
  { label: "15m", value: "15m" },
  { label: "1h", value: "1h" },
  { label: "4h", value: "4h" },
  { label: "1d", value: "1d" },
];

interface PriceChartProps {
  poolId: number;
  tokenDecimals?: number;
}

export function PriceChart({ poolId, tokenDecimals = 0 }: PriceChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candleSeriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
  const volumeSeriesRef = useRef<ISeriesApi<"Histogram"> | null>(null);
  const [interval, setInterval] = useState("1h");
  const [loading, setLoading] = useState(true);

  // Create chart
  useEffect(() => {
    if (!chartContainerRef.current) return;

    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: "transparent" },
        textColor: "#6b7280",
      },
      grid: {
        vertLines: { color: "#1a2235" },
        horzLines: { color: "#1a2235" },
      },
      width: chartContainerRef.current.clientWidth,
      height: 400,
      crosshair: {
        mode: 0,
      },
      timeScale: {
        borderColor: "#1a2235",
        timeVisible: true,
      },
      rightPriceScale: {
        borderColor: "#1a2235",
      },
    });

    const candleSeries = chart.addCandlestickSeries({
      upColor: "#3db874",
      downColor: "#c94040",
      borderUpColor: "#3db874",
      borderDownColor: "#c94040",
      wickUpColor: "#3db874",
      wickDownColor: "#c94040",
    });

    const volumeSeries = chart.addHistogramSeries({
      color: "#d4a017",
      priceFormat: { type: "volume" },
      priceScaleId: "",
    });

    volumeSeries.priceScale().applyOptions({
      scaleMargins: { top: 0.8, bottom: 0 },
    });

    chartRef.current = chart;
    candleSeriesRef.current = candleSeries;
    volumeSeriesRef.current = volumeSeries;

    // Resize handler
    const handleResize = () => {
      if (chartContainerRef.current) {
        chart.applyOptions({ width: chartContainerRef.current.clientWidth });
      }
    };
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      chart.remove();
    };
  }, []);

  // Load data
  useEffect(() => {
    setLoading(true);
    const now = Date.now();
    const ranges: Record<string, number> = {
      "1m": 3600_000,
      "5m": 6 * 3600_000,
      "15m": 24 * 3600_000,
      "1h": 7 * 86400_000,
      "4h": 30 * 86400_000,
      "1d": 365 * 86400_000,
    };
    const from = now - (ranges[interval] || 7 * 86400_000);

    getPoolCandles(poolId, interval, from, now, 500)
      .then((res) => {
        if (res.ok && res.data && candleSeriesRef.current && volumeSeriesRef.current) {
          // Convert sats/rawToken → NEX/displayToken
          const decFactor = Math.pow(10, tokenDecimals);
          const candleData = res.data.map((c: Candle) => ({
            time: Math.floor(c.openTime / 1000) as any,
            open: c.open / 100 * decFactor,
            high: c.high / 100 * decFactor,
            low: c.low / 100 * decFactor,
            close: c.close / 100 * decFactor,
          }));
          const volumeData = res.data.map((c: Candle) => ({
            time: Math.floor(c.openTime / 1000) as any,
            value: c.volumeNex / 100, // sats to NEX
            color: c.close >= c.open
              ? "rgba(61, 184, 116, 0.25)"
              : "rgba(201, 64, 64, 0.25)",
          }));

          candleSeriesRef.current.setData(candleData);
          volumeSeriesRef.current.setData(volumeData);
          chartRef.current?.timeScale().fitContent();
        }
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  }, [poolId, interval, tokenDecimals]);

  return (
    <div className="space-y-2">
      <div className="flex gap-1">
        {INTERVALS.map((int) => (
          <button
            key={int.value}
            onClick={() => setInterval(int.value)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              interval === int.value
                ? "meow-btn"
                : "meow-input hover:border-[hsla(42,100%,55%,0.2)]"
            }`}
          >
            {int.label}
          </button>
        ))}
      </div>
      <div
        ref={chartContainerRef}
        className="relative rounded-lg border border-border/30"
        style={{ height: 400 }}
      >
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/50">
            <span className="text-sm text-muted-foreground">Loading chart...</span>
          </div>
        )}
      </div>
    </div>
  );
}

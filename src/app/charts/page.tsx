"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { ArrowLeftRight } from "lucide-react";
import { getPools, getPoolStats } from "@/lib/api";
import { formatNex, formatPrice, formatPercent, spotPriceToNex } from "@/lib/utils";
import { useDexStore } from "@/store/dex-store";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import type { Pool, PoolStats } from "@/types/api";

const PriceChart = dynamic(
  () => import("@/components/charts/PriceChart").then((mod) => mod.PriceChart),
  { ssr: false, loading: () => <Skeleton className="h-[400px]" /> }
);

export default function ChartsPage() {
  const { pools, setPools } = useDexStore();
  const [selectedPoolId, setSelectedPoolId] = useState<number | null>(null);
  const [stats, setStats] = useState<PoolStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (pools.length > 0) {
      if (!selectedPoolId) setSelectedPoolId(pools[0].poolId);
      setLoading(false);
      return;
    }
    getPools()
      .then((res) => {
        if (res.ok && res.data) {
          setPools(res.data);
          if (res.data.length > 0) setSelectedPoolId(res.data[0].poolId);
        } else {
          setError(res.error?.message || "Failed to load pools");
        }
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message || "Failed to load pools");
        setLoading(false);
      });
  }, [pools, setPools, selectedPoolId]);

  useEffect(() => {
    if (!selectedPoolId) return;
    setStats(null);
    getPoolStats(selectedPoolId).then((res) => {
      if (res.ok && res.data) setStats(res.data);
    });
  }, [selectedPoolId]);

  const pool = pools.find((p) => p.poolId === selectedPoolId);
  const ticker = pool?.tokenTicker || pool?.tokenGroupIdHex.slice(0, 8) || "—";
  const activePools = pools.filter((p) => p.status === "ACTIVE");

  if (loading) {
    return (
      <div className="container max-w-screen-xl px-4 py-8 space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-[500px]" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="container max-w-screen-xl px-4 py-8">
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      </div>
    );
  }

  if (activePools.length === 0) {
    return (
      <div className="container max-w-screen-xl px-4 py-16 text-center">
        <h2 className="text-xl font-bold">No Active Pools</h2>
        <p className="text-muted-foreground mt-2">Charts will appear once pools are created.</p>
      </div>
    );
  }

  return (
    <div className="container max-w-screen-xl px-4 py-8 space-y-6">
      {/* Header with pool selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold">{ticker} / NEX</h1>
          {pool && (
            <Badge variant={pool.status === "ACTIVE" ? "success" : "warning"}>
              {pool.status}
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          {activePools.length > 1 && (
            <select
              className="rounded-lg border border-input bg-muted/30 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              value={selectedPoolId ?? ""}
              onChange={(e) => setSelectedPoolId(Number(e.target.value))}
            >
              {activePools.map((p) => (
                <option key={p.poolId} value={p.poolId}>
                  {p.tokenTicker || p.tokenGroupIdHex.slice(0, 12)} / NEX
                </option>
              ))}
            </select>
          )}
          <Link href={`/swap?pool=${selectedPoolId}`}>
            <span className="meow-btn px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-1.5">
              <ArrowLeftRight className="h-4 w-4" />
              Trade
            </span>
          </Link>
        </div>
      </div>

      {/* Price stats bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatChip
          label="Price"
          value={pool ? `${formatPrice(spotPriceToNex(pool.spotPrice, pool.tokenDecimals))} NEX` : "—"}
        />
        <StatChip
          label="24h Change"
          value={stats ? formatPercent(stats.priceChange24hPct) : "—"}
          color={stats ? (stats.priceChange24hPct >= 0 ? "text-green-400" : "text-red-400") : undefined}
        />
        <StatChip
          label="24h Volume"
          value={stats ? `${formatNex(stats.volume24hNex)} NEX` : "—"}
        />
        <StatChip
          label="TVL"
          value={pool ? `${formatNex(pool.tvlNexSats)} NEX` : "—"}
        />
      </div>

      {/* Chart */}
      {selectedPoolId && (
        <div className="meow-card rounded-2xl overflow-hidden p-6">
          <PriceChart poolId={selectedPoolId} tokenDecimals={pool?.tokenDecimals} />
        </div>
      )}
    </div>
  );
}

function StatChip({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div className="rounded-xl meow-stat px-4 py-3">
      <p className="text-[11px] text-muted-foreground uppercase tracking-widest font-semibold">{label}</p>
      <p className={`text-lg font-bold font-mono mt-0.5 ${color || ""}`}>{value}</p>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getPools, getPoolStats } from "@/lib/api";
import { formatNex, formatPercent } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { Pool, PoolStats } from "@/types/api";

export default function AnalyticsPage() {
  const [pools, setPools] = useState<Pool[]>([]);
  const [statsMap, setStatsMap] = useState<Record<number, PoolStats>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    getPools()
      .then(async (res) => {
        if (res.ok && res.data) {
          setPools(res.data);
          const statsEntries = await Promise.all(
            res.data.map(async (pool) => {
              const statsRes = await getPoolStats(pool.poolId);
              return [pool.poolId, statsRes.ok ? statsRes.data : null] as const;
            })
          );
          const map: Record<number, PoolStats> = {};
          for (const [id, stats] of statsEntries) {
            if (stats) map[id] = stats;
          }
          setStatsMap(map);
        } else {
          setError(res.error?.message || "Failed to load analytics");
        }
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message || "Failed to load analytics");
        setLoading(false);
      });
  }, []);

  const totalTvl = pools.reduce((sum, p) => sum + p.tvlNexSats, 0);
  const total24hVolume = Object.values(statsMap).reduce(
    (sum, s) => sum + s.volume24hNex,
    0
  );
  const total24hTrades = Object.values(statsMap).reduce(
    (sum, s) => sum + s.tradeCount24h,
    0
  );

  return (
    <div className="container max-w-screen-xl px-4 py-8 space-y-6">
      <h1 className="text-2xl font-bold">Analytics</h1>

      {error && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}

      {/* Summary cards */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <SummaryCard
          label="Total Value Locked"
          value={loading ? undefined : `${formatNex(totalTvl)} NEX`}
        />
        <SummaryCard
          label="24h Volume"
          value={loading ? undefined : `${formatNex(total24hVolume)} NEX`}
        />
        <SummaryCard
          label="24h Trades"
          value={loading ? undefined : String(total24hTrades)}
        />
        <SummaryCard
          label="Active Pools"
          value={
            loading
              ? undefined
              : String(pools.filter((p) => p.status === "ACTIVE").length)
          }
        />
      </div>

      {/* Top pools table */}
      <div className="meow-card rounded-2xl overflow-hidden">
        <div className="px-6 pt-5 pb-3">
          <h2 className="text-base font-bold">Pool Performance</h2>
        </div>
        <div className="px-6 pb-6">
          {loading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : pools.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">No pools available yet.</p>
          ) : (
            <div className="overflow-x-auto -mx-6">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="pl-6">Pool</TableHead>
                    <TableHead className="text-right">TVL</TableHead>
                    <TableHead className="text-right">24h Volume</TableHead>
                    <TableHead className="text-right">24h Trades</TableHead>
                    <TableHead className="text-right">24h Change</TableHead>
                    <TableHead className="text-right pr-6">APY</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pools
                    .sort((a, b) => b.tvlNexSats - a.tvlNexSats)
                    .map((pool) => {
                      const stats = statsMap[pool.poolId];
                      const ticker =
                        pool.tokenTicker || pool.tokenGroupIdHex.slice(0, 8);
                      return (
                        <TableRow key={pool.poolId}>
                          <TableCell className="pl-6">
                            <Link
                              href={`/pools/${pool.poolId}`}
                              className="font-medium hover:text-primary"
                            >
                              {ticker} / NEX
                            </Link>
                          </TableCell>
                          <TableCell className="text-right font-mono">
                            {formatNex(pool.tvlNexSats)} NEX
                          </TableCell>
                          <TableCell className="text-right font-mono">
                            {stats ? formatNex(stats.volume24hNex) + " NEX" : "--"}
                          </TableCell>
                          <TableCell className="text-right font-mono">
                            {stats?.tradeCount24h ?? "--"}
                          </TableCell>
                          <TableCell className="text-right">
                            {stats ? (
                              <span
                                className={
                                  stats.priceChange24hPct >= 0
                                    ? "text-green-400"
                                    : "text-red-400"
                                }
                              >
                                {formatPercent(stats.priceChange24hPct)}
                              </span>
                            ) : (
                              "--"
                            )}
                          </TableCell>
                          <TableCell className="text-right font-mono pr-6">
                            {stats
                              ? `${stats.apyEstimatePct.toFixed(1)}%`
                              : "--"}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function SummaryCard({
  label,
  value,
}: {
  label: string;
  value?: string;
}) {
  return (
    <div className="rounded-xl meow-stat px-5 py-5">
      <p className="text-[11px] text-muted-foreground uppercase tracking-widest font-semibold">{label}</p>
      {value ? (
        <p className="text-2xl font-bold mt-1.5">{value}</p>
      ) : (
        <Skeleton className="h-8 w-32 mt-1.5" />
      )}
    </div>
  );
}

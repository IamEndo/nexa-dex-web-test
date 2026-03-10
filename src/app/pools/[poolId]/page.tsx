"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeftRight, TrendingUp, TrendingDown } from "lucide-react";
import { getPool, getPoolStats, getPoolTrades } from "@/lib/api";
import { formatNex, formatPrice, formatPercent, formatTokenAmount, spotPriceToNex, shortenTxId, timeAgo } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { Pool, PoolStats, Trade } from "@/types/api";

export default function PoolDetailPage() {
  const params = useParams();
  const poolId = Number(params.poolId);
  const [pool, setPool] = useState<Pool | null>(null);
  const [stats, setStats] = useState<PoolStats | null>(null);
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([
      getPool(poolId),
      getPoolStats(poolId),
      getPoolTrades(poolId, 20),
    ])
      .then(([poolRes, statsRes, tradesRes]) => {
        if (poolRes.ok && poolRes.data) setPool(poolRes.data);
        if (statsRes.ok && statsRes.data) setStats(statsRes.data);
        if (tradesRes.ok && tradesRes.data) setTrades(tradesRes.data);
        if (!poolRes.ok) setError(poolRes.error?.message || "Failed to load pool");
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message || "Failed to load pool data");
        setLoading(false);
      });
  }, [poolId]);

  if (loading) {
    return (
      <div className="container max-w-screen-xl px-4 py-8 space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-28" />
          ))}
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  if (error && !pool) {
    return (
      <div className="container max-w-screen-xl px-4 py-16 text-center">
        <h2 className="text-xl font-bold">Error</h2>
        <p className="text-muted-foreground mt-2">{error}</p>
        <Link href="/pools">
          <button className="meow-btn px-4 py-2 rounded-xl text-sm mt-4">Back to Pools</button>
        </Link>
      </div>
    );
  }

  if (!pool) {
    return (
      <div className="container max-w-screen-xl px-4 py-16 text-center">
        <h2 className="text-xl font-bold">Pool not found</h2>
        <p className="text-muted-foreground mt-2">Pool #{poolId} does not exist.</p>
        <Link href="/pools">
          <button className="meow-btn px-4 py-2 rounded-xl text-sm mt-4">Back to Pools</button>
        </Link>
      </div>
    );
  }

  const ticker = pool.tokenTicker || pool.tokenGroupIdHex.slice(0, 8);
  const tokenDec = pool.tokenDecimals ?? 0;

  return (
    <div className="container max-w-screen-xl px-4 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">{ticker} / NEX</h1>
            <Badge variant={pool.status === "ACTIVE" ? "success" : "warning"}>
              {pool.status}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-1 font-mono truncate max-w-lg">
            Pool #{pool.poolId}
          </p>
        </div>
        <div className="flex gap-2">
          <Link href={`/pools/${pool.poolId}/chart`}>
            <button className="meow-input px-3 py-1.5 rounded-lg text-sm font-medium hover:border-[hsla(42,100%,55%,0.2)]">Chart</button>
          </Link>
          <Link href={`/pools/${pool.poolId}/liquidity`}>
            <button className="meow-input px-3 py-1.5 rounded-lg text-sm font-medium hover:border-[hsla(42,100%,55%,0.2)]">Liquidity</button>
          </Link>
          <Link href={`/swap?pool=${pool.poolId}`}>
            <button className="meow-btn px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-1.5">
              <ArrowLeftRight className="h-4 w-4" />
              Trade
            </button>
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Spot Price"
          value={`${formatPrice(spotPriceToNex(pool.spotPrice, tokenDec))} NEX`}
          change={stats ? formatPercent(stats.priceChange24hPct) : undefined}
          positive={stats ? stats.priceChange24hPct >= 0 : true}
        />
        <StatCard
          label="TVL"
          value={`${formatNex(pool.tvlNexSats)} NEX`}
        />
        <StatCard
          label="24h Volume"
          value={stats ? `${formatNex(stats.volume24hNex)} NEX` : "--"}
          sub={stats ? `${stats.tradeCount24h} trades` : undefined}
        />
        <StatCard
          label="APY Estimate"
          value={stats ? `${stats.apyEstimatePct.toFixed(2)}%` : "--"}
        />
      </div>

      {/* Reserves */}
      <div className="meow-card rounded-2xl overflow-hidden">
        <div className="px-6 pt-5 pb-3">
          <h2 className="text-base font-bold">Reserves</h2>
        </div>
        <div className="px-6 pb-6">
          <div className="grid grid-cols-2 gap-8">
            <div>
              <p className="text-sm text-muted-foreground">NEX Reserve</p>
              <p className="text-xl sm:text-2xl font-bold font-mono mt-1">{formatNex(pool.nexReserve)} NEX</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{ticker} Reserve</p>
              <p className="text-xl sm:text-2xl font-bold font-mono mt-1">{formatTokenAmount(pool.tokenReserve, tokenDec)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Trades */}
      <div className="meow-card rounded-2xl overflow-hidden">
        <div className="px-6 pt-5 pb-3">
          <h2 className="text-base font-bold">Recent Trades</h2>
        </div>
        <div className="px-6 pb-6">
          {trades.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">No trades yet.</p>
          ) : (
            <>
              {/* Mobile trade list */}
              <div className="sm:hidden space-y-3">
                {trades.map((trade) => (
                  <MobileTradeRow key={trade.tradeId} trade={trade} ticker={ticker} tokenDec={tokenDec} />
                ))}
              </div>

              {/* Desktop table */}
              <div className="hidden sm:block overflow-x-auto -mx-6">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="pl-6">Direction</TableHead>
                      <TableHead className="text-right">Amount In</TableHead>
                      <TableHead className="text-right">Amount Out</TableHead>
                      <TableHead className="text-right">Price</TableHead>
                      <TableHead className="text-right">TX</TableHead>
                      <TableHead className="text-right">Time</TableHead>
                      <TableHead className="text-center pr-6">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {trades.map((trade) => (
                      <TableRow key={trade.tradeId} className="hover:bg-muted/30">
                        <TableCell className="pl-6">
                          <span className={trade.direction === "BUY" ? "text-green-400" : "text-red-400"}>
                            {trade.direction === "BUY" ? (
                              <TrendingUp className="inline h-4 w-4 mr-1" />
                            ) : (
                              <TrendingDown className="inline h-4 w-4 mr-1" />
                            )}
                            {trade.direction}
                          </span>
                        </TableCell>
                        <TableCell className="text-right font-mono">
                          {trade.direction === "SELL"
                            ? formatTokenAmount(trade.amountIn, tokenDec) + ` ${ticker}`
                            : formatNex(trade.amountIn) + " NEX"}
                        </TableCell>
                        <TableCell className="text-right font-mono">
                          {trade.direction === "BUY"
                            ? formatTokenAmount(trade.amountOut, tokenDec) + ` ${ticker}`
                            : formatNex(trade.amountOut) + " NEX"}
                        </TableCell>
                        <TableCell className="text-right font-mono">
                          {formatPrice(spotPriceToNex(trade.price, tokenDec))} NEX
                        </TableCell>
                        <TableCell className="text-right font-mono text-xs">
                          {trade.txId ? (
                            <a
                              href={`https://explorer.nexa.org/tx/${trade.txId}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="hover:text-primary transition-colors"
                            >
                              {shortenTxId(trade.txId)}
                            </a>
                          ) : "--"}
                        </TableCell>
                        <TableCell className="text-right text-xs text-muted-foreground">
                          {timeAgo(trade.createdAt)}
                        </TableCell>
                        <TableCell className="text-center pr-6">
                          <Badge
                            variant={
                              trade.status === "CONFIRMED"
                                ? "success"
                                : trade.status === "FAILED"
                                ? "destructive"
                                : "secondary"
                            }
                          >
                            {trade.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function MobileTradeRow({ trade, ticker, tokenDec = 0 }: { trade: Trade; ticker: string; tokenDec?: number }) {
  const isBuy = trade.direction === "BUY";
  return (
    <div className="rounded-lg border border-border/50 p-3">
      <div className="flex items-center justify-between mb-2">
        <span className={isBuy ? "text-green-400 font-medium" : "text-red-400 font-medium"}>
          {isBuy ? <TrendingUp className="inline h-3.5 w-3.5 mr-1" /> : <TrendingDown className="inline h-3.5 w-3.5 mr-1" />}
          {trade.direction}
        </span>
        <Badge
          variant={trade.status === "CONFIRMED" ? "success" : trade.status === "FAILED" ? "destructive" : "secondary"}
          className="text-[10px]"
        >
          {trade.status}
        </Badge>
      </div>
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div>
          <span className="text-muted-foreground">In: </span>
          <span className="font-mono">
            {isBuy ? formatNex(trade.amountIn) + " NEX" : formatTokenAmount(trade.amountIn, tokenDec) + ` ${ticker}`}
          </span>
        </div>
        <div>
          <span className="text-muted-foreground">Out: </span>
          <span className="font-mono">
            {isBuy ? formatTokenAmount(trade.amountOut, tokenDec) + ` ${ticker}` : formatNex(trade.amountOut) + " NEX"}
          </span>
        </div>
      </div>
      <div className="text-[10px] text-muted-foreground mt-1.5">
        {timeAgo(trade.createdAt)}
        {trade.txId && <span className="ml-2 font-mono">{shortenTxId(trade.txId, 6)}</span>}
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  change,
  positive,
  sub,
}: {
  label: string;
  value: string;
  change?: string;
  positive?: boolean;
  sub?: string;
}) {
  return (
    <div className="rounded-xl meow-stat px-4 py-4">
      <p className="text-[11px] text-muted-foreground uppercase tracking-widest font-semibold">{label}</p>
      <p className="text-lg sm:text-xl font-bold mt-1">{value}</p>
      {change && (
        <p className={`text-sm mt-1 ${positive ? "text-[hsl(var(--success))]" : "text-red-400"}`}>
          {change}
        </p>
      )}
      {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
    </div>
  );
}

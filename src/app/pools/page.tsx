"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getPools } from "@/lib/api";
import { formatNex, formatPrice, formatTokenAmount, spotPriceToNex } from "@/lib/utils";
import { useDexStore } from "@/store/dex-store";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Droplets, Plus } from "lucide-react";
import type { Pool } from "@/types/api";

export default function PoolsPage() {
  const { pools, setPools } = useDexStore();
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sortField, setSortField] = useState<"tvl" | "price" | "ticker">("tvl");
  const [sortAsc, setSortAsc] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    getPools()
      .then((res) => {
        if (res.ok && res.data) {
          setPools(res.data);
        } else {
          setError(res.error?.message || "Failed to load pools");
        }
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message || "Failed to load pools");
        setLoading(false);
      });
  }, [setPools]);

  const filteredPools = pools
    .filter((p) => p.status === "ACTIVE")
    .filter((p) => {
      if (!search) return true;
      const q = search.toLowerCase();
      return (
        p.tokenTicker?.toLowerCase().includes(q) ||
        p.tokenGroupIdHex.toLowerCase().includes(q) ||
        String(p.poolId).includes(q)
      );
    })
    .sort((a, b) => {
      let cmp = 0;
      switch (sortField) {
        case "tvl":
          cmp = a.tvlNexSats - b.tvlNexSats;
          break;
        case "price":
          cmp = a.spotPrice - b.spotPrice;
          break;
        case "ticker":
          cmp = (a.tokenTicker || "").localeCompare(b.tokenTicker || "");
          break;
      }
      return sortAsc ? cmp : -cmp;
    });

  const activePools = pools.filter((p) => p.status === "ACTIVE");
  const totalTvl = activePools.reduce((sum, p) => sum + p.tvlNexSats, 0);

  function handleSort(field: typeof sortField) {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(false);
    }
  }

  return (
    <div className="container max-w-screen-xl px-4 py-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Liquidity Pools</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {activePools.length} pools — Total TVL: {formatNex(totalTvl)} NEX
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Input
            placeholder="Search by ticker or ID..."
            className="max-w-xs"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <Link
            href="/pools/create"
            className="meow-btn px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-1.5 shrink-0"
          >
            <Plus className="h-4 w-4" />
            Create Pool
          </Link>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}

      {loading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-14 w-full" />
          ))}
        </div>
      ) : filteredPools.length === 0 ? (
        <div className="meow-card rounded-2xl overflow-hidden">
          <div className="px-6 py-12 text-center text-muted-foreground">
            {search ? "No pools match your search." : "No pools available yet."}
          </div>
        </div>
      ) : (
        <>
          {/* Mobile cards */}
          <div className="sm:hidden space-y-3">
            {filteredPools.map((pool) => (
              <MobilePoolCard key={pool.poolId} pool={pool} />
            ))}
          </div>

          {/* Desktop table */}
          <div className="hidden sm:block meow-card rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-16">#</TableHead>
                    <TableHead
                      className="cursor-pointer hover:text-foreground select-none"
                      onClick={() => handleSort("ticker")}
                    >
                      Token {sortField === "ticker" && (sortAsc ? "↑" : "↓")}
                    </TableHead>
                    <TableHead
                      className="text-right cursor-pointer hover:text-foreground select-none"
                      onClick={() => handleSort("price")}
                    >
                      Price {sortField === "price" && (sortAsc ? "↑" : "↓")}
                    </TableHead>
                    <TableHead
                      className="text-right cursor-pointer hover:text-foreground select-none"
                      onClick={() => handleSort("tvl")}
                    >
                      TVL {sortField === "tvl" && (sortAsc ? "↑" : "↓")}
                    </TableHead>
                    <TableHead className="text-right">NEX Reserve</TableHead>
                    <TableHead className="text-right">Token Reserve</TableHead>
                    <TableHead className="text-center">Status</TableHead>
                    <TableHead className="text-center">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPools.map((pool) => (
                    <PoolRow key={pool.poolId} pool={pool} />
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function PoolRow({ pool }: { pool: Pool }) {
  return (
    <TableRow className="hover:bg-muted/30">
      <TableCell className="font-mono text-muted-foreground">{pool.poolId}</TableCell>
      <TableCell>
        <Link
          href={`/pools/${pool.poolId}`}
          className="font-medium hover:text-primary transition-colors"
        >
          {pool.tokenTicker || pool.tokenGroupIdHex.slice(0, 12) + "..."}
          <span className="text-muted-foreground font-normal"> / NEX</span>
        </Link>
      </TableCell>
      <TableCell className="text-right font-mono">
        {formatPrice(spotPriceToNex(pool.spotPrice, pool.tokenDecimals))} NEX
      </TableCell>
      <TableCell className="text-right font-mono">
        {formatNex(pool.tvlNexSats)} NEX
      </TableCell>
      <TableCell className="text-right font-mono">
        {formatNex(pool.nexReserve)}
      </TableCell>
      <TableCell className="text-right font-mono">
        {formatTokenAmount(pool.tokenReserve, pool.tokenDecimals)}
      </TableCell>
      <TableCell className="text-center">
        <Badge variant={pool.status === "ACTIVE" ? "success" : "warning"}>
          {pool.status}
        </Badge>
      </TableCell>
      <TableCell className="text-center">
        <div className="flex items-center justify-center gap-1.5">
          <Link
            href={`/swap?pool=${pool.poolId}`}
            className="text-[11px] px-2 py-1 rounded-md bg-primary/10 text-primary hover:bg-primary/20 transition-colors font-medium"
          >
            Swap
          </Link>
          <Link
            href={`/pools/${pool.poolId}/liquidity`}
            className="text-[11px] px-2 py-1 rounded-md bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 transition-colors font-medium flex items-center gap-0.5"
          >
            <Droplets className="h-3 w-3" />
            LP
          </Link>
        </div>
      </TableCell>
    </TableRow>
  );
}

function MobilePoolCard({ pool }: { pool: Pool }) {
  const ticker = pool.tokenTicker || pool.tokenGroupIdHex.slice(0, 8);
  return (
    <div className="meow-card rounded-xl p-4">
        <Link href={`/pools/${pool.poolId}`}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="font-medium text-lg">{ticker} / NEX</span>
              <Badge variant={pool.status === "ACTIVE" ? "success" : "warning"} className="text-[10px]">
                {pool.status}
              </Badge>
            </div>
            <span className="text-sm font-mono text-muted-foreground">#{pool.poolId}</span>
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <span className="text-xs text-muted-foreground">Price</span>
              <p className="font-mono">{formatPrice(spotPriceToNex(pool.spotPrice, pool.tokenDecimals))} NEX</p>
            </div>
            <div>
              <span className="text-xs text-muted-foreground">TVL</span>
              <p className="font-mono">{formatNex(pool.tvlNexSats)} NEX</p>
            </div>
          </div>
        </Link>
        <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border/30">
          <Link
            href={`/swap?pool=${pool.poolId}`}
            className="flex-1 text-center text-xs py-1.5 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors font-medium"
          >
            Swap
          </Link>
          <Link
            href={`/pools/${pool.poolId}/liquidity`}
            className="flex-1 text-center text-xs py-1.5 rounded-lg bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 transition-colors font-medium flex items-center justify-center gap-1"
          >
            <Droplets className="h-3 w-3" />
            Liquidity
          </Link>
        </div>
    </div>
  );
}

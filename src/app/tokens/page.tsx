"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getTokens, getPools } from "@/lib/api";
import { formatNex, formatPrice, spotPriceToNex } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { Token, Pool } from "@/types/api";

export default function TokensPage() {
  const [tokens, setTokens] = useState<Token[]>([]);
  const [pools, setPools] = useState<Pool[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([getTokens(), getPools()])
      .then(([tokenRes, poolRes]) => {
        if (tokenRes.ok && tokenRes.data) {
          setTokens(tokenRes.data);
        } else {
          setError(tokenRes.error?.message || "Failed to load tokens");
        }
        if (poolRes.ok && poolRes.data) setPools(poolRes.data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message || "Failed to load data");
        setLoading(false);
      });
  }, []);

  const poolByToken = new Map(pools.map((p) => [p.tokenGroupIdHex, p]));

  const filtered = tokens.filter((t) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      t.ticker.toLowerCase().includes(q) ||
      t.name.toLowerCase().includes(q) ||
      t.groupIdHex.toLowerCase().includes(q)
    );
  });

  return (
    <div className="container max-w-screen-xl px-4 py-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Tokens</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {tokens.length} tokens registered
          </p>
        </div>
        <Input
          placeholder="Search..."
          className="max-w-xs"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
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
      ) : filtered.length === 0 ? (
        <div className="meow-card rounded-2xl overflow-hidden">
          <div className="px-6 py-12 text-center text-muted-foreground">
            {search ? "No tokens match your search." : "No tokens registered yet."}
          </div>
        </div>
      ) : (
        <>
          {/* Mobile cards */}
          <div className="sm:hidden space-y-3">
            {filtered.map((token) => {
              const pool = poolByToken.get(token.groupIdHex);
              return (
                <div key={token.groupIdHex} className="meow-card rounded-xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-lg">
                      {pool ? (
                        <Link href={`/pools/${pool.poolId}`} className="hover:text-primary">
                          {token.ticker}
                        </Link>
                      ) : (
                        token.ticker
                      )}
                    </span>
                    <span className="text-xs text-muted-foreground">{token.decimals} decimals</span>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">{token.name}</p>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="text-xs text-muted-foreground">Price</span>
                      <p className="font-mono">{pool ? formatPrice(spotPriceToNex(pool.spotPrice, pool.tokenDecimals)) + " NEX" : "--"}</p>
                    </div>
                    <div>
                      <span className="text-xs text-muted-foreground">TVL</span>
                      <p className="font-mono">{pool ? formatNex(pool.tvlNexSats) + " NEX" : "--"}</p>
                    </div>
                  </div>
                  <p className="text-[10px] font-mono text-muted-foreground mt-2 truncate">
                    {token.groupIdHex}
                  </p>
                </div>
              );
            })}
          </div>

          {/* Desktop table */}
          <div className="hidden sm:block meow-card rounded-2xl overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ticker</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead className="text-right">Decimals</TableHead>
                  <TableHead className="text-right">Pool Price</TableHead>
                  <TableHead className="text-right">Pool TVL</TableHead>
                  <TableHead>Group ID</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((token) => {
                  const pool = poolByToken.get(token.groupIdHex);
                  return (
                    <TableRow key={token.groupIdHex}>
                      <TableCell className="font-medium">
                        {pool ? (
                          <Link
                            href={`/pools/${pool.poolId}`}
                            className="hover:text-primary"
                          >
                            {token.ticker}
                          </Link>
                        ) : (
                          token.ticker
                        )}
                      </TableCell>
                      <TableCell>{token.name}</TableCell>
                      <TableCell className="text-right">{token.decimals}</TableCell>
                      <TableCell className="text-right font-mono">
                        {pool ? formatPrice(spotPriceToNex(pool.spotPrice, pool.tokenDecimals)) + " NEX" : "--"}
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {pool ? formatNex(pool.tvlNexSats) + " NEX" : "--"}
                      </TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground">
                        {token.groupIdHex.slice(0, 16)}...
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </>
      )}
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import dynamic from "next/dynamic";
import { ArrowLeftRight } from "lucide-react";
import { getPool } from "@/lib/api";
import { Skeleton } from "@/components/ui/skeleton";
import type { Pool } from "@/types/api";

const PriceChart = dynamic(
  () => import("@/components/charts/PriceChart").then((mod) => mod.PriceChart),
  { ssr: false, loading: () => <Skeleton className="h-[400px]" /> }
);

export default function PoolChartPage() {
  const params = useParams();
  const poolId = Number(params.poolId);
  const [pool, setPool] = useState<Pool | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    getPool(poolId)
      .then((res) => {
        if (res.ok && res.data) setPool(res.data);
        else setError(res.error?.message || "Failed to load pool");
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message || "Failed to load pool");
        setLoading(false);
      });
  }, [poolId]);

  if (loading) {
    return (
      <div className="container max-w-screen-xl px-4 py-8">
        <Skeleton className="h-[500px]" />
      </div>
    );
  }

  if (error || !pool) {
    return (
      <div className="container max-w-screen-xl px-4 py-16 text-center">
        <h2 className="text-xl font-bold">{error ? "Error" : "Pool not found"}</h2>
        {error && <p className="text-muted-foreground mt-2">{error}</p>}
        <Link href="/pools">
          <button className="meow-btn px-4 py-2 rounded-xl text-sm mt-4">Back to Pools</button>
        </Link>
      </div>
    );
  }

  const ticker = pool.tokenTicker || pool.tokenGroupIdHex.slice(0, 8);

  return (
    <div className="container max-w-screen-xl px-4 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{ticker} / NEX — Chart</h1>
        <div className="flex gap-2">
          <Link href={`/pools/${poolId}`}>
            <span className="meow-input px-3 py-1.5 rounded-lg text-sm font-medium hover:border-[hsla(42,100%,55%,0.2)] cursor-pointer">Pool Detail</span>
          </Link>
          <Link href={`/swap?pool=${poolId}`}>
            <span className="meow-btn px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-1.5 cursor-pointer">
              <ArrowLeftRight className="h-4 w-4" />
              Trade
            </span>
          </Link>
        </div>
      </div>

      <div className="meow-card rounded-2xl overflow-hidden p-6">
        <PriceChart poolId={poolId} tokenDecimals={pool.tokenDecimals} />
      </div>
    </div>
  );
}

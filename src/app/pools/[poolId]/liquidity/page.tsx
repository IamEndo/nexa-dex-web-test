"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Loader2, Plus, Minus, CheckCircle, AlertTriangle, Info } from "lucide-react";
import { getPool, getV2PoolState, getLiquidityQuote, addLiquidity, removeLiquidity } from "@/lib/api";
import { formatNex, nexToSats, formatTokenAmount, tokenToRaw, rawToToken } from "@/lib/utils";
import { useDexStore } from "@/store/dex-store";
import { Input } from "@/components/ui/input";
import type { Pool, V2PoolState, LiquidityResponse, LiquidityQuoteResponse } from "@/types/api";

type Tab = "add" | "remove";

export default function LiquidityPage() {
  const params = useParams();
  const poolId = Number(params.poolId);
  const { mnemonic } = useDexStore();

  const [pool, setPool] = useState<Pool | null>(null);
  const [poolState, setPoolState] = useState<V2PoolState | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>("add");

  // Add LP state
  const [nexInput, setNexInput] = useState("");
  const [tokenInput, setTokenInput] = useState("");

  // Remove LP state
  const [lpInput, setLpInput] = useState("");

  // Quote preview
  const [quote, setQuote] = useState<LiquidityQuoteResponse | null>(null);
  const [quoteLoading, setQuoteLoading] = useState(false);

  // Shared state
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<LiquidityResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadPoolData = useCallback(async () => {
    try {
      const [poolRes, stateRes] = await Promise.all([
        getPool(poolId),
        getV2PoolState(poolId),
      ]);
      if (poolRes.ok && poolRes.data) setPool(poolRes.data);
      if (stateRes.ok && stateRes.data) setPoolState(stateRes.data);
    } catch {
      setError("Failed to load pool data");
    }
    setLoading(false);
  }, [poolId]);

  useEffect(() => {
    loadPoolData();
  }, [loadPoolData]);

  // Auto-calculate token amount when NEX input changes (proportional to pool ratio)
  useEffect(() => {
    if (tab !== "add" || !pool || !nexInput) {
      if (tab === "add") setTokenInput("");
      return;
    }
    const nexSats = nexToSats(parseFloat(nexInput));
    if (isNaN(nexSats) || nexSats <= 0 || pool.nexReserve === 0) return;
    const proportionalTokensRaw = Math.ceil(
      (nexSats * pool.tokenReserve) / pool.nexReserve
    );
    // Show human-readable amount in input (e.g., "10" for 10 tokens, not "1000" raw)
    const displayAmount = rawToToken(proportionalTokensRaw, pool.tokenDecimals ?? 0);
    setTokenInput(String(displayAmount));
  }, [nexInput, pool, tab]);

  // Fetch LP quote when inputs change
  useEffect(() => {
    const timer = setTimeout(async () => {
      const tokenDec = pool?.tokenDecimals ?? 0;
      if (tab === "add" && nexInput && tokenInput) {
        const nexSats = nexToSats(parseFloat(nexInput));
        const tokenAmount = tokenToRaw(parseFloat(tokenInput), tokenDec);
        if (isNaN(nexSats) || nexSats <= 0 || isNaN(tokenAmount) || tokenAmount <= 0) return;

        setQuoteLoading(true);
        const res = await getLiquidityQuote(poolId, "ADD", { nexSats, tokenAmount });
        if (res.ok && res.data) setQuote(res.data);
        setQuoteLoading(false);
      } else if (tab === "remove" && lpInput) {
        const lpAmount = parseInt(lpInput, 10);
        if (isNaN(lpAmount) || lpAmount <= 0) return;

        setQuoteLoading(true);
        const res = await getLiquidityQuote(poolId, "REMOVE", { lpTokenAmount: lpAmount });
        if (res.ok && res.data) setQuote(res.data);
        setQuoteLoading(false);
      } else {
        setQuote(null);
      }
    }, 300); // debounce

    return () => clearTimeout(timer);
  }, [nexInput, tokenInput, lpInput, tab, poolId, pool]);

  function resetForm() {
    setNexInput("");
    setTokenInput("");
    setLpInput("");
    setError(null);
    setResult(null);
    setQuote(null);
  }

  function switchTab(t: Tab) {
    setTab(t);
    resetForm();
  }

  async function handleAdd() {
    if (!pool || !nexInput || !tokenInput || !mnemonic) return;

    const nexSats = nexToSats(parseFloat(nexInput));
    const tokenAmount = tokenToRaw(parseFloat(tokenInput), pool.tokenDecimals ?? 0);
    if (isNaN(nexSats) || nexSats <= 0 || isNaN(tokenAmount) || tokenAmount <= 0) {
      setError("Invalid amounts");
      return;
    }

    setSubmitting(true);
    setError(null);
    setResult(null);

    try {
      const res = await addLiquidity({
        poolId: pool.poolId,
        nexSats,
        tokenAmount,
        mnemonic,
      });

      if (res.ok && res.data) {
        setResult(res.data);
        setNexInput("");
        setTokenInput("");
        setQuote(null);
        await loadPoolData();
      } else if (res.error) {
        setError(res.error.message);
      }
    } catch {
      setError("Network error adding liquidity");
    }
    setSubmitting(false);
  }

  async function handleRemove() {
    if (!pool || !lpInput || !mnemonic) return;

    const lpAmount = parseInt(lpInput, 10);
    if (isNaN(lpAmount) || lpAmount <= 0) {
      setError("Invalid LP token amount");
      return;
    }

    setSubmitting(true);
    setError(null);
    setResult(null);

    try {
      const res = await removeLiquidity({
        poolId: pool.poolId,
        lpTokenAmount: lpAmount,
        mnemonic,
      });

      if (res.ok && res.data) {
        setResult(res.data);
        setLpInput("");
        setQuote(null);
        await loadPoolData();
      } else if (res.error) {
        setError(res.error.message);
      }
    } catch {
      setError("Network error removing liquidity");
    }
    setSubmitting(false);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!pool) {
    return (
      <div className="flex items-center justify-center py-20 text-center">
        <div>
          <h2 className="text-xl font-bold">Pool not found</h2>
          <Link href="/pools" className="meow-btn inline-block mt-4 px-4 py-2 rounded-xl text-sm">
            Back to Pools
          </Link>
        </div>
      </div>
    );
  }

  if (pool.status !== "ACTIVE") {
    return (
      <div className="flex items-center justify-center py-20 text-center">
        <div>
          <h2 className="text-xl font-bold">Pool is {pool.status}</h2>
          <p className="text-sm text-muted-foreground mt-2">This pool is no longer active and cannot accept liquidity.</p>
          <Link href="/pools" className="meow-btn inline-block mt-4 px-4 py-2 rounded-xl text-sm">
            Back to Pools
          </Link>
        </div>
      </div>
    );
  }

  const ticker = pool.tokenTicker || "TOKEN";
  const tokenDec = pool.tokenDecimals ?? 0;
  const hasMnemonic = mnemonic.trim().split(/\s+/).length >= 12;
  const lpInCirculation = poolState?.lpInCirculation ?? 0;
  const lpReserveBalance = poolState?.lpReserveBalance ?? 0;
  const initialLpSupply = poolState?.initialLpSupply ?? 0;

  return (
    <div className="flex items-start justify-center px-4 py-6 sm:py-10">
      <div className="w-full max-w-[480px] space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold">{ticker} / NEX Liquidity</h1>
            <p className="text-xs text-muted-foreground mt-0.5">Pool #{pool.poolId}</p>
          </div>
          <Link href={`/swap?pool=${pool.poolId}`}>
            <span className="meow-badge text-[11px] px-2.5 py-1 rounded-full font-medium cursor-pointer hover:opacity-80">
              Swap
            </span>
          </Link>
        </div>

        {/* Pool reserves + LP stats */}
        <div className="meow-card rounded-2xl p-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
            <div>
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest">NEX Reserve</p>
              <p className="font-bold font-mono text-sm mt-1">{formatNex(pool.nexReserve)}</p>
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest">{ticker} Reserve</p>
              <p className="font-bold font-mono text-sm mt-1">{formatTokenAmount(pool.tokenReserve, tokenDec)}</p>
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest">LP in Circ.</p>
              <p className="font-bold font-mono text-sm mt-1">{lpInCirculation.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest">LP Reserve</p>
              <p className="font-bold font-mono text-sm mt-1">{lpReserveBalance.toLocaleString()}</p>
            </div>
          </div>
          {initialLpSupply > 0 && (
            <div className="mt-3 pt-3 border-t border-[hsla(224,25%,25%,0.3)]">
              <div className="flex justify-between text-[11px] text-muted-foreground">
                <span>Total LP Supply: {initialLpSupply.toLocaleString()}</span>
                <span>TVL: {formatNex(pool.tvlNexSats)} NEX</span>
              </div>
            </div>
          )}
        </div>

        {/* Main card */}
        <div className="meow-card rounded-2xl overflow-hidden">
          {/* Tab selector */}
          <div className="flex border-b border-[hsla(224,25%,25%,0.5)]">
            <button
              className={`flex-1 py-3 text-sm font-semibold transition-colors flex items-center justify-center gap-1.5 ${
                tab === "add"
                  ? "text-primary border-b-2 border-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              onClick={() => switchTab("add")}
            >
              <Plus className="h-3.5 w-3.5" />
              Add Liquidity
            </button>
            <button
              className={`flex-1 py-3 text-sm font-semibold transition-colors flex items-center justify-center gap-1.5 ${
                tab === "remove"
                  ? "text-primary border-b-2 border-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              onClick={() => switchTab("remove")}
            >
              <Minus className="h-3.5 w-3.5" />
              Remove Liquidity
            </button>
          </div>

          <div className="px-6 py-5 space-y-3">
            {tab === "add" ? (
              <>
                {/* NEX input */}
                <div className="rounded-xl meow-input p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">NEX Amount</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Input
                      type="number"
                      placeholder="0"
                      className="text-2xl font-mono bg-transparent border-0 p-0 h-auto focus-visible:ring-0 placeholder:text-muted-foreground/30 flex-1"
                      value={nexInput}
                      disabled={submitting}
                      onChange={(e) => {
                        setNexInput(e.target.value);
                        setError(null);
                        setResult(null);
                      }}
                    />
                    <span className="text-sm font-bold text-muted-foreground shrink-0">NEX</span>
                  </div>
                </div>

                {/* Token input (auto-calculated) */}
                <div className="rounded-xl meow-input p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">{ticker} Amount</span>
                    <span className="text-[10px] text-muted-foreground">Auto-calculated (proportional)</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Input
                      type="number"
                      placeholder="0"
                      className="text-2xl font-mono bg-transparent border-0 p-0 h-auto focus-visible:ring-0 placeholder:text-muted-foreground/30 flex-1"
                      value={tokenInput}
                      disabled={submitting}
                      onChange={(e) => {
                        setTokenInput(e.target.value);
                        setError(null);
                        setResult(null);
                      }}
                    />
                    <span className="text-sm font-bold text-muted-foreground shrink-0">{ticker}</span>
                  </div>
                </div>

                {/* Quote preview */}
                {(quote || quoteLoading) && tab === "add" && (
                  <div className="rounded-xl bg-[hsla(224,25%,13%,0.4)] p-3.5 space-y-1.5 text-[13px]">
                    {quoteLoading ? (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        <span>Calculating...</span>
                      </div>
                    ) : quote ? (
                      <>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">LP tokens you&apos;ll receive</span>
                          <span className="font-mono font-semibold text-primary">
                            {quote.lpTokenAmount.toLocaleString()}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Pool share after</span>
                          <span className="font-mono text-foreground/80">
                            {quote.lpInCirculation > 0
                              ? ((quote.lpTokenAmount / (quote.lpInCirculation + quote.lpTokenAmount)) * 100).toFixed(2)
                              : "100.00"
                            }%
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">NEX to deposit</span>
                          <span className="font-mono text-foreground/80">{formatNex(quote.nexAmount)} NEX</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">{ticker} to deposit</span>
                          <span className="font-mono text-foreground/80">
                            {formatTokenAmount(quote.tokenAmount, tokenDec)} {ticker}
                          </span>
                        </div>
                      </>
                    ) : null}
                  </div>
                )}
              </>
            ) : (
              <>
                {/* LP token input */}
                <div className="rounded-xl meow-input p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">LP Tokens to Return</span>
                    {lpInCirculation > 0 && (
                      <span className="text-[10px] text-muted-foreground">
                        In circulation: {lpInCirculation.toLocaleString()}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <Input
                      type="number"
                      placeholder="0"
                      className="text-2xl font-mono bg-transparent border-0 p-0 h-auto focus-visible:ring-0 placeholder:text-muted-foreground/30 flex-1"
                      value={lpInput}
                      disabled={submitting}
                      onChange={(e) => {
                        setLpInput(e.target.value);
                        setError(null);
                        setResult(null);
                      }}
                    />
                    <span className="text-sm font-bold text-muted-foreground shrink-0">LP</span>
                  </div>
                </div>

                {/* Remove quote preview */}
                {(quote || quoteLoading) && tab === "remove" && (
                  <div className="rounded-xl bg-[hsla(224,25%,13%,0.4)] p-3.5 space-y-1.5 text-[13px]">
                    {quoteLoading ? (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        <span>Calculating withdrawal...</span>
                      </div>
                    ) : quote ? (
                      <>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">NEX you&apos;ll receive</span>
                          <span className="font-mono font-semibold text-primary">
                            {formatNex(quote.nexAmount)} NEX
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">{ticker} you&apos;ll receive</span>
                          <span className="font-mono font-semibold text-primary">
                            {formatTokenAmount(quote.tokenAmount, tokenDec)} {ticker}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">LP tokens to return</span>
                          <span className="font-mono text-foreground/80">{quote.lpTokenAmount.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Share of pool</span>
                          <span className="font-mono text-foreground/80">
                            {quote.lpInCirculation > 0
                              ? ((quote.lpTokenAmount / quote.lpInCirculation) * 100).toFixed(2)
                              : "0"
                            }%
                          </span>
                        </div>
                      </>
                    ) : null}
                  </div>
                )}
              </>
            )}

            {/* Wallet warning */}
            {!hasMnemonic && (
              <div className="rounded-xl border border-[hsla(42,100%,55%,0.2)] bg-[hsla(42,100%,55%,0.05)] p-3.5 text-sm">
                <p className="font-semibold text-primary text-[13px]">Wallet Required</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Enter your 12-word mnemonic in Settings to manage liquidity.
                </p>
              </div>
            )}

            {/* Success */}
            {result && (
              <div className="rounded-xl border border-[hsla(152,60%,42%,0.3)] bg-[hsla(152,60%,42%,0.06)] p-3.5 text-sm">
                <div className="flex items-center gap-2 mb-1">
                  <CheckCircle className="h-4 w-4 text-[hsl(var(--success))]" />
                  <span className="font-semibold text-[hsl(var(--success))]">
                    {result.action === "ADD" ? "Liquidity Added" : "Liquidity Removed"}
                  </span>
                </div>
                <div className="text-xs text-muted-foreground space-y-0.5">
                  <p>{formatNex(result.nexAmount)} NEX {result.action === "ADD" ? "deposited" : "received"}</p>
                  <p>{formatTokenAmount(result.tokenAmount, tokenDec)} {ticker} {result.action === "ADD" ? "deposited" : "received"}</p>
                  <p>{result.lpTokenAmount.toLocaleString()} LP tokens {result.action === "ADD" ? "received" : "returned"}</p>
                </div>
                <p className="text-[11px] text-muted-foreground/70 mt-1.5 font-mono break-all">
                  TX: {result.txId}
                </p>
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="rounded-xl border border-[hsla(0,72%,45%,0.3)] bg-[hsla(0,72%,45%,0.06)] p-3.5 text-sm text-red-400 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                {error}
              </div>
            )}

            {/* Action button */}
            <button
              className="meow-btn w-full h-12 text-[15px] rounded-xl"
              disabled={
                submitting ||
                !hasMnemonic ||
                (tab === "add" ? !nexInput || !tokenInput : !lpInput)
              }
              onClick={tab === "add" ? handleAdd : handleRemove}
            >
              {submitting ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {tab === "add" ? "Adding Liquidity..." : "Removing Liquidity..."}
                </span>
              ) : !hasMnemonic ? (
                "Set Mnemonic in Settings"
              ) : tab === "add" ? (
                "Add Liquidity"
              ) : (
                "Remove Liquidity"
              )}
            </button>
          </div>
        </div>

        {/* Info box */}
        <div className="meow-card rounded-2xl p-4 text-[13px] text-muted-foreground space-y-2">
          <div className="flex items-center gap-1.5">
            <Info className="h-3.5 w-3.5" />
            <p className="font-semibold text-foreground/80">How Liquidity Works</p>
          </div>
          {tab === "add" ? (
            <>
              <p>Deposit NEX and {ticker} proportionally to the current pool ratio. You receive LP tokens representing your share of the pool.</p>
              <p>LP tokens can be returned anytime to withdraw your proportional share of the pool reserves (NEX + {ticker}).</p>
            </>
          ) : (
            <>
              <p>Return LP tokens to withdraw your proportional share of NEX and {ticker} from the pool.</p>
              <p>The amounts you receive depend on the current pool reserves and the proportion of LP tokens you return relative to total LP in circulation.</p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

"use client";

import { Suspense, useEffect, useState, useCallback, useRef } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowDownUp, Loader2, AlertTriangle, CheckCircle, Droplets } from "lucide-react";
import { getPools, getV2Quote, executeV2Swap } from "@/lib/api";
import { formatNex, formatPrice, formatBps, nexToSats, formatTokenAmount, quotePriceToDisplay, tokenToRaw } from "@/lib/utils";
import { useDexStore } from "@/store/dex-store";
import { Input } from "@/components/ui/input";
import type { Quote, V2SwapBuild, V2SwapExecuteResponse } from "@/types/api";

export default function SwapPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center py-20 text-muted-foreground">Loading...</div>}>
      <SwapContent />
    </Suspense>
  );
}

function SwapContent() {
  const searchParams = useSearchParams();
  const { pools, setPools, slippageBps, mnemonic } = useDexStore();

  const [selectedPoolId, setSelectedPoolId] = useState<number | null>(
    searchParams.get("pool") ? Number(searchParams.get("pool")) : null
  );
  const [direction, setDirection] = useState<"BUY" | "SELL">("BUY");
  const [amountInput, setAmountInput] = useState("");
  const [quote, setQuote] = useState<Quote | null>(null);
  const [v2Build, setV2Build] = useState<V2SwapBuild | null>(null);
  const [quoteLoading, setQuoteLoading] = useState(false);
  const [swapLoading, setSwapLoading] = useState(false);
  const [swapResult, setSwapResult] = useState<V2SwapExecuteResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const quoteTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (pools.length === 0) {
      getPools().then((res) => {
        if (res.ok && res.data) {
          setPools(res.data);
          if (!selectedPoolId && res.data.length > 0) {
            setSelectedPoolId(res.data[0].poolId);
          }
        }
      });
    } else if (!selectedPoolId && pools.length > 0) {
      setSelectedPoolId(pools[0].poolId);
    }
  }, [pools, setPools, selectedPoolId]);

  const selectedPool = pools.find((p) => p.poolId === selectedPoolId);
  const tokenDec = selectedPool?.tokenDecimals ?? 0;

  const fetchQuote = useCallback(async () => {
    if (!selectedPoolId || !amountInput) {
      setQuote(null);
      setV2Build(null);
      return;
    }
    const amount = direction === "SELL"
      ? tokenToRaw(parseFloat(amountInput), tokenDec)
      : nexToSats(parseFloat(amountInput));
    if (isNaN(amount) || amount <= 0) {
      setQuote(null);
      setV2Build(null);
      return;
    }

    setQuoteLoading(true);
    setError(null);

    try {
      const res = await getV2Quote(selectedPoolId, direction, amount);
      if (res.ok && res.data) {
        setV2Build(res.data);
        setQuote({
          poolId: res.data.poolId,
          direction: res.data.direction,
          amountIn: res.data.amountIn,
          amountOut: res.data.amountOut,
          price: res.data.price,
          priceImpactBps: res.data.priceImpactBps,
          minimumReceived: res.data.minimumReceived,
        });
      } else if (res.error) {
        setError(res.error.message);
        setQuote(null);
        setV2Build(null);
      }
    } catch {
      setError("Network error fetching quote");
      setQuote(null);
      setV2Build(null);
    }
    setQuoteLoading(false);
  }, [selectedPoolId, amountInput, direction, tokenDec]);

  useEffect(() => {
    if (quoteTimer.current) clearTimeout(quoteTimer.current);
    quoteTimer.current = setTimeout(fetchQuote, 500);
    return () => {
      if (quoteTimer.current) clearTimeout(quoteTimer.current);
    };
  }, [fetchQuote]);

  useEffect(() => {
    if (!quote || swapResult) return;
    const interval = setInterval(fetchQuote, 10000);
    return () => clearInterval(interval);
  }, [quote, fetchQuote, swapResult]);

  function flipDirection() {
    setDirection((d) => (d === "BUY" ? "SELL" : "BUY"));
    setAmountInput("");
    setQuote(null);
    setError(null);
    setSwapResult(null);
  }

  async function handleSwap() {
    if (!quote || !v2Build || !selectedPoolId || !mnemonic) return;

    setSwapLoading(true);
    setError(null);
    setSwapResult(null);

    const amount = direction === "SELL"
      ? tokenToRaw(parseFloat(amountInput), tokenDec)
      : nexToSats(parseFloat(amountInput));

    try {
      const res = await executeV2Swap({
        poolId: selectedPoolId,
        direction,
        amountIn: amount,
        mnemonic,
        maxSlippageBps: slippageBps,
      });

      if (res.ok && res.data) {
        setSwapResult(res.data);
        setQuote(null);
        setV2Build(null);
        setAmountInput("");
      } else if (res.error) {
        setError(res.error.message);
      }
    } catch {
      setError("Network error executing swap");
    }

    setSwapLoading(false);
  }

  const ticker = selectedPool?.tokenTicker || "TOKEN";
  const fromLabel = direction === "SELL" ? ticker : "NEX";
  const toLabel = direction === "SELL" ? "NEX" : ticker;
  const fromPlaceholder = direction === "SELL" ? `Amount in ${ticker}` : "Amount in NEX";

  const impactHigh = quote && quote.priceImpactBps > 500;
  const hasMnemonic = mnemonic.trim().split(/\s+/).length >= 12;
  const canSwap = !!quote && hasMnemonic && !swapLoading;

  return (
    <div className="flex items-start justify-center px-4 py-6 sm:py-10">
      <div className="w-full max-w-[440px]">
        {/* Swap card */}
        <div className="meow-card rounded-2xl overflow-hidden">
          {/* Header */}
          <div className="px-6 pt-5 pb-3 flex items-center justify-between">
            <h2 className="text-lg font-bold tracking-tight">Swap</h2>
            <div className="flex items-center gap-2">
              {selectedPoolId && (
                <Link href={`/pools/${selectedPoolId}/liquidity`}>
                  <span className="meow-badge text-[11px] px-2.5 py-1 rounded-full font-medium cursor-pointer hover:opacity-80 flex items-center gap-1">
                    <Droplets className="h-3 w-3" />
                    LP
                  </span>
                </Link>
              )}
              <span className="meow-badge text-[11px] px-2.5 py-1 rounded-full font-medium">
                {(slippageBps / 100).toFixed(1)}% slippage
              </span>
            </div>
          </div>

          <div className="px-6 pb-6 space-y-3">
            {/* Pool selector */}
            <select
              className="w-full rounded-xl meow-input px-3.5 py-2.5 text-sm font-medium focus:outline-none"
              value={selectedPoolId ?? ""}
              onChange={(e) => {
                setSelectedPoolId(Number(e.target.value));
                setQuote(null);
                setAmountInput("");
                setError(null);
                setSwapResult(null);
              }}
            >
              {pools
                .filter((p) => p.status === "ACTIVE")
                .map((p) => (
                  <option key={p.poolId} value={p.poolId}>
                    {p.tokenTicker || p.tokenGroupIdHex.slice(0, 12)} / NEX
                  </option>
                ))}
            </select>

            {/* From */}
            <div className="rounded-xl meow-input p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">You pay</span>
                <span className="text-[11px] text-muted-foreground font-mono">
                  {selectedPool && direction === "SELL" && `Bal: ${formatTokenAmount(selectedPool.tokenReserve, tokenDec)}`}
                  {selectedPool && direction === "BUY" && `Bal: ${formatNex(selectedPool.nexReserve)} NEX`}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <Input
                  type="number"
                  placeholder="0"
                  className="text-2xl font-mono bg-transparent border-0 p-0 h-auto focus-visible:ring-0 placeholder:text-muted-foreground/30 flex-1"
                  value={amountInput}
                  disabled={swapLoading}
                  onChange={(e) => {
                    setAmountInput(e.target.value);
                    setError(null);
                    setSwapResult(null);
                  }}
                />
                <span className="text-sm font-bold text-muted-foreground shrink-0">{fromLabel}</span>
              </div>
            </div>

            {/* Flip */}
            <div className="flex justify-center -my-1 relative z-10">
              <button
                className="rounded-xl p-2.5 meow-card border border-[hsla(42,100%,55%,0.15)] hover:border-[hsla(42,100%,55%,0.35)] hover:shadow-[0_0_16px_hsla(42,100%,55%,0.1)] transition-all"
                onClick={flipDirection}
                disabled={swapLoading}
              >
                <ArrowDownUp className="h-4 w-4 text-primary" />
              </button>
            </div>

            {/* To */}
            <div className="rounded-xl meow-input p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">You receive</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-2xl font-mono min-h-[2rem] flex items-center flex-1">
                  {quoteLoading ? (
                    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                  ) : quote ? (
                    <span className="text-primary font-bold">
                      {direction === "SELL"
                        ? formatNex(quote.amountOut)
                        : formatTokenAmount(quote.amountOut, tokenDec)}
                    </span>
                  ) : (
                    <span className="text-muted-foreground/25">0</span>
                  )}
                </div>
                <span className="text-sm font-bold text-muted-foreground shrink-0">{toLabel}</span>
              </div>
            </div>

            {/* Quote details */}
            {quote && (
              <div className="rounded-xl bg-[hsla(224,25%,13%,0.4)] p-3.5 space-y-2 text-[13px]">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Rate</span>
                  <span className="font-mono text-foreground/80">
                    1 {fromLabel} = {formatPrice(quotePriceToDisplay(quote.price, direction, tokenDec))} {toLabel}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Price Impact</span>
                  <span className={`font-mono ${impactHigh ? "text-red-400" : "text-[hsl(var(--success))]"}`}>
                    {formatBps(quote.priceImpactBps)}
                    {impactHigh && <AlertTriangle className="inline h-3 w-3 ml-1" />}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Min. Received</span>
                  <span className="font-mono text-foreground/80">
                    {direction === "SELL"
                      ? formatNex(quote.minimumReceived) + " NEX"
                      : formatTokenAmount(quote.minimumReceived, tokenDec) + ` ${ticker}`}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Fee (0.3%)</span>
                  <span className="font-mono text-muted-foreground">
                    {direction === "SELL"
                      ? formatTokenAmount(Math.round(tokenToRaw(parseFloat(amountInput), tokenDec) * 0.003), tokenDec) + ` ${ticker}`
                      : formatNex(Math.round(nexToSats(parseFloat(amountInput)) * 0.003)) + " NEX"}
                  </span>
                </div>
              </div>
            )}

            {/* Wallet warning */}
            {quote && !hasMnemonic && (
              <div className="rounded-xl border border-[hsla(42,100%,55%,0.2)] bg-[hsla(42,100%,55%,0.05)] p-3.5 text-sm">
                <p className="font-semibold text-primary text-[13px]">Wallet Required</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Enter your 12-word mnemonic in Settings to enable swaps.
                </p>
              </div>
            )}

            {/* Success */}
            {swapResult && (
              <div className="rounded-xl border border-[hsla(152,60%,42%,0.3)] bg-[hsla(152,60%,42%,0.06)] p-3.5 text-sm">
                <div className="flex items-center gap-2 mb-1">
                  <CheckCircle className="h-4 w-4 text-[hsl(var(--success))]" />
                  <span className="font-semibold text-[hsl(var(--success))]">Swap Successful</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  {swapResult.direction === "SELL"
                    ? `Sold ${formatTokenAmount(swapResult.amountIn, tokenDec)} ${ticker} for ${formatNex(swapResult.amountOut)} NEX`
                    : `Bought ${formatTokenAmount(swapResult.amountOut, tokenDec)} ${ticker} for ${formatNex(swapResult.amountIn)} NEX`}
                </p>
                <p className="text-[11px] text-muted-foreground/70 mt-1 font-mono break-all">
                  TX: {swapResult.txId}
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

            {/* Swap button */}
            <button
              className="meow-btn w-full h-12 text-[15px] rounded-xl"
              disabled={!canSwap}
              onClick={handleSwap}
            >
              {swapLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Swapping...
                </span>
              ) : !quote ? (
                "Enter Amount"
              ) : !hasMnemonic ? (
                "Set Mnemonic in Settings"
              ) : impactHigh ? (
                "Swap Anyway (High Impact)"
              ) : (
                "Swap"
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

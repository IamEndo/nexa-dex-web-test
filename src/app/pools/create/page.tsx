"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createPool, getTokens } from "@/lib/api";
import { useDexStore } from "@/store/dex-store";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Loader2, Plus, AlertTriangle, Info } from "lucide-react";
import type { Token } from "@/types/api";

export default function CreatePoolPage() {
  const router = useRouter();
  const { mnemonic } = useDexStore();

  const [tokens, setTokens] = useState<Token[]>([]);
  const [tokenGroupIdHex, setTokenGroupIdHex] = useState("");
  const [initialNexSats, setInitialNexSats] = useState("");
  const [initialTokenAmount, setInitialTokenAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");

  useEffect(() => {
    getTokens().then((res) => {
      if (res.ok && res.data) {
        setTokens(res.data);
      }
    });
  }, []);

  const selectedToken = tokens.find((t) => t.groupIdHex === tokenGroupIdHex);

  async function handleCreate() {
    if (!mnemonic) {
      setError("Mnemonic not set. Go to Settings to configure your wallet.");
      return;
    }
    if (!tokenGroupIdHex) {
      setError("Select a token.");
      return;
    }
    const nexSats = parseInt(initialNexSats);
    const tokenAmt = parseInt(initialTokenAmount);
    if (!nexSats || nexSats < 546) {
      setError("Initial NEX must be at least 546 sats.");
      return;
    }
    if (!tokenAmt || tokenAmt <= 0) {
      setError("Initial token amount must be positive.");
      return;
    }

    setError("");
    setLoading(true);
    setStatus("Creating LP token group and deploying pool... This takes ~90 seconds.");

    try {
      const res = await createPool({
        tokenGroupIdHex,
        initialNexSats: nexSats,
        initialTokenAmount: tokenAmt,
        mnemonic,
      });

      if (res.ok && res.data) {
        setStatus("");
        router.push(`/pools/${res.data.poolId}`);
      } else {
        setError(res.error?.message || "Pool creation failed");
        setStatus("");
      }
    } catch (e) {
      setError("Network error. Please try again.");
      setStatus("");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex items-start justify-center px-4 py-6 sm:py-10">
      <div className="w-full max-w-[480px] space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold">Create Liquidity Pool</h1>
            <p className="text-xs text-muted-foreground mt-0.5">Deploy a new AMM pool on-chain</p>
          </div>
          <Link href="/pools">
            <span className="meow-badge text-[11px] px-2.5 py-1 rounded-full font-medium cursor-pointer hover:opacity-80 flex items-center gap-1">
              <ArrowLeft className="h-3 w-3" />
              Pools
            </span>
          </Link>
        </div>

        {/* Main card */}
        <div className="meow-card rounded-2xl overflow-hidden">
          <div className="px-6 py-5 space-y-4">
            {!mnemonic && (
              <div className="rounded-xl border border-[hsla(42,100%,55%,0.2)] bg-[hsla(42,100%,55%,0.05)] p-3.5 text-sm">
                <p className="font-semibold text-primary text-[13px]">Wallet Required</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Enter your 12-word mnemonic in{" "}
                  <Link href="/settings" className="text-primary hover:underline">Settings</Link>{" "}
                  before creating a pool.
                </p>
              </div>
            )}

            {/* Token Selection */}
            <div className="rounded-xl meow-input p-4">
              <div className="mb-2">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">Token</span>
              </div>
              {tokens.length > 0 ? (
                <select
                  className="w-full bg-transparent text-sm font-medium focus:outline-none"
                  value={tokenGroupIdHex}
                  onChange={(e) => setTokenGroupIdHex(e.target.value)}
                  disabled={loading}
                >
                  <option value="">Select a registered token</option>
                  {tokens.map((t) => (
                    <option key={t.groupIdHex} value={t.groupIdHex}>
                      {t.ticker || t.name || t.groupIdHex.slice(0, 16) + "..."} ({t.decimals} decimals)
                    </option>
                  ))}
                </select>
              ) : (
                <Input
                  placeholder="Token group ID (64 hex chars)"
                  value={tokenGroupIdHex}
                  onChange={(e) => setTokenGroupIdHex(e.target.value)}
                  disabled={loading}
                  className="bg-transparent border-0 p-0 h-auto focus-visible:ring-0 font-mono text-xs"
                />
              )}
              {selectedToken && (
                <p className="text-[10px] text-muted-foreground font-mono mt-2 break-all">
                  {selectedToken.groupIdHex}
                </p>
              )}
            </div>

            {/* Initial NEX */}
            <div className="rounded-xl meow-input p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">Initial NEX</span>
                {initialNexSats && parseInt(initialNexSats) > 0 && (
                  <span className="text-[10px] text-muted-foreground">
                    = {(parseInt(initialNexSats) / 100).toLocaleString()} NEX
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3">
                <Input
                  type="number"
                  placeholder="0"
                  className="text-2xl font-mono bg-transparent border-0 p-0 h-auto focus-visible:ring-0 placeholder:text-muted-foreground/30 flex-1"
                  value={initialNexSats}
                  onChange={(e) => setInitialNexSats(e.target.value)}
                  disabled={loading}
                />
                <span className="text-sm font-bold text-muted-foreground shrink-0">sats</span>
              </div>
            </div>

            {/* Initial Token Amount */}
            <div className="rounded-xl meow-input p-4">
              <div className="mb-2">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">
                  Initial {selectedToken?.ticker || "Token"} Amount
                </span>
              </div>
              <div className="flex items-center gap-3">
                <Input
                  type="number"
                  placeholder="0"
                  className="text-2xl font-mono bg-transparent border-0 p-0 h-auto focus-visible:ring-0 placeholder:text-muted-foreground/30 flex-1"
                  value={initialTokenAmount}
                  onChange={(e) => setInitialTokenAmount(e.target.value)}
                  disabled={loading}
                />
                <span className="text-sm font-bold text-muted-foreground shrink-0">{selectedToken?.ticker || "TOKEN"}</span>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="rounded-xl border border-[hsla(0,72%,45%,0.3)] bg-[hsla(0,72%,45%,0.06)] p-3.5 text-sm text-red-400 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                {error}
              </div>
            )}

            {/* Status */}
            {status && (
              <div className="rounded-xl border border-blue-500/30 bg-blue-500/5 p-3.5 text-sm text-blue-400 flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin shrink-0" />
                {status}
              </div>
            )}

            {/* Submit */}
            <button
              onClick={handleCreate}
              disabled={loading || !mnemonic || !tokenGroupIdHex || !initialNexSats || !initialTokenAmount}
              className="meow-btn w-full h-12 text-[15px] rounded-xl"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Deploying Pool...
                </span>
              ) : (
                "Create Pool"
              )}
            </button>
          </div>
        </div>

        {/* Info box */}
        <div className="meow-card rounded-2xl p-4 text-[13px] text-muted-foreground space-y-2">
          <div className="flex items-center gap-1.5">
            <Info className="h-3.5 w-3.5" />
            <p className="font-semibold text-foreground/80">How Pool Creation Works</p>
          </div>
          <p>The backend automatically creates an LP token group (1B supply) and deploys the pool on-chain.</p>
          <p>This takes ~90 seconds due to UTXO propagation. Your wallet needs sufficient NEX and token balance.</p>
        </div>
      </div>
    </div>
  );
}

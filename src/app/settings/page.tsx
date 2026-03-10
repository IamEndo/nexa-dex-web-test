"use client";

import { useState } from "react";
import { Check, Eye, EyeOff, AlertTriangle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useDexStore } from "@/store/dex-store";

const SLIPPAGE_OPTIONS = [
  { label: "0.5%", bps: 50 },
  { label: "1%", bps: 100 },
  { label: "3%", bps: 300 },
  { label: "5%", bps: 500 },
];

export default function SettingsPage() {
  const {
    userAddress, setUserAddress,
    slippageBps, setSlippageBps,
    mnemonic, setMnemonic,
  } = useDexStore();
  const [addressInput, setAddressInput] = useState(userAddress);
  const [mnemonicInput, setMnemonicInput] = useState(mnemonic);
  const [customSlippage, setCustomSlippage] = useState("");
  const [addressSaved, setAddressSaved] = useState(false);
  const [mnemonicSaved, setMnemonicSaved] = useState(false);
  const [showMnemonic, setShowMnemonic] = useState(false);

  function saveAddress() {
    setUserAddress(addressInput.trim());
    setAddressSaved(true);
    setTimeout(() => setAddressSaved(false), 2000);
  }

  function saveMnemonic() {
    setMnemonic(mnemonicInput.trim());
    setMnemonicSaved(true);
    setTimeout(() => setMnemonicSaved(false), 2000);
  }

  const wordCount = mnemonicInput.trim() ? mnemonicInput.trim().split(/\s+/).length : 0;
  const validMnemonic = wordCount === 12 || wordCount === 24;

  return (
    <div className="flex items-start justify-center px-4 py-6 sm:py-10">
      <div className="w-full max-w-[480px] space-y-4">
        <h1 className="text-xl font-bold">Settings</h1>

        {/* Wallet Mnemonic */}
        <div className="meow-card rounded-2xl overflow-hidden">
          <div className="px-6 pt-5 pb-3">
            <h2 className="text-base font-bold">Wallet Mnemonic</h2>
          </div>
          <div className="px-6 pb-6 space-y-3">
            <p className="text-sm text-muted-foreground">
              Your 12 or 24-word seed phrase. Required for swaps and liquidity operations.
              Stored in memory only — cleared when you close the tab.
            </p>
            <div className="rounded-xl border border-[hsla(42,100%,55%,0.2)] bg-[hsla(42,100%,55%,0.05)] p-3 text-xs flex items-start gap-2">
              <AlertTriangle className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" />
              <span className="text-muted-foreground">
                Use a dedicated trading wallet with limited funds. Never use your main wallet seed phrase.
              </span>
            </div>
            <div className="relative">
              <textarea
                placeholder="word1 word2 word3 ... word12"
                className="w-full rounded-xl meow-input px-4 py-3 text-sm font-mono focus:outline-none min-h-[80px] resize-none pr-10"
                style={!showMnemonic ? { WebkitTextSecurity: "disc" } as React.CSSProperties : undefined}
                value={mnemonicInput}
                onChange={(e) => setMnemonicInput(e.target.value)}
              />
              <button
                type="button"
                className="absolute top-3 right-3 text-muted-foreground hover:text-foreground transition-colors"
                onClick={() => setShowMnemonic(!showMnemonic)}
              >
                {showMnemonic ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            <div className="flex items-center justify-between">
              <span className={`text-xs ${validMnemonic ? "text-[hsl(var(--success))]" : wordCount > 0 ? "text-red-400" : "text-muted-foreground"}`}>
                {wordCount > 0 ? `${wordCount} words${validMnemonic ? "" : " (need 12 or 24)"}` : "No mnemonic set"}
              </span>
              <button
                onClick={saveMnemonic}
                disabled={mnemonicInput.trim() === mnemonic || (!validMnemonic && mnemonicInput.trim() !== "")}
                className="meow-btn px-4 py-1.5 rounded-lg text-xs disabled:opacity-40"
              >
                {mnemonicSaved ? <Check className="h-3.5 w-3.5" /> : "Save"}
              </button>
            </div>
          </div>
        </div>

        {/* Wallet Address */}
        <div className="meow-card rounded-2xl overflow-hidden">
          <div className="px-6 pt-5 pb-3">
            <h2 className="text-base font-bold">Wallet Address</h2>
          </div>
          <div className="px-6 pb-6 space-y-3">
            <p className="text-sm text-muted-foreground">
              Your Nexa address (derived from mnemonic automatically when swapping).
            </p>
            <div className="flex gap-2">
              <Input
                placeholder="nexa:nqtsq5g..."
                className="font-mono text-sm"
                value={addressInput}
                onChange={(e) => setAddressInput(e.target.value)}
              />
              <button
                onClick={saveAddress}
                disabled={addressInput.trim() === userAddress}
                className="meow-btn px-4 py-1.5 rounded-lg text-xs shrink-0 disabled:opacity-40"
              >
                {addressSaved ? <Check className="h-3.5 w-3.5" /> : "Save"}
              </button>
            </div>
          </div>
        </div>

        {/* Slippage Tolerance */}
        <div className="meow-card rounded-2xl overflow-hidden">
          <div className="px-6 pt-5 pb-3">
            <h2 className="text-base font-bold">Slippage Tolerance</h2>
          </div>
          <div className="px-6 pb-6 space-y-3">
            <p className="text-sm text-muted-foreground">
              Maximum price change you&apos;re willing to accept.
            </p>
            <div className="flex flex-wrap gap-2">
              {SLIPPAGE_OPTIONS.map((opt) => (
                <button
                  key={opt.bps}
                  onClick={() => {
                    setSlippageBps(opt.bps);
                    setCustomSlippage("");
                  }}
                  className={`px-3.5 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    slippageBps === opt.bps
                      ? "meow-btn"
                      : "meow-input hover:border-[hsla(42,100%,55%,0.2)]"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
              <div className="flex items-center gap-1.5">
                <Input
                  type="number"
                  placeholder="Custom"
                  className="w-20 h-9 text-sm"
                  value={customSlippage}
                  onChange={(e) => {
                    setCustomSlippage(e.target.value);
                    const bps = Math.round(parseFloat(e.target.value) * 100);
                    if (bps > 0 && bps <= 5000) setSlippageBps(bps);
                  }}
                />
                <span className="text-sm text-muted-foreground">%</span>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              Current: {(slippageBps / 100).toFixed(2)}%
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

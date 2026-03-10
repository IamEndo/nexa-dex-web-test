import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// 1 NEX = 100 satoshis
export function satsToNex(sats: number): number {
  return sats / 100;
}

export function nexToSats(nex: number): number {
  return Math.round(nex * 100);
}

export function formatNex(sats: number, decimals = 2): string {
  return satsToNex(sats).toLocaleString(undefined, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

export function formatTokenAmount(amount: number, decimals = 0): string {
  if (decimals === 0) return amount.toLocaleString();
  const val = amount / Math.pow(10, decimals);
  return val.toLocaleString(undefined, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

// Convert human-readable token amount to raw units for API
export function tokenToRaw(amount: number, decimals: number): number {
  return Math.round(amount * Math.pow(10, decimals));
}

// Convert raw token amount to human-readable number
export function rawToToken(raw: number, decimals: number): number {
  if (decimals === 0) return raw;
  return raw / Math.pow(10, decimals);
}

export function formatPrice(price: number): string {
  if (price === 0) return "0";
  if (Math.abs(price) < 0.0001) return price.toExponential(4);
  if (Math.abs(price) < 1) return price.toFixed(6);
  if (Math.abs(price) < 10000) return price.toFixed(4);
  return price.toLocaleString(undefined, { maximumFractionDigits: 2 });
}

// Backend prices are in sats-based units with raw token amounts.
// spotPrice = nexReserveSats / tokenReserveRaw → sats/rawToken
// For display: NEX/displayToken = (sats/rawToken) / 100 * 10^tokenDecimals
export function spotPriceToNex(satPrice: number, tokenDecimals = 0): number {
  return satPrice / 100 * Math.pow(10, tokenDecimals);
}

// Quote price depends on direction (uses raw token units from backend):
// BUY:  price = rawTokens/sat  → displayTokens/NEX = price * 100 / 10^decimals
// SELL: price = sats/rawToken  → NEX/displayToken  = price / 100 * 10^decimals
export function quotePriceToDisplay(price: number, direction: "BUY" | "SELL", tokenDecimals = 0): number {
  const factor = Math.pow(10, tokenDecimals);
  return direction === "BUY" ? price * 100 / factor : price / 100 * factor;
}

export function formatPercent(pct: number): string {
  const sign = pct >= 0 ? "+" : "";
  return `${sign}${pct.toFixed(2)}%`;
}

export function formatBps(bps: number): string {
  return `${(bps / 100).toFixed(2)}%`;
}

export function shortenAddress(addr: string, chars = 8): string {
  if (addr.length <= chars * 2 + 3) return addr;
  return `${addr.slice(0, chars)}...${addr.slice(-chars)}`;
}

export function shortenTxId(txId: string, chars = 8): string {
  return `${txId.slice(0, chars)}...${txId.slice(-chars)}`;
}

export function timeAgo(timestamp: number): string {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

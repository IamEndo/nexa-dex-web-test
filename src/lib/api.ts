import type {
  ApiResponse,
  Pool,
  Token,
  Trade,
  PoolStats,
  Candle,
  Quote,
  HealthStatus,
  V2PoolState,
  V2SwapBuild,
  V2SwapExecuteRequest,
  V2SwapExecuteResponse,
  V2BroadcastRequest,
  V2BroadcastResponse,
  CreatePoolRequest,
  RegisterTokenRequest,
  AddLiquidityRequest,
  RemoveLiquidityRequest,
  LiquidityResponse,
  LiquidityQuoteResponse,
} from "@/types/api";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:9090";

async function fetchApi<T>(
  path: string,
  options?: RequestInit & { timeout?: number }
): Promise<ApiResponse<T>> {
  const { timeout = 30000, ...fetchOptions } = options || {};
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  const url = `${API_BASE}${path}`;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  try {
    const res = await fetch(url, {
      ...fetchOptions,
      signal: controller.signal,
      headers: { ...headers, ...fetchOptions?.headers },
    });
    clearTimeout(id);
    return res.json();
  } catch (e) {
    clearTimeout(id);
    if (e instanceof DOMException && e.name === "AbortError") {
      return { ok: false, error: { type: "TIMEOUT", message: "Request timed out", retryable: true } };
    }
    throw e;
  }
}

// Health
export async function getHealth(): Promise<ApiResponse<HealthStatus>> {
  return fetchApi("/api/v1/health");
}

// Pools
export async function getPools(): Promise<ApiResponse<Pool[]>> {
  return fetchApi("/api/v1/pools");
}

export async function getPool(poolId: number): Promise<ApiResponse<Pool>> {
  return fetchApi(`/api/v1/pools/${poolId}`);
}

export async function createPool(req: CreatePoolRequest): Promise<ApiResponse<Pool>> {
  return fetchApi("/api/v1/pools", {
    method: "POST",
    body: JSON.stringify(req),
    timeout: 120000,
  });
}

export async function getPoolTrades(
  poolId: number,
  limit = 50,
  offset = 0
): Promise<ApiResponse<Trade[]>> {
  return fetchApi(`/api/v1/pools/${poolId}/trades?limit=${limit}&offset=${offset}`);
}

export async function getPoolStats(poolId: number): Promise<ApiResponse<PoolStats>> {
  return fetchApi(`/api/v1/pools/${poolId}/stats`);
}

export async function getPoolCandles(
  poolId: number,
  interval = "1h",
  from?: number,
  to?: number,
  limit = 500
): Promise<ApiResponse<Candle[]>> {
  const params = new URLSearchParams({ interval, limit: String(limit) });
  if (from) params.set("from", String(from));
  if (to) params.set("to", String(to));
  return fetchApi(`/api/v1/pools/${poolId}/candles?${params}`);
}

// Tokens
export async function getTokens(): Promise<ApiResponse<Token[]>> {
  return fetchApi("/api/v1/tokens");
}

export async function getToken(groupIdHex: string): Promise<ApiResponse<Token>> {
  return fetchApi(`/api/v1/tokens/${groupIdHex}`);
}

export async function registerToken(req: RegisterTokenRequest): Promise<ApiResponse<Token>> {
  return fetchApi("/api/v1/tokens", {
    method: "POST",
    body: JSON.stringify(req),
  });
}

// V2 Permissionless API

export async function getV2PoolState(poolId: number): Promise<ApiResponse<V2PoolState>> {
  return fetchApi(`/api/v2/pools/${poolId}/state`);
}

export async function getV2Quote(
  poolId: number,
  direction: "BUY" | "SELL",
  amountIn: number
): Promise<ApiResponse<V2SwapBuild>> {
  return fetchApi(
    `/api/v2/quote?poolId=${poolId}&direction=${direction}&amountIn=${amountIn}`
  );
}

export async function executeV2Swap(
  req: V2SwapExecuteRequest
): Promise<ApiResponse<V2SwapExecuteResponse>> {
  return fetchApi("/api/v2/swap/execute", {
    method: "POST",
    body: JSON.stringify(req),
  });
}

export async function broadcastV2Swap(
  req: V2BroadcastRequest
): Promise<ApiResponse<V2BroadcastResponse>> {
  return fetchApi("/api/v2/swap/broadcast", {
    method: "POST",
    body: JSON.stringify(req),
  });
}

// Liquidity
export async function getLiquidityQuote(
  poolId: number,
  action: "ADD" | "REMOVE",
  params: { nexSats?: number; tokenAmount?: number; lpTokenAmount?: number }
): Promise<ApiResponse<LiquidityQuoteResponse>> {
  const searchParams = new URLSearchParams({
    poolId: String(poolId),
    action,
  });
  if (params.nexSats != null) searchParams.set("nexSats", String(params.nexSats));
  if (params.tokenAmount != null) searchParams.set("tokenAmount", String(params.tokenAmount));
  if (params.lpTokenAmount != null) searchParams.set("lpTokenAmount", String(params.lpTokenAmount));
  return fetchApi(`/api/v2/liquidity/quote?${searchParams}`);
}

export async function addLiquidity(
  req: AddLiquidityRequest
): Promise<ApiResponse<LiquidityResponse>> {
  return fetchApi("/api/v2/liquidity/add", {
    method: "POST",
    body: JSON.stringify(req),
  });
}

export async function removeLiquidity(
  req: RemoveLiquidityRequest
): Promise<ApiResponse<LiquidityResponse>> {
  return fetchApi("/api/v2/liquidity/remove", {
    method: "POST",
    body: JSON.stringify(req),
  });
}

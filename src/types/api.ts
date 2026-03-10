// API response wrapper
export interface ApiResponse<T> {
  ok: boolean;
  data?: T;
  error?: ApiError;
}

export interface ApiError {
  type: string;
  message: string;
  retryable: boolean;
}

// Pool
export interface Pool {
  poolId: number;
  tokenGroupIdHex: string;
  tokenTicker: string | null;
  tokenDecimals: number;
  contractAddress: string;
  contractVersion: string;
  status: string;
  nexReserve: number;
  tokenReserve: number;
  spotPrice: number;
  tvlNexSats: number;
  deployTxId: string | null;
}

// Token
export interface Token {
  groupIdHex: string;
  name: string;
  ticker: string;
  decimals: number;
  documentUrl: string | null;
}

// Trade
export interface Trade {
  tradeId: number;
  poolId: number;
  direction: "BUY" | "SELL";
  amountIn: number;
  amountOut: number;
  price: number;
  txId: string | null;
  status: string;
  createdAt: number;
}

// Stats
export interface PoolStats {
  poolId: number;
  nexReserve: number;
  tokenReserve: number;
  spotPrice: number;
  tvlNexSats: number;
  volume24hNex: number;
  volume24hToken: number;
  tradeCount24h: number;
  priceChange24hPct: number;
  apyEstimatePct: number;
}

// Candle (OHLCV)
export interface Candle {
  openTime: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volumeNex: number;
  volumeToken: number;
  tradeCount: number;
}

// Quote
export interface Quote {
  poolId: number;
  direction: "BUY" | "SELL";
  amountIn: number;
  amountOut: number;
  price: number;
  priceImpactBps: number;
  minimumReceived: number;
}

// Pool creation
export interface CreatePoolRequest {
  tokenGroupIdHex: string;
  lpGroupIdHex?: string;
  initialLpSupply?: number;
  initialNexSats: number;
  initialTokenAmount: number;
  mnemonic: string;
}

// Liquidity
export interface AddLiquidityRequest {
  poolId: number;
  nexSats: number;
  tokenAmount: number;
  mnemonic: string;
}

export interface RemoveLiquidityRequest {
  poolId: number;
  lpTokenAmount: number;
  mnemonic: string;
}

export interface LiquidityResponse {
  txId: string;
  poolId: number;
  action: string;
  nexAmount: number;
  tokenAmount: number;
  lpTokenAmount: number;
  status: string;
}

// Token registration
export interface RegisterTokenRequest {
  groupIdHex: string;
  name?: string;
  ticker?: string;
  decimals?: number;
  documentUrl?: string;
}

// V2 Pool State
export interface V2PoolState {
  poolId: number;
  tokenGroupIdHex: string;
  lpGroupIdHex: string;
  contractAddress: string;
  contractVersion: string;
  status: string;
  nexReserve: number;
  tokenReserve: number;
  spotPrice: number;
  poolUtxoTxId: string | null;
  poolUtxoVout: number | null;
  initialLpSupply: number;
  lpReserveBalance: number;
  lpInCirculation: number;
  templateHashHex: string;
  constraintHashHex: string;
  lastUpdated: number;
}

// Liquidity quote (preview)
export interface LiquidityQuoteResponse {
  poolId: number;
  action: "ADD" | "REMOVE";
  nexAmount: number;
  tokenAmount: number;
  lpTokenAmount: number;
  lpInCirculation: number;
  poolNexReserve: number;
  poolTokenReserve: number;
}

// V2 Swap Build Params (quote + tx construction info)
export interface V2SwapBuild {
  poolId: number;
  direction: "BUY" | "SELL";
  amountIn: number;
  amountOut: number;
  price: number;
  priceImpactBps: number;
  minimumReceived: number;
  poolOutputScriptHex: string;
  poolOutputNexAmount: number;
  poolOutputTokenAmount: number;
  userOutputAmount: number;
  estimatedFee: number;
  poolUtxoTxId: string | null;
  poolUtxoVout: number | null;
}

// V2 Swap Execute request/response
export interface V2SwapExecuteRequest {
  poolId: number;
  direction: "BUY" | "SELL";
  amountIn: number;
  mnemonic: string;
  maxSlippageBps?: number;
}

export interface V2SwapExecuteResponse {
  txId: string;
  poolId: number;
  direction: string;
  amountIn: number;
  amountOut: number;
  price: number;
  status: string;
}

// V2 Broadcast request/response
export interface V2BroadcastRequest {
  signedTxHex: string;
  poolId: number;
}

export interface V2BroadcastResponse {
  txId: string;
  poolId: number;
  status: string;
}

// WebSocket messages
export interface WsSubscribe {
  subscribe: string;
}

export interface WsUnsubscribe {
  unsubscribe: string;
}

export interface WsTradeEvent {
  type: "trade";
  data: Trade;
}

export interface WsPriceEvent {
  type: "price";
  data: {
    poolId: number;
    spotPrice: number;
    nexReserve: number;
    tokenReserve: number;
  };
}

export interface WsCandleEvent {
  type: "candle";
  data: Candle & { poolId: number; interval: string };
}

export interface WsBlockEvent {
  type: "block";
  data: {
    height: number;
    hash: string;
    timestamp: number;
  };
}

export type WsEvent = WsTradeEvent | WsPriceEvent | WsCandleEvent | WsBlockEvent;

// Health
export interface HealthStatus {
  status: string;
  version: string;
  uptime: number;
  pools: number;
  activePools: number;
  connected: boolean;
  dbConnected: boolean;
  memoryUsedMb: number;
  memoryMaxMb: number;
}

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Pool, Token } from "@/types/api";

interface DexState {
  // Pools
  pools: Pool[];
  setPools: (pools: Pool[]) => void;
  updatePool: (pool: Pool) => void;

  // Tokens
  tokens: Token[];
  setTokens: (tokens: Token[]) => void;

  // User settings
  userAddress: string;
  setUserAddress: (address: string) => void;
  slippageBps: number;
  setSlippageBps: (bps: number) => void;
  mnemonic: string;
  setMnemonic: (mnemonic: string) => void;

  // UI state
  selectedPoolId: number | null;
  setSelectedPoolId: (id: number | null) => void;
}

export const useDexStore = create<DexState>()(
  persist(
    (set) => ({
      // Pools
      pools: [],
      setPools: (pools) => set({ pools }),
      updatePool: (pool) =>
        set((state) => ({
          pools: state.pools.map((p) =>
            p.poolId === pool.poolId ? pool : p
          ),
        })),

      // Tokens
      tokens: [],
      setTokens: (tokens) => set({ tokens }),

      // User settings
      userAddress: "",
      setUserAddress: (address) => set({ userAddress: address }),
      slippageBps: 100, // 1% default
      setSlippageBps: (bps) => set({ slippageBps: bps }),
      mnemonic: "",
      setMnemonic: (mnemonic) => set({ mnemonic }),

      // UI state
      selectedPoolId: null,
      setSelectedPoolId: (id) => set({ selectedPoolId: id }),
    }),
    {
      name: "nexa-dex-storage",
      partialize: (state) => ({
        userAddress: state.userAddress,
        slippageBps: state.slippageBps,
      }),
    }
  )
);

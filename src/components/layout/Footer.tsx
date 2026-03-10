"use client";

import { useWebSocket } from "@/hooks/useWebSocket";
import { cn } from "@/lib/utils";

export function Footer() {
  const { connected } = useWebSocket();

  return (
    <footer className="border-t border-[hsla(222,25%,15%,0.4)] py-4">
      <div className="container flex max-w-screen-2xl items-center justify-between px-4 text-xs text-muted-foreground">
        <span>
          <span className="text-primary font-semibold">Meow</span><span className="font-medium">Swap</span>
          <span className="mx-1.5 text-muted-foreground/30">|</span>
          DEX on Nexa
        </span>
        <div className="flex items-center gap-2">
          <span
            className={cn(
              "inline-block h-2 w-2 rounded-full",
              connected ? "bg-[hsl(var(--success))] shadow-[0_0_6px_hsla(152,60%,42%,0.5)]" : "bg-red-500"
            )}
          />
          <span className="hidden sm:inline">{connected ? "Connected" : "Disconnected"}</span>
        </div>
      </div>
    </footer>
  );
}

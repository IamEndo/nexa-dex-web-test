"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { BarChart3, Droplets, LineChart, Settings, Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useDexStore } from "@/store/dex-store";
import { shortenAddress } from "@/lib/utils";
import { useState } from "react";

const navItems = [
  { href: "/charts", label: "Charts", icon: LineChart },
  { href: "/pools", label: "Pools", icon: Droplets },
  { href: "/analytics", label: "Analytics", icon: BarChart3 },
];

export function Header() {
  const pathname = usePathname();
  const { userAddress } = useDexStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-[hsla(222,25%,15%,0.6)] bg-[hsla(228,32%,6%,0.92)] backdrop-blur-xl">
      <div className="container flex h-16 max-w-screen-2xl items-center px-4">
        {/* Logo */}
        <Link href="/" className="mr-8 flex items-center gap-2.5 group" onClick={() => setMobileMenuOpen(false)}>
          <Image
            src="/logo.png"
            alt="MeowSwap"
            width={34}
            height={34}
            className="rounded-full ring-2 ring-[hsla(42,100%,55%,0.15)] group-hover:ring-[hsla(42,100%,55%,0.35)] transition-all"
          />
          <span className="font-extrabold text-lg tracking-tight">
            <span className="text-primary meow-glow">Meow</span>
            <span className="text-foreground/90">Swap</span>
          </span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-sm font-medium transition-all duration-200",
                  isActive
                    ? "bg-[hsla(42,100%,55%,0.1)] text-primary"
                    : "text-muted-foreground hover:text-foreground/80 hover:bg-[hsla(220,30%,14%,0.6)]"
                )}
              >
                <item.icon className={cn("h-4 w-4", isActive && "text-primary")} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Right side */}
        <div className="ml-auto flex items-center gap-2">
          {userAddress ? (
            <div className="hidden sm:block rounded-lg border border-[hsla(222,25%,20%,0.5)] bg-[hsla(224,25%,13%,0.5)] px-3 py-1.5 text-sm font-mono text-muted-foreground">
              {shortenAddress(userAddress)}
            </div>
          ) : (
            <Link
              href="/settings"
              className="hidden sm:block rounded-lg border border-[hsla(42,100%,55%,0.2)] bg-[hsla(42,100%,55%,0.06)] px-3.5 py-1.5 text-sm font-medium text-primary hover:bg-[hsla(42,100%,55%,0.12)] transition-colors"
            >
              Connect Wallet
            </Link>
          )}
          <Link
            href="/settings"
            className="rounded-lg p-2 hover:bg-[hsla(220,30%,14%,0.6)] transition-colors"
          >
            <Settings className="h-4 w-4 text-muted-foreground" />
          </Link>
          <button
            className="md:hidden rounded-lg p-2 hover:bg-[hsla(220,30%,14%,0.6)] transition-colors"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? (
              <X className="h-5 w-5 text-muted-foreground" />
            ) : (
              <Menu className="h-5 w-5 text-muted-foreground" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Nav */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-[hsla(222,25%,15%,0.4)] bg-[hsla(228,32%,6%,0.98)] backdrop-blur-xl">
          <nav className="container max-w-screen-2xl px-4 py-3 space-y-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    "flex items-center gap-2.5 rounded-lg px-3.5 py-2.5 text-sm font-medium transition-all",
                    isActive
                      ? "bg-[hsla(42,100%,55%,0.1)] text-primary"
                      : "text-muted-foreground hover:bg-[hsla(220,30%,14%,0.6)]"
                  )}
                >
                  <item.icon className={cn("h-4 w-4", isActive && "text-primary")} />
                  {item.label}
                </Link>
              );
            })}
            {userAddress && (
              <div className="sm:hidden px-3.5 py-2 text-xs font-mono text-muted-foreground truncate">
                {userAddress}
              </div>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}

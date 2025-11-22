"use client";

import Link from "next/link";
import Logo from "./Logo";
import { ConnectButton } from "./ConnectButton";
import { NetworkButton } from "./NetworkButton";

interface HeaderProps {
  showConnectWallet?: boolean;
}

export default function Header({ showConnectWallet = false }: HeaderProps) {
  return (
    <nav className="border-b border-white/10 bg-black/50 backdrop-blur-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-8 md:px-12 h-20 grid grid-cols-3 items-center">
        <Link href="/">
          <Logo size="md" />
        </Link>

        <div className="flex items-center justify-center gap-8">
          <Link
            href="#"
            className="relative text-xs font-bold uppercase tracking-widest text-white/60 hover:text-white transition-colors cursor-pointer group"
          >
            Documentation
            <span className="absolute bottom-0 left-0 w-0 h-px bg-white transition-all duration-300 group-hover:w-full"></span>
          </Link>
          <Link
            href="#"
            className="relative text-xs font-bold uppercase tracking-widest text-white/60 hover:text-white transition-colors cursor-pointer group"
          >
            GitHub
            <span className="absolute bottom-0 left-0 w-0 h-px bg-white transition-all duration-300 group-hover:w-full"></span>
          </Link>
        </div>

        <div className="flex justify-end items-center gap-3">
          {showConnectWallet ? (
            <>
              <NetworkButton />
              <ConnectButton />
            </>
          ) : (
            <Link href="/home">
              <button className="relative px-6 py-2 bg-white text-black text-xs font-bold uppercase tracking-wider transition-transform duration-300 hover:scale-105 border border-white cursor-pointer">
                <span className="relative z-10">Launch App</span>
              </button>
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}

import GridBackground from "./components/GridBackground";
import Header from "./components/Header";
import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-black text-white font-sans selection:bg-white/15 cursor-default">
      <GridBackground />

      <Header showConnectWallet={false} />

      <main className="relative z-10 px-8 md:px-12 pt-40 pb-32 min-h-screen flex items-center">
        <div className="max-w-7xl mx-auto w-full">
          <div className="flex flex-col gap-32">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-end">
              <div className="lg:col-span-8 flex flex-col gap-8">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-2 h-2 bg-white"></div>
                  <div className="h-px w-12 bg-white/40"></div>
                  <span className="text-[10px] tracking-[0.3em] uppercase font-mono text-white/50">
                    Crosschain X402 Payments
                  </span>
                </div>

                <h1 className="text-[6rem] md:text-[9rem] lg:text-[11rem] font-bold leading-[0.8] tracking-[-0.05em] text-white">
                  OMNIX
                  <span className="block text-zinc-500 ml-2 lg:ml-4">402</span>
                </h1>
              </div>

              <div className="lg:col-span-4 flex flex-col justify-end pb-4 gap-8">
                <div className="space-y-6 border-l border-white/20 pl-8">
                  <p className="text-xl text-white leading-relaxed font-light">
                    Enabling agents to reach any X402 sellers from any chain
                    through an OFT using custom EIP-3009.
                  </p>
                  <p className="text-sm text-white/60 leading-relaxed font-mono">
                    // Built on LayerZero OFT with USDO backed 1:1 by USDC.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-6">
              <Link href="/home">
                <button className="group relative px-8 py-4 bg-black border border-white text-white overflow-hidden cursor-pointer">
                  <div className="absolute inset-0 bg-white -translate-x-full group-hover:translate-x-0 transition-transform duration-300 ease-out"></div>
                  <span className="relative z-10 text-sm font-bold tracking-[0.15em] group-hover:text-black transition-colors duration-300 flex items-center gap-3">
                    START BUILDING
                    <svg
                      className="w-4 h-4 transition-transform duration-500 group-hover:translate-x-1"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M17 8l4 4m0 0l-4 4m4-4H3"
                      />
                    </svg>
                  </span>
                </button>
              </Link>

              <a href="#" target="_blank" rel="noopener noreferrer">
                <button className="group relative px-8 py-4 bg-black border border-white text-white overflow-hidden cursor-pointer">
                  <div className="absolute inset-0 bg-white translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out"></div>
                  <span className="relative z-10 text-sm font-bold tracking-[0.15em] group-hover:text-black transition-colors duration-300">
                    VIEW DOCUMENTATION
                  </span>
                </button>
              </a>
            </div>
          </div>
        </div>
      </main>

      <footer className="relative z-50 bg-linear-to-t from-black via-black/95 to-transparent border-t border-white/10">
        <div className="max-w-7xl mx-auto px-8 py-6 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <span className="text-[10px] tracking-[0.2em] uppercase font-mono text-white/40">
              v1.0.0
            </span>
          </div>
          <div className="flex items-center gap-6 text-[10px] tracking-[0.2em] uppercase font-mono text-white/40">
            <a
              href="#"
              className="hover:text-white transition-colors cursor-pointer"
            >
              GitHub
            </a>
            <a
              href="#"
              className="hover:text-white transition-colors cursor-pointer"
            >
              Documentation
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}

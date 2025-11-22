export default function Home() {
  return (
    <div className="min-h-screen bg-black">
      {/* Main content */}
      <main className="relative z-10 flex min-h-screen flex-col items-center justify-center px-8">
        <div className="flex flex-col items-center gap-12 text-center">
          {/* Logo/Main title */}
          <h1 className="text-7xl md:text-9xl font-bold tracking-wide dot-matrix-text">
            OMNIX402
          </h1>

          {/* Subtitle */}
          <p className="text-xl md:text-2xl text-white/60 tracking-wide max-w-2xl">
            Payment protocol for the next generation of APIs
          </p>

          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row gap-4 mt-8">
            <button className="px-8 py-4 border border-white/30 hover:border-white/60 transition-all duration-300 text-xl tracking-wide hover:bg-white/5">
              GET STARTED
            </button>
            <button className="px-8 py-4 border border-white/30 hover:border-white/60 transition-all duration-300 text-xl tracking-wide hover:bg-white/5">
              DOCUMENTATION
            </button>
          </div>

          {/* Stats or info */}
          <div className="flex gap-8 mt-16 text-sm text-white/40 tracking-wider">
            <div className="flex flex-col items-center">
              <span className="text-2xl text-white/80">402</span>
              <span>PROTOCOL</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-2xl text-white/80">BASE</span>
              <span>NETWORK</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-2xl text-white/80">USDC</span>
              <span>PAYMENTS</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

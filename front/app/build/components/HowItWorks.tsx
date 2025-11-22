export default function HowItWorks() {
  return (
    <div className="space-y-4">
      <h3 className="text-xs font-mono text-white/60 uppercase tracking-wider text-center mb-6">
        How It Works
      </h3>

      <div className="grid grid-cols-1 gap-4">
        <div className="bg-white/5 border border-white/10 p-6 hover:bg-white/10 transition-colors flex items-start gap-6">
          <div className="w-8 h-8 bg-white text-black font-bold flex items-center justify-center text-sm shrink-0">
            1
          </div>
          <div>
            <h4 className="text-sm font-bold uppercase tracking-wider mb-2">
              Choose Endpoint
            </h4>
            <p className="text-sm text-white/60 leading-relaxed font-mono">
              Pick any X402 endpoint on Base or Polygon you want to call. Works
              from code, AI agents, or manual testing.
            </p>
          </div>
        </div>

        <div className="bg-white/5 border border-white/10 p-6 hover:bg-white/10 transition-colors flex items-start gap-6">
          <div className="w-8 h-8 bg-white text-black font-bold flex items-center justify-center text-sm shrink-0">
            2
          </div>
          <div>
            <h4 className="text-sm font-bold uppercase tracking-wider mb-2">
              Sign Payment
            </h4>
            <p className="text-sm text-white/60 leading-relaxed font-mono">
              One signature in your wallet using secure EIP-3009 standard. No
              need to worry about which chain you're on.
            </p>
          </div>
        </div>

        <div className="bg-white/5 border border-white/10 p-6 hover:bg-white/10 transition-colors flex items-start gap-6">
          <div className="w-8 h-8 bg-white text-black font-bold flex items-center justify-center text-sm shrink-0">
            3
          </div>
          <div>
            <h4 className="text-sm font-bold uppercase tracking-wider mb-2">
              We Route Cross-Chain
            </h4>
            <p className="text-sm text-white/60 leading-relaxed font-mono">
              Our protocol handles all cross-chain complexity using LayerZero
              OFT. Your payment reaches the right chain automatically.
            </p>
          </div>
        </div>

        <div className="bg-white/5 border border-white/10 p-6 hover:bg-white/10 transition-colors flex items-start gap-6">
          <div className="w-8 h-8 bg-white text-black font-bold flex items-center justify-center text-sm shrink-0">
            4
          </div>
          <div>
            <h4 className="text-sm font-bold uppercase tracking-wider mb-2">
              Get Response
            </h4>
            <p className="text-sm text-white/60 leading-relaxed font-mono">
              Receive the endpoint response instantly. Payment is settled on the
              destination chain, you get your data.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

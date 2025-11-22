export default function HowItWorks() {
  return (
    <div className="space-y-4">
      <h3 className="text-xs font-mono text-white/60 uppercase tracking-wider mb-4">
        How It Works
      </h3>

      <div className="bg-white/5 border border-white/10 p-4 hover:bg-white/10 transition-colors">
        <div className="flex items-start gap-3">
          <div className="w-6 h-6 bg-white text-black font-bold flex items-center justify-center text-xs flex-shrink-0">
            1
          </div>
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider mb-1">
              Choose Your Endpoint
            </h4>
            <p className="text-xs text-white/60 leading-relaxed font-mono">
              Pick any X402 endpoint on Base or Polygon you want to call. Works
              from code, AI agents, or manual testing.
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white/5 border border-white/10 p-4 hover:bg-white/10 transition-colors">
        <div className="flex items-start gap-3">
          <div className="w-6 h-6 bg-white text-black font-bold flex items-center justify-center text-xs flex-shrink-0">
            2
          </div>
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider mb-1">
              Sign the Payment
            </h4>
            <p className="text-xs text-white/60 leading-relaxed font-mono">
              One signature in your wallet using secure EIP-3009 standard. No
              need to worry about which chain you're on.
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white/5 border border-white/10 p-4 hover:bg-white/10 transition-colors">
        <div className="flex items-start gap-3">
          <div className="w-6 h-6 bg-white text-black font-bold flex items-center justify-center text-xs flex-shrink-0">
            3
          </div>
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider mb-1">
              We Route Cross-Chain
            </h4>
            <p className="text-xs text-white/60 leading-relaxed font-mono">
              Our protocol handles all cross-chain complexity using LayerZero
              OFT. Your payment reaches the right chain automatically.
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white/5 border border-white/10 p-4 hover:bg-white/10 transition-colors">
        <div className="flex items-start gap-3">
          <div className="w-6 h-6 bg-white text-black font-bold flex items-center justify-center text-xs flex-shrink-0">
            4
          </div>
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider mb-1">
              Get Your Response
            </h4>
            <p className="text-xs text-white/60 leading-relaxed font-mono">
              Receive the endpoint response instantly. Payment is settled on the
              destination chain, you get your data.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

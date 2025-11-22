export default function HowItWorks() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="bg-white/5 border border-white/10 p-6 hover:bg-white/10 transition-colors">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 bg-white text-black font-bold flex items-center justify-center text-sm">
            1
          </div>
          <h3 className="text-sm font-bold uppercase tracking-wider">
            Choose Endpoint
          </h3>
        </div>
        <p className="text-xs text-white/60 leading-relaxed font-mono">
          Enter any X402 endpoint URL (more chains coming soon)
        </p>
      </div>

      <div className="bg-white/5 border border-white/10 p-6 hover:bg-white/10 transition-colors">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 bg-white text-black font-bold flex items-center justify-center text-sm">
            2
          </div>
          <h3 className="text-sm font-bold uppercase tracking-wider">
            Auto Routing
          </h3>
        </div>
        <p className="text-xs text-white/60 leading-relaxed font-mono">
          Protocol handles cross-chain payment routing via LayerZero OFT
        </p>
      </div>

      <div className="bg-white/5 border border-white/10 p-6 hover:bg-white/10 transition-colors">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 bg-white text-black font-bold flex items-center justify-center text-sm">
            3
          </div>
          <h3 className="text-sm font-bold uppercase tracking-wider">
            Get Response
          </h3>
        </div>
        <p className="text-xs text-white/60 leading-relaxed font-mono">
          Receive the response instantly, payment settled on destination chain
        </p>
      </div>
    </div>
  );
}

export default function TryItOut() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Request Form */}
      <div className="bg-white/5 border border-white/10">
        <div className="border-b border-white/10 px-6 py-4 bg-white/5">
          <h3 className="text-xs font-mono text-white/80 uppercase tracking-wider">
            Try It Out
          </h3>
        </div>
        <div className="p-8 space-y-6">
          <div>
            <label className="block text-xs font-mono text-white/60 uppercase tracking-wider mb-2">
              Endpoint URL
            </label>
            <input
              type="text"
              placeholder="https://api.example.com/endpoint"
              className="w-full bg-black border border-white/20 px-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:border-white/40 transition-colors font-mono text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-mono text-white/60 uppercase tracking-wider mb-2">
              Request Body (JSON)
            </label>
            <textarea
              rows={8}
              placeholder='{"key": "value"}'
              className="w-full bg-black border border-white/20 px-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:border-white/40 transition-colors font-mono text-sm resize-none"
            />
          </div>

          <button className="group relative w-full px-8 py-4 bg-black border border-white text-white overflow-hidden cursor-pointer">
            <div className="absolute inset-0 bg-white translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out"></div>
            <span className="relative z-10 text-sm font-bold tracking-[0.15em] group-hover:text-black transition-colors duration-300">
              TRY REQUEST
            </span>
          </button>
        </div>
      </div>

      {/* Response Section */}
      <div className="bg-white/5 border border-white/10">
        <div className="border-b border-white/10 px-6 py-4 bg-white/5">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-mono text-white/80 uppercase tracking-wider">
              Response
            </h3>
            <span className="text-xs font-mono text-white/40">
              // Waiting...
            </span>
          </div>
        </div>
        <div className="p-8">
          <div className="bg-black border border-white/20 p-4 min-h-[300px]">
            <pre className="text-xs font-mono text-white/60 whitespace-pre-wrap">
              {`{
  // Response will appear here after sending request
}`}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import { useAccount } from "wagmi";
import { useOmnix402 } from "@/hooks/useOmnix402";

export default function TryItOut() {
  const [endpointUrl, setEndpointUrl] = useState("");
  const [requestBody, setRequestBody] = useState("");

  const { isConnected } = useAccount();
  const { loading, error, response, status, callEndpoint } = useOmnix402();

  const handleTryRequest = async () => {
    try {
      let parsedBody = {};

      // Parse body only if not empty
      if (requestBody.trim()) {
        parsedBody = JSON.parse(requestBody);
      }

      await callEndpoint(endpointUrl, parsedBody);
    } catch (err: any) {
      // Error is already handled by the hook
      console.error("Request failed:", err);
    }
  };

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
              Destination Endpoint URL
            </label>
            <input
              type="text"
              value={endpointUrl}
              onChange={(e) => setEndpointUrl(e.target.value)}
              placeholder="https://x402-service.com/endpoint"
              className="w-full bg-black border border-white/20 px-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:border-white/40 transition-colors font-mono text-sm"
            />
            <p className="text-xs font-mono text-white/40 mt-2">
              The X402 endpoint you want to call (on Base or Polygon)
            </p>
          </div>

          <div>
            <label className="block text-xs font-mono text-white/60 uppercase tracking-wider mb-2">
              Request Body (JSON) — Optional
            </label>
            <textarea
              rows={8}
              value={requestBody}
              onChange={(e) => setRequestBody(e.target.value)}
              placeholder='{"key": "value"} or leave empty'
              className="w-full bg-black border border-white/20 px-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:border-white/40 transition-colors font-mono text-sm resize-none"
            />
          </div>

          {error && (
            <div className="text-xs font-mono text-red-400 bg-red-500/10 border border-red-500/30 px-3 py-2">
              {error}
            </div>
          )}

          <button
            onClick={handleTryRequest}
            disabled={loading || !isConnected}
            className="group relative w-full px-8 py-4 bg-black border border-white text-white overflow-hidden cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div className="absolute inset-0 bg-white translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out"></div>
            <span className="relative z-10 text-sm font-bold tracking-[0.15em] group-hover:text-black transition-colors duration-300">
              {loading
                ? "PROCESSING..."
                : !isConnected
                ? "CONNECT WALLET"
                : "TRY REQUEST"}
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
            <span className="text-xs font-mono text-white/40">{status}</span>
          </div>
        </div>
        <div className="p-8">
          <div className="bg-black border border-white/20 p-4 min-h-[300px] overflow-auto">
            <pre className="text-xs font-mono text-white/80 whitespace-pre-wrap">
              {response
                ? JSON.stringify(response, null, 2)
                : `{
  // Response will appear here after sending request
}`}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}

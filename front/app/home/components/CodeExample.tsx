"use client";

import { useState } from "react";

export default function CodeExample() {
  const [copied, setCopied] = useState(false);

  const exampleCode = `// Call endpoint on Base from Polygon (more chains coming soon)
const response = await fetch(
  'https://omnix402.com/api?endpoint=https://x402.service.com&network=polygon',
  {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      // Your endpoint parameters
      token: "BTC",
      chain: "ethereum"
    })
  }
);`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(exampleCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-white/5 border border-white/10">
      <div className="border-b border-white/10 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-xs font-mono text-white/60 uppercase tracking-wider">
            API Usage Example
          </span>
          <span className="text-xs font-mono text-white/40">
            // From Polygon to Base endpoint
          </span>
        </div>
        <button
          onClick={copyToClipboard}
          className="px-3 py-1 text-xs font-mono uppercase tracking-wider border border-white/20 hover:bg-white hover:text-black transition-all"
        >
          {copied ? "✓ Copied" : "Copy Code"}
        </button>
      </div>
      <div className="p-6 bg-black/50">
        <pre className="text-xs font-mono text-white/80 overflow-x-auto leading-relaxed">
          {exampleCode}
        </pre>
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";

export default function CodeExample() {
  const [copied, setCopied] = useState(false);

  const exampleCode = `// Step 1: Get payment requirements from Omnix402
const requirementsResponse = await fetch(
  'https://omnix402.com/api?endpoint=https://x402.service.com&network=polygon',
  { method: 'GET' }
);
const requirements = await requirementsResponse.json(); // 402 Payment Required

// Step 2: Sign payment with your wallet and call endpoint with X-PAYMENT header
const paymentPayload = await signPayment(requirements); // User signs with wallet
const response = await fetch(
  'https://omnix402.com/api',
  {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'X-PAYMENT': btoa(JSON.stringify(paymentPayload))
    },
    body: JSON.stringify({
      token: "BTC",
      chain: "ethereum"
    })
  }
);
// Protocol handles cross-chain routing automatically via LayerZero OFT`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(exampleCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-white/5 border border-white/10">
      <div className="border-b border-white/10 px-3 sm:px-4 md:px-6 py-3 md:py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 min-w-0">
          <span className="text-xs font-mono text-white/60 uppercase tracking-wider shrink-0">
            API Usage Example
          </span>
          <span className="text-xs font-mono text-white/40 truncate">
            // Call endpoint on Base from Polygon
          </span>
        </div>
        <button
          onClick={copyToClipboard}
          className="px-3 py-1.5 text-xs font-mono uppercase tracking-wider border border-white/20 hover:bg-white hover:text-black transition-all shrink-0 w-full sm:w-auto"
        >
          {copied ? "✓ Copied" : "Copy Code"}
        </button>
      </div>
      <div className="p-4 sm:p-6 md:p-8 bg-black overflow-x-auto">
        <pre className="text-xs sm:text-sm font-mono leading-relaxed sm:leading-loose whitespace-pre">
          <span className="text-white/50">
            // Step 1: Get payment requirements from Omnix402
          </span>
          {"\n"}
          <span className="text-white">
            const requirementsResponse = await fetch(
          </span>
          {"\n"}
          <span className="text-white"> </span>
          <span className="text-emerald-400">
            'https://omnix402.com/api?endpoint=https://x402.service.com&network=polygon'
          </span>
          <span className="text-white">,</span>
          {"\n"}
          <span className="text-white"> {"{ "}method: </span>
          <span className="text-emerald-400">'GET'</span>
          <span className="text-white"> {"}"}</span>
          {"\n"}
          <span className="text-white">);</span>
          {"\n"}
          <span className="text-white">
            const requirements = await requirementsResponse.json();{" "}
          </span>
          <span className="text-white/50">// 402 Payment Required</span>
          {"\n\n"}
          <span className="text-white/50">
            // Step 2: Sign payment with your wallet
          </span>
          {"\n"}
          <span className="text-white">
            const paymentPayload = await signPayment(requirements);{" "}
          </span>
          <span className="text-white/50">// User signs</span>
          {"\n"}
          <span className="text-white">const response = await fetch(</span>
          {"\n"}
          <span className="text-white"> </span>
          <span className="text-emerald-400">'https://omnix402.com/api'</span>
          <span className="text-white">,</span>
          {"\n"}
          <span className="text-white"> {"{"}</span>
          {"\n"}
          <span className="text-white"> method: </span>
          <span className="text-emerald-400">'POST'</span>
          <span className="text-white">,</span>
          {"\n"}
          <span className="text-white"> headers: {"{ "}</span>
          {"\n"}
          <span className="text-white"> </span>
          <span className="text-emerald-400">'Content-Type'</span>
          <span className="text-white">: </span>
          <span className="text-emerald-400">'application/json'</span>
          <span className="text-white">,</span>
          {"\n"}
          <span className="text-white"> </span>
          <span className="text-orange-400 font-semibold">'X-PAYMENT'</span>
          <span className="text-white">
            : btoa(JSON.stringify(paymentPayload))
          </span>
          {"\n"}
          <span className="text-white"> {"}"},</span>
          {"\n"}
          <span className="text-white">
            {" "}
            body: JSON.stringify({"{"} token:{" "}
          </span>
          <span className="text-emerald-400">"BTC"</span>
          <span className="text-white">, chain: </span>
          <span className="text-emerald-400">"ethereum"</span>
          <span className="text-white"> {"}"})</span>
          {"\n"}
          <span className="text-white"> {"}"}</span>
          {"\n"}
          <span className="text-white">);</span>
          {"\n"}
          <span className="text-white/50">
            // Protocol handles cross-chain routing automatically via LayerZero
            OFT
          </span>
        </pre>
      </div>
    </div>
  );
}

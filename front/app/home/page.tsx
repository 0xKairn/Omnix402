"use client";

import Header from "../components/Header";
import HowItWorks from "./components/HowItWorks";
import CodeExample from "./components/CodeExample";
import TryItOut from "./components/TryItOut";
import RecentActivity from "./components/RecentActivity";

export default function Home() {
  // Mock data for endpoint history
  const endpointHistory = [
    {
      id: 1,
      endpoint: "x402.service.com/analyze",
      sourceChain: "Polygon",
      destChain: "Base",
      cost: "0.50 USDO",
      status: "Success",
      timestamp: "2 min ago",
    },
    {
      id: 2,
      endpoint: "api.openai.com/chat",
      sourceChain: "Base",
      destChain: "Polygon",
      cost: "2.00 USDO",
      status: "Success",
      timestamp: "15 min ago",
    },
    {
      id: 3,
      endpoint: "api.coingecko.com/price",
      sourceChain: "Polygon",
      destChain: "Base",
      cost: "0.10 USDO",
      status: "Pending",
      timestamp: "1 hour ago",
    },
  ];

  return (
    <div className="min-h-screen bg-black text-white font-sans">
      <Header showConnectWallet={true} />

      <main className="max-w-7xl mx-auto px-8 py-12">
        {/* Call Endpoint Section */}
        <div className="mb-12">
          <h2 className="text-sm font-mono text-white/40 uppercase tracking-widest mb-6">
            Call Cross-Chain Endpoint
          </h2>

          <div className="mb-8">
            <HowItWorks />
          </div>

          <div className="mb-8">
            <CodeExample />
          </div>

          <TryItOut />
        </div>

        {/* Recent Protocol Activity */}
        <RecentActivity activities={endpointHistory} />
      </main>
    </div>
  );
}

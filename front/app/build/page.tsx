"use client";

import Header from "../components/Header";
import Footer from "../components/Footer";
import HowItWorks from "./components/HowItWorks";
import CodeExample from "./components/CodeExample";
import Image from "next/image";
import { useState } from "react";
import { Omnix402Service } from "../../services/omnix402.service";

export default function Build() {
  const [demoLoading, setDemoLoading] = useState(false);
  const [direction, setDirection] = useState<
    "base-to-polygon" | "polygon-to-base"
  >("base-to-polygon");
  const [demoResult, setDemoResult] = useState<{
    txHash?: string;
    status?: string;
    message?: string;
  } | null>(null);

  const handleRequestDemo = async () => {
    setDemoLoading(true);
    setDemoResult(null);
    try {
      const result = await Omnix402Service.requestDemo();
      setDemoResult(result);
    } catch (error) {
      console.error(error);
      setDemoResult({
        status: "error",
        message: "Failed to request demo. Backend might be offline.",
      });
    } finally {
      setDemoLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white font-sans">
      <Header showConnectWallet={true} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 py-8 md:py-12">
        <div className="space-y-16 md:space-y-24">
          {/* Hero Section */}
          <section className="mb-12 md:mb-20">
            <h1 className="text-3xl sm:text-4xl lg:text-6xl font-bold leading-tight tracking-tight mb-3 md:mb-4">
              How to Implement
              <br />
              Cross-Chain Payments
            </h1>
            <p className="text-2xl sm:text-3xl lg:text-4xl text-white/50 font-light">
              for AI Agents
            </p>
          </section>

          {/* Integration Section */}
          <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8">
            <div className="lg:col-span-8">
              <h2 className="text-xs md:text-sm font-mono text-white/40 uppercase tracking-widest mb-4 md:mb-6">
                Integration Example
              </h2>
              <CodeExample />
            </div>

            <div className="lg:col-span-4">
              <HowItWorks />
            </div>
          </section>

          {/* Live Demo Section */}
          <section className="max-w-5xl mx-auto">
            <h2 className="text-xs md:text-sm font-mono text-white/40 uppercase tracking-widest mb-6 md:mb-8 text-center">
              Live Demo
            </h2>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
              {/* Left: Controls */}
              <div className="space-y-4 md:space-y-6">
                <div>
                  <label className="text-xs text-white/40 uppercase tracking-wider mb-3 block">
                    Select Direction
                  </label>
                  <div className="space-y-2 md:space-y-3">
                    <button
                      onClick={() => setDirection("base-to-polygon")}
                      className={`w-full flex items-center justify-between p-3 md:p-4 border transition-all ${
                        direction === "base-to-polygon"
                          ? "bg-white/10 border-white/30"
                          : "bg-white/5 border-white/10 hover:border-white/20"
                      }`}
                    >
                      <div className="flex items-center gap-2 md:gap-3">
                        <svg
                          width="18"
                          height="18"
                          className="md:w-[20px] md:h-[20px]"
                          viewBox="0 0 111 111"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            d="M54.921 110.034C85.359 110.034 110.034 85.402 110.034 55.017C110.034 24.6319 85.359 0 54.921 0C26.0432 0 2.35281 22.1714 0 50.3923H72.8467V59.6416H0C2.35281 87.8625 26.0432 110.034 54.921 110.034Z"
                            fill="white"
                          />
                        </svg>
                        <span className="text-xs md:text-sm font-medium text-white">
                          Base
                        </span>
                      </div>
                      <svg
                        className="w-4 h-4 md:w-5 md:h-5 text-white/40"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M17 8l4 4m0 0l-4 4m4-4H3"
                        />
                      </svg>
                      <div className="flex items-center gap-2 md:gap-3">
                        <span className="text-xs md:text-sm font-medium text-white">
                          Polygon
                        </span>
                        <svg
                          width="20"
                          height="20"
                          viewBox="0 0 38.4 33.5"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            d="M29,10.2c-0.7-0.4-1.6-0.4-2.4,0L21,13.5l-3.8,2.1l-5.5,3.3c-0.7,0.4-1.6,0.4-2.4,0L5,16.3 c-0.7-0.4-1.2-1.2-1.2-2.1v-5c0-0.8,0.4-1.6,1.2-2.1l4.3-2.5c0.7-0.4,1.6-0.4,2.4,0L16,7.2c0.7,0.4,1.2,1.2,1.2,2.1v3.3l3.8-2.2V7 c0-0.8-0.4-1.6-1.2-2.1l-8-4.7c-0.7-0.4-1.6-0.4-2.4,0L1.2,5C0.4,5.4,0,6.2,0,7v9.4c0,0.8,0.4,1.6,1.2,2.1l8.1,4.7 c0.7,0.4,1.6,0.4,2.4,0l5.5-3.2l3.8-2.2l5.5-3.2c0.7-0.4,1.6-0.4,2.4,0l4.3,2.5c0.7,0.4,1.2,1.2,1.2,2.1v5c0,0.8-0.4,1.6-1.2,2.1 L29,28.8c-0.7,0.4-1.6,0.4-2.4,0l-4.3-2.5c-0.7-0.4-1.2-1.2-1.2-2.1V21l-3.8,2.2v3.3c0,0.8,0.4,1.6,1.2,2.1l8.1,4.7 c0.7,0.4,1.6,0.4,2.4,0l8.1-4.7c0.7-0.4,1.2-1.2,1.2-2.1V17c0-0.8-0.4-1.6-1.2-2.1L29,10.2z"
                            fill="white"
                          />
                        </svg>
                      </div>
                    </button>

                    <button
                      onClick={() => setDirection("polygon-to-base")}
                      className={`w-full flex items-center justify-between p-3 md:p-4 border transition-all ${
                        direction === "polygon-to-base"
                          ? "bg-white/10 border-white/30"
                          : "bg-white/5 border-white/10 hover:border-white/20"
                      }`}
                    >
                      <div className="flex items-center gap-2 md:gap-3">
                        <svg
                          width="18"
                          height="18"
                          className="md:w-[20px] md:h-[20px]"
                          viewBox="0 0 38.4 33.5"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            d="M29,10.2c-0.7-0.4-1.6-0.4-2.4,0L21,13.5l-3.8,2.1l-5.5,3.3c-0.7,0.4-1.6,0.4-2.4,0L5,16.3 c-0.7-0.4-1.2-1.2-1.2-2.1v-5c0-0.8,0.4-1.6,1.2-2.1l4.3-2.5c0.7-0.4,1.6-0.4,2.4,0L16,7.2c0.7,0.4,1.2,1.2,1.2,2.1v3.3l3.8-2.2V7 c0-0.8-0.4-1.6-1.2-2.1l-8-4.7c-0.7-0.4-1.6-0.4-2.4,0L1.2,5C0.4,5.4,0,6.2,0,7v9.4c0,0.8,0.4,1.6,1.2,2.1l8.1,4.7 c0.7,0.4,1.6,0.4,2.4,0l5.5-3.2l3.8-2.2l5.5-3.2c0.7-0.4,1.6-0.4,2.4,0l4.3,2.5c0.7,0.4,1.2,1.2,1.2,2.1v5c0,0.8-0.4,1.6-1.2,2.1 L29,28.8c-0.7,0.4-1.6,0.4-2.4,0l-4.3-2.5c-0.7-0.4-1.2-1.2-1.2-2.1V21l-3.8,2.2v3.3c0,0.8,0.4,1.6,1.2,2.1l8.1,4.7 c0.7,0.4,1.6,0.4,2.4,0l8.1-4.7c0.7-0.4,1.2-1.2,1.2-2.1V17c0-0.8-0.4-1.6-1.2-2.1L29,10.2z"
                            fill="white"
                          />
                        </svg>
                        <span className="text-xs md:text-sm font-medium text-white">
                          Polygon
                        </span>
                      </div>
                      <svg
                        className="w-4 h-4 md:w-5 md:h-5 text-white/40"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M17 8l4 4m0 0l-4 4m4-4H3"
                        />
                      </svg>
                      <div className="flex items-center gap-2 md:gap-3">
                        <span className="text-xs md:text-sm font-medium text-white">
                          Base
                        </span>
                        <svg
                          width="18"
                          height="18"
                          className="md:w-[20px] md:h-[20px]"
                          viewBox="0 0 111 111"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            d="M54.921 110.034C85.359 110.034 110.034 85.402 110.034 55.017C110.034 24.6319 85.359 0 54.921 0C26.0432 0 2.35281 22.1714 0 50.3923H72.8467V59.6416H0C2.35281 87.8625 26.0432 110.034 54.921 110.034Z"
                            fill="white"
                          />
                        </svg>
                      </div>
                    </button>
                  </div>
                </div>

                <button
                  onClick={handleRequestDemo}
                  disabled={demoLoading}
                  className="w-full px-4 md:px-6 py-3 md:py-4 bg-white text-black text-xs md:text-sm font-bold uppercase tracking-wider hover:bg-white/90 transition-all disabled:opacity-50"
                >
                  {demoLoading ? "Processing..." : "Execute Transaction"}
                </button>
              </div>

              {/* Right: Results */}
              <div className="bg-white/5 border border-white/10 p-4 md:p-6 min-h-[350px] md:min-h-[400px] flex flex-col">
                <div className="text-xs text-white/40 uppercase tracking-wider mb-4">
                  Transaction Log
                </div>

                {!demoLoading && !demoResult && (
                  <div className="flex-1 flex items-center justify-center text-white/30 text-xs md:text-sm">
                    Waiting for transaction...
                  </div>
                )}

                {demoLoading && (
                  <div className="flex-1 space-y-2 md:space-y-3 font-mono text-[10px] md:text-xs text-white/60">
                    <div className="flex items-center gap-2">
                      <div className="w-1 h-1 rounded-full bg-white/60 animate-pulse"></div>
                      <span>Initializing payment request...</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-1 h-1 rounded-full bg-white/60 animate-pulse"></div>
                      <span>Calling API endpoint...</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-1 h-1 rounded-full bg-white/60 animate-pulse"></div>
                      <span>Processing transaction...</span>
                    </div>
                  </div>
                )}

                {demoResult && (
                  <div className="flex-1 space-y-3 md:space-y-4 font-mono text-[10px] md:text-xs">
                    <div className="space-y-1.5 md:space-y-2">
                      <div className="text-white/40">Request:</div>
                      <div className="text-white/70">
                        POST /api/demo/payment
                      </div>
                    </div>

                    <div className="border-t border-white/10 pt-3 md:pt-4 space-y-1.5 md:space-y-2">
                      <div className="text-white/40">Response:</div>
                      <div className="space-y-1 md:space-y-1.5">
                        <div
                          className={
                            demoResult.status === "error"
                              ? "text-red-400 font-bold"
                              : "text-emerald-400 font-bold"
                          }
                        >
                          Status: {demoResult.status || "success"}
                        </div>
                        <div className="text-white/70">
                          Direction:{" "}
                          {direction === "base-to-polygon"
                            ? "Base → Polygon"
                            : "Polygon → Base"}
                        </div>
                        {demoResult.txHash && (
                          <div className="text-white/80 break-all">
                            TX: {demoResult.txHash}
                          </div>
                        )}
                        {demoResult.message && (
                          <div className="text-white/60 mt-1.5 md:mt-2 pt-1.5 md:pt-2 border-t border-white/10">
                            {demoResult.message}
                          </div>
                        )}
                      </div>
                    </div>

                    <div
                      className={`pt-3 md:pt-4 border-t border-white/10 ${
                        demoResult.status === "error"
                          ? "text-red-400"
                          : "text-emerald-400"
                      }`}
                    >
                      {demoResult.status === "error"
                        ? "✗ Transaction Failed"
                        : "✓ Transaction Successful"}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* Workflow Section */}
          <section className="flex flex-col items-center">
            <h2 className="text-xs md:text-sm font-mono text-white/40 uppercase tracking-widest mb-4 md:mb-6 text-center">
              Detailed Workflow
            </h2>
            <div className="w-full max-w-5xl bg-white/5 border border-white/10 p-2 md:p-4 mb-16 md:mb-24">
              <Image
                src="/assets/workflow.png"
                alt="Omnix402 Workflow"
                width={1200}
                height={800}
                className="w-full h-auto object-contain opacity-90 hover:opacity-100 transition-opacity"
                priority
              />
            </div>
          </section>

          {/* Contact Section */}
          <section className="flex flex-col items-center max-w-3xl mx-auto text-center border-t border-white/10 pt-12 md:pt-16">
            <h2 className="text-xs md:text-sm font-mono text-white/40 uppercase tracking-widest mb-3 md:mb-4">
              Need Help?
            </h2>
            <p className="text-sm md:text-base text-white/60 mb-4 md:mb-6 px-4">
              Don't hesitate to contact us if you have any issues or questions
              about the implementation.
            </p>
            <a
              href="https://t.me/looper_d3v"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 md:gap-3 px-4 md:px-6 py-2.5 md:py-3 bg-white/5 border border-white/10 hover:border-white/30 hover:bg-white/10 transition-all text-white text-sm md:text-base"
            >
              <svg
                className="w-4 h-4 md:w-5 md:h-5"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.562 8.161c-.18 1.897-.962 6.502-1.359 8.627-.168.9-.5 1.201-.82 1.23-.697.064-1.226-.461-1.901-.903-1.056-.693-1.653-1.124-2.678-1.8-1.185-.781-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.139-5.062 3.345-.479.329-.913.489-1.302.481-.428-.008-1.252-.241-1.865-.44-.752-.244-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.831-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635.099-.002.321.023.465.141.121.098.155.231.171.324.016.093.036.305.02.469z" />
              </svg>
              <span className="font-mono text-xs md:text-sm">@looper_d3v</span>
            </a>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
}

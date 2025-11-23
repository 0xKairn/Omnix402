"use client";

import { useEffect, useState } from "react";
import { Omnix402Service } from "@/services/omnix402.service";

interface DemoStatusProps {
  callId: string;
}

interface CallStatus {
  sourceChainName: string;
  destinationChainName: string;
  sourcePaymentStatus?: string;
  sourcePaymentTxHash?: string;
  verifyStatus?: string;
  verifyHash?: string;
  relayStatus?: string;
  relayHash?: string;
  executionStatus?: string;
  executionHash?: string;
  destPaymentStatus?: string;
  destPaymentTxHash?: string;
  xPaymentResponse?: any;
  bodyResponse?: any;
  createdAt?: string;
  updatedAt?: string;
}

const NetworkLogo = ({ chainName }: { chainName: string }) => {
  const chain = chainName.toLowerCase();

  if (chain === "base") {
    return (
      <svg
        width="16"
        height="16"
        viewBox="0 0 111 111"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M54.921 110.034C85.359 110.034 110.034 85.402 110.034 55.017C110.034 24.6319 85.359 0 54.921 0C26.0432 0 2.35281 22.1714 0 50.3923H72.8467V59.6416H0C2.35281 87.8625 26.0432 110.034 54.921 110.034Z"
          fill="white"
        />
      </svg>
    );
  }

  if (chain === "polygon") {
    return (
      <svg
        width="16"
        height="16"
        viewBox="0 0 38.4 33.5"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M29,10.2c-0.7-0.4-1.6-0.4-2.4,0L21,13.5l-3.8,2.1l-5.5,3.3c-0.7,0.4-1.6,0.4-2.4,0L5,16.3 c-0.7-0.4-1.2-1.2-1.2-2.1v-5c0-0.8,0.4-1.6,1.2-2.1l4.3-2.5c0.7-0.4,1.6-0.4,2.4,0L16,7.2c0.7,0.4,1.2,1.2,1.2,2.1v3.3l3.8-2.2V7 c0-0.8-0.4-1.6-1.2-2.1l-8-4.7c-0.7-0.4-1.6-0.4-2.4,0L1.2,5C0.4,5.4,0,6.2,0,7v9.4c0,0.8,0.4,1.6,1.2,2.1l8.1,4.7 c0.7,0.4,1.6,0.4,2.4,0l5.5-3.2l3.8-2.2l5.5-3.2c0.7-0.4,1.6-0.4,2.4,0l4.3,2.5c0.7,0.4,1.2,1.2,1.2,2.1v5c0,0.8-0.4,1.6-1.2,2.1 L29,28.8c-0.7,0.4-1.6,0.4-2.4,0l-4.3-2.5c-0.7-0.4-1.2-1.2-1.2-2.1V21l-3.8,2.2v3.3c0,0.8,0.4,1.6,1.2,2.1l8.1,4.7 c0.7,0.4,1.6,0.4,2.4,0l8.1-4.7c0.7-0.4,1.2-1.2,1.2-2.1V17c0-0.8-0.4-1.6-1.2-2.1L29,10.2z"
          fill="white"
        />
      </svg>
    );
  }

  return null;
};

const getExplorerUrl = (chainName: string, txHash: string) => {
  const chain = chainName.toLowerCase();
  if (chain === "base") {
    return `https://basescan.org/tx/${txHash}`;
  }
  if (chain === "polygon") {
    return `https://polygonscan.com/tx/${txHash}`;
  }
  return "#";
};

const Loader = () => (
  <div className="inline-block w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
);

const StatusIcon = ({ status }: { status?: string }) => {
  if (!status) {
    return <Loader />;
  }

  const normalizedStatus = status.toLowerCase();

  if (normalizedStatus === "pending") {
    return <Loader />;
  }
  if (
    normalizedStatus === "success" ||
    normalizedStatus === "completed" ||
    normalizedStatus === "confirmed"
  ) {
    return (
      <div className="w-5 h-5 rounded-full bg-green-500/20 border border-green-500 flex items-center justify-center">
        <svg
          className="w-3 h-3 text-green-500"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M5 13l4 4L19 7"
          />
        </svg>
      </div>
    );
  }
  return (
    <div className="w-5 h-5 rounded-full bg-red-500/20 border border-red-500 flex items-center justify-center">
      <svg
        className="w-3 h-3 text-red-500"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M6 18L18 6M6 6l12 12"
        />
      </svg>
    </div>
  );
};

export default function DemoStatus({ callId }: DemoStatusProps) {
  const [status, setStatus] = useState<CallStatus | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isComplete, setIsComplete] = useState(false);
  const [startTime] = useState(Date.now());
  const [elapsedTime, setElapsedTime] = useState(0);

  useEffect(() => {
    let intervalId: NodeJS.Timeout;
    let timeIntervalId: NodeJS.Timeout;

    const fetchStatus = async () => {
      try {
        const data = await Omnix402Service.getCallStatus(callId);
        setStatus(data);

        // Check if everything is complete - only stop when we have xPaymentResponse
        if (data.xPaymentResponse) {
          setIsComplete(true);
          if (intervalId) clearInterval(intervalId);
          if (timeIntervalId) clearInterval(timeIntervalId);
        }
      } catch (err: any) {
        setError(err.message);
        if (intervalId) clearInterval(intervalId);
        if (timeIntervalId) clearInterval(timeIntervalId);
      }
    };

    // Fetch immediately
    fetchStatus();

    // Poll every 2 seconds if not complete
    if (!isComplete) {
      intervalId = setInterval(fetchStatus, 2000);
      // Update elapsed time every 100ms
      timeIntervalId = setInterval(() => {
        setElapsedTime(Date.now() - startTime);
      }, 100);
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
      if (timeIntervalId) clearInterval(timeIntervalId);
    };
  }, [callId, isComplete, startTime]);

  if (error) {
    return (
      <div className="bg-red-500/10 border border-red-500/50 p-6">
        <div className="flex items-start gap-3">
          <div className="w-5 h-5 rounded-full bg-red-500/20 border border-red-500 flex items-center justify-center shrink-0">
            <svg
              className="w-3 h-3 text-red-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </div>
          <div>
            <h4 className="text-sm font-bold text-red-400 uppercase tracking-wider mb-1">
              Error
            </h4>
            <p className="text-xs text-red-400/80 font-mono">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!status) {
    return (
      <div className="bg-white/5 border border-white/10 p-6 flex items-center justify-center gap-3">
        <Loader />
        <span className="text-sm font-mono text-white/60">
          Loading status...
        </span>
      </div>
    );
  }

  const formatTime = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    const seconds = (ms / 1000).toFixed(1);
    return `${seconds}s`;
  };

  return (
    <div className="space-y-4">
      {/* Header with route info */}
      <div className="bg-white/5 border border-white/10 p-4 md:p-6">
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-mono text-white/60 uppercase tracking-wider">
              Demo Transaction
            </h3>
            <div className="text-xs font-mono text-white">
              {isComplete ? (
                <span>{formatTime(elapsedTime)}</span>
              ) : (
                <span>{formatTime(elapsedTime)}</span>
              )}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4 justify-center">
            <div className="flex items-center gap-2">
              <NetworkLogo chainName={status.sourceChainName} />
              <span className="text-sm font-mono uppercase">
                {status.sourceChainName}
              </span>
            </div>
            <svg
              className="w-5 h-5 sm:w-6 sm:h-6 text-white/40 rotate-90 sm:rotate-0"
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
            <div className="flex items-center gap-2">
              <NetworkLogo chainName={status.destinationChainName} />
              <span className="text-sm font-mono uppercase">
                {status.destinationChainName}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Transaction steps */}
      <div className="space-y-3">
        {/* Step 1: Source Payment */}
        <div className="bg-white/5 border border-white/10 p-3 md:p-4">
          <div className="flex items-start gap-3 md:gap-4">
            <StatusIcon status={status.sourcePaymentStatus} />
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2 mb-1">
                <h4 className="text-xs md:text-sm font-bold uppercase tracking-wider">
                  1. Payment on {status.sourceChainName} with USD0
                </h4>

                {status.sourcePaymentTxHash && (
                  <a
                    href={getExplorerUrl(
                      status.sourceChainName,
                      status.sourcePaymentTxHash
                    )}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-xs font-mono text-white/60 hover:text-white transition-colors shrink-0"
                  >
                    <NetworkLogo chainName={status.sourceChainName} />
                    <span className="hidden sm:inline">View Transaction</span>
                    <span className="sm:hidden">View TX</span>
                    <svg
                      className="w-3 h-3"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                      />
                    </svg>
                  </a>
                )}
              </div>
              <p className="text-xs text-white/60 font-mono">
                {status.sourcePaymentStatus?.toLowerCase() === "pending" &&
                  "Processing..."}
                {(status.sourcePaymentStatus?.toLowerCase() === "success" ||
                  status.sourcePaymentStatus?.toLowerCase() === "confirmed") &&
                  "Payment authorized and sent"}
                {!status.sourcePaymentStatus && "Waiting..."}
              </p>
            </div>
          </div>
        </div>

        {/* Step 2: DVN Verify */}
        <div className="bg-white/5 border border-white/10 p-3 md:p-4">
          <div className="flex items-start gap-3 md:gap-4">
            <StatusIcon status={status.verifyStatus} />
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2 mb-1">
                <h4 className="text-xs md:text-sm font-bold uppercase tracking-wider">
                  2. DVN Verification (bridge)
                </h4>
                {status.verifyHash && (
                  <a
                    href={getExplorerUrl(
                      status.destinationChainName,
                      status.verifyHash
                    )}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-xs font-mono text-white/60 hover:text-white transition-colors shrink-0"
                  >
                    <NetworkLogo chainName={status.destinationChainName} />
                    <span className="hidden sm:inline">View Transaction</span>
                    <span className="sm:hidden">View TX</span>
                    <svg
                      className="w-3 h-3"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                      />
                    </svg>
                  </a>
                )}
              </div>
              <p className="text-xs text-white/60 font-mono">
                {status.verifyStatus?.toLowerCase() === "pending" &&
                  "Verifying message..."}
                {(status.verifyStatus?.toLowerCase() === "success" ||
                  status.verifyStatus?.toLowerCase() === "confirmed") &&
                  "Message verified by DVN"}
                {!status.verifyStatus && "Waiting for payment..."}
              </p>
            </div>
          </div>
        </div>

        {/* Step 3: LayerZero Relay */}
        <div className="bg-white/5 border border-white/10 p-3 md:p-4">
          <div className="flex items-start gap-3 md:gap-4">
            <StatusIcon status={status.relayStatus} />
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2 mb-1">
                <h4 className="text-xs md:text-sm font-bold uppercase tracking-wider">
                  3. Cross-Chain Relay (bridge)
                </h4>
                {status.relayHash && (
                  <a
                    href={getExplorerUrl(
                      status.destinationChainName,
                      status.relayHash
                    )}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-xs font-mono text-white/60 hover:text-white transition-colors shrink-0"
                  >
                    <NetworkLogo chainName={status.destinationChainName} />
                    <span className="hidden sm:inline">View Transaction</span>
                    <span className="sm:hidden">View TX</span>
                    <svg
                      className="w-3 h-3"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                      />
                    </svg>
                  </a>
                )}
              </div>
              <p className="text-xs text-white/60 font-mono">
                {status.relayStatus?.toLowerCase() === "pending" &&
                  "Relaying via LayerZero..."}
                {(status.relayStatus?.toLowerCase() === "success" ||
                  status.relayStatus?.toLowerCase() === "confirmed") &&
                  "Message relayed to destination"}
                {!status.relayStatus && "Waiting for verification..."}
              </p>
            </div>
          </div>
        </div>

        {/* Step 4: Execution */}
        <div className="bg-white/5 border border-white/10 p-3 md:p-4">
          <div className="flex items-start gap-3 md:gap-4">
            <StatusIcon status={status.executionStatus} />
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2 mb-1">
                <h4 className="text-xs md:text-sm font-bold uppercase tracking-wider">
                  4. Finalize the bridge on {status.destinationChainName}
                </h4>
                {status.executionHash && (
                  <a
                    href={getExplorerUrl(
                      status.destinationChainName,
                      status.executionHash
                    )}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-xs font-mono text-white/60 hover:text-white transition-colors shrink-0"
                  >
                    <NetworkLogo chainName={status.destinationChainName} />
                    <span className="hidden sm:inline">View Transaction</span>
                    <span className="sm:hidden">View TX</span>
                    <svg
                      className="w-3 h-3"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                      />
                    </svg>
                  </a>
                )}
              </div>
              <p className="text-xs text-white/60 font-mono">
                {status.executionStatus?.toLowerCase() === "pending" &&
                  "Executing payment..."}
                {(status.executionStatus?.toLowerCase() === "success" ||
                  status.executionStatus?.toLowerCase() === "confirmed" ||
                  status.executionStatus?.toLowerCase() === "completed") &&
                  "Payment executed successfully"}
                {!status.executionStatus && "Waiting for relay..."}
              </p>
            </div>
          </div>
        </div>

        {/* Step 5: Destination Payment */}
        {status.executionHash && (
          <div className="bg-white/5 border border-white/10 p-3 md:p-4">
            <div className="flex items-start gap-3 md:gap-4">
              <StatusIcon status={status.destPaymentStatus} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <h4 className="text-xs md:text-sm font-bold uppercase tracking-wider">
                    5. Final Payment on {status.destinationChainName} with USDC
                  </h4>
                  {status.destPaymentTxHash && (
                    <a
                      href={getExplorerUrl(
                        status.destinationChainName,
                        status.destPaymentTxHash
                      )}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-xs font-mono text-white/60 hover:text-white transition-colors shrink-0"
                    >
                      <NetworkLogo chainName={status.destinationChainName} />
                      <span className="hidden sm:inline">View Transaction</span>
                      <span className="sm:hidden">View TX</span>
                      <svg
                        className="w-3 h-3"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                        />
                      </svg>
                    </a>
                  )}
                </div>
                <p className="text-xs text-white/60 font-mono">
                  {!status.destPaymentStatus && "Waiting..."}
                  {status.destPaymentStatus?.toLowerCase() === "pending" &&
                    "Processing final payment..."}
                  {(status.destPaymentStatus?.toLowerCase() === "success" ||
                    status.destPaymentStatus?.toLowerCase() === "confirmed") &&
                    "Payment confirmed on destination"}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* X402 Response */}
      {(status.executionStatus?.toLowerCase() === "confirmed" ||
        status.executionStatus?.toLowerCase() === "success" ||
        status.executionStatus?.toLowerCase() === "completed" ||
        status.xPaymentResponse) && (
        <div className="bg-white/5 border border-white/20 p-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold uppercase tracking-wider flex items-center gap-2">
                {status.xPaymentResponse ? (
                  <div className="w-5 h-5 rounded-full bg-green-500/20 border border-green-500 flex items-center justify-center">
                    <svg
                      className="w-3 h-3 text-green-500"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  </div>
                ) : (
                  <Loader />
                )}
                <span>
                  {status.xPaymentResponse
                    ? "X402 Response Received"
                    : "Waiting for X402 Response..."}
                </span>
              </h4>
              <div className="text-xs font-mono text-white/60">
                {status.xPaymentResponse ? (
                  <>
                    Total time:{" "}
                    <span className="text-white">
                      {formatTime(elapsedTime)}
                    </span>
                  </>
                ) : (
                  <>
                    Elapsed:{" "}
                    <span className="text-white/80">
                      {formatTime(elapsedTime)}
                    </span>
                  </>
                )}
              </div>
            </div>

            {status.xPaymentResponse && (
              <>
                <div>
                  <div className="text-xs text-white/60 mb-2">
                    X402 Payment Response
                  </div>
                  <div className="bg-black/30 border border-white/10 p-4 rounded">
                    <pre className="text-xs font-mono text-white/80 overflow-x-auto">
                      {JSON.stringify(status.xPaymentResponse, null, 2)}
                    </pre>
                  </div>
                </div>

                {status.bodyResponse && (
                  <div>
                    <div className="text-xs text-white/60 mb-2">
                      Protected Content Response
                    </div>
                    <div className="bg-black/30 border border-white/10 p-4 rounded">
                      <pre className="text-xs font-mono text-white/80 overflow-x-auto">
                        {JSON.stringify(status.bodyResponse, null, 2)}
                      </pre>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

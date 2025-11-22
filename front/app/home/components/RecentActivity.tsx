interface Activity {
  id: number;
  endpoint: string;
  sourceChain: string;
  destChain: string;
  cost: string;
  status: string;
  timestamp: string;
}

interface RecentActivityProps {
  activities: Activity[];
}

export default function RecentActivity({ activities }: RecentActivityProps) {
  return (
    <div>
      <h2 className="text-sm font-mono text-white/40 uppercase tracking-widest mb-6">
        Recent Protocol Activity
      </h2>
      <div className="bg-white/5 border border-white/10">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10 bg-white/5">
                <th className="text-left px-6 py-4 text-xs font-mono text-white/60 uppercase tracking-wider">
                  Endpoint
                </th>
                <th className="text-left px-6 py-4 text-xs font-mono text-white/60 uppercase tracking-wider">
                  Source Chain
                </th>
                <th className="text-left px-6 py-4 text-xs font-mono text-white/60 uppercase tracking-wider">
                  Dest Chain
                </th>
                <th className="text-left px-6 py-4 text-xs font-mono text-white/60 uppercase tracking-wider">
                  Cost
                </th>
                <th className="text-left px-6 py-4 text-xs font-mono text-white/60 uppercase tracking-wider">
                  Status
                </th>
                <th className="text-right px-6 py-4 text-xs font-mono text-white/60 uppercase tracking-wider">
                  Time
                </th>
              </tr>
            </thead>
            <tbody>
              {activities.map((item) => (
                <tr
                  key={item.id}
                  className="border-b border-white/10 last:border-b-0 hover:bg-white/5 transition-colors"
                >
                  <td className="px-6 py-4 font-mono text-sm text-white">
                    {item.endpoint}
                  </td>
                  <td className="px-6 py-4 font-mono text-xs uppercase tracking-wider text-white/80">
                    {item.sourceChain}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <svg
                        className="w-3 h-3 text-white/40"
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
                      <span className="font-mono text-xs uppercase tracking-wider text-white/80">
                        {item.destChain}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 font-mono text-sm text-white/80">
                    {item.cost}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-block px-2 py-1 text-xs font-mono uppercase tracking-wider border ${
                        item.status === "Success"
                          ? "border-green-500/30 text-green-400 bg-green-500/10"
                          : "border-yellow-500/30 text-yellow-400 bg-yellow-500/10"
                      }`}
                    >
                      {item.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right text-xs font-mono text-white/60">
                    {item.timestamp}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

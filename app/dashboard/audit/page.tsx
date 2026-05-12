"use client";
import { useState } from "react";
import Link from "next/link";
import { Shield, Eye, ChevronRight, ExternalLink, Filter, Download, CheckCircle, XCircle, Clock } from "lucide-react";

const EXPLORER = "https://suiscan.xyz";
const WALRUS_AGGREGATOR = "https://aggregator.walrus-testnet.walrus.space/v1/blobs";

const MOCK_LOGS = [
  {
    id: 1,
    timestamp: 1748700721000,
    blobId: "9wEgMjpZ8pumpVtH...",
    goal: "Maximize SUI yield. Lend to whichever of Scallop or NAVI has the higher APY.",
    reasoning: "[MOCK] Scallop has highest SUI supply APY at 4.00%. Lending 0.1 SUI. Policy cap is 10 SUI/action.",
    action: { actionType: 1, protocol: 0, amountMist: "100000000", targetAddress: "0x000...000", reasoning: "Lend 0.1 SUI on Scallop" },
    txDigest: "9wEgMjpZ8pumpVtHsonY9oKwUJKFQfEtg91A6f2SJfzD",
    success: true,
    marketData: [
      { protocol: "Scallop", protocolId: 0, asset: "SUI", supplyApy: 0.04 },
      { protocol: "NAVI",    protocolId: 1, asset: "SUI", supplyApy: 0.035 },
    ],
  },
  {
    id: 2,
    timestamp: 1748700600000,
    blobId: "7xFkLmQr3nastPqW...",
    goal: "Maximize SUI yield. Lend to whichever of Scallop or NAVI has the higher APY.",
    reasoning: "[MOCK] Scallop has highest SUI supply APY at 4.00%. Lending 0.1 SUI.",
    action: { actionType: 1, protocol: 0, amountMist: "100000000", targetAddress: "0x000...000", reasoning: "Lend 0.1 SUI on Scallop" },
    txDigest: "7xFkLmQr3nastPqWabcd1234efgh5678ijkl9012mnop",
    success: true,
    marketData: [
      { protocol: "Scallop", protocolId: 0, asset: "SUI", supplyApy: 0.04 },
      { protocol: "NAVI",    protocolId: 1, asset: "SUI", supplyApy: 0.035 },
    ],
  },
  {
    id: 3,
    timestamp: 1748700480000,
    blobId: null,
    goal: "Send 50 SUI to external address 0xABCD...",
    reasoning: "Action blocked before reasoning — policy engine rejected ACTION_SEND. No whitelist configured.",
    action: { actionType: 3, protocol: 0, amountMist: "50000000000", targetAddress: "0xABCD...1234", reasoning: "BLOCKED: Send to external" },
    txDigest: null,
    success: false,
    marketData: [],
  },
];

const PROTOCOL_NAMES: Record<number, string> = { 0: "Scallop", 1: "NAVI", 2: "DeepBook", 3: "Cetus" };
const ACTION_NAMES:   Record<number, string> = { 0: "SWAP", 1: "LEND", 2: "HOLD", 3: "SEND" };

function formatTime(ts: number) {
  return new Date(ts).toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

function formatMist(mist: string) {
  return (Number(mist) / 1e9).toFixed(4);
}

export default function AuditTrail() {
  const [selected, setSelected] = useState<typeof MOCK_LOGS[0] | null>(null);
  const [filter, setFilter] = useState<"all" | "pass" | "blocked">("all");

  const filtered = MOCK_LOGS.filter(l =>
    filter === "all" ? true :
    filter === "pass" ? l.success :
    !l.success
  );

  return (
    <div className="min-h-screen bg-void">
      <div className="fixed inset-0 bg-grid-pattern bg-grid opacity-30 pointer-events-none" />

      {/* Nav */}
      <nav className="relative z-10 flex items-center justify-between px-6 py-4 border-b border-border bg-surface/80 backdrop-blur">
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-6 h-6 rounded border border-cyan/40 flex items-center justify-center">
              <Shield size={12} className="text-cyan" />
            </div>
            <span className="font-mono text-sm text-primary tracking-widest uppercase">Guardian<span className="text-cyan">OS</span></span>
          </Link>
          <ChevronRight size={12} className="text-dim" />
          <Link href="/dashboard" className="font-mono text-xs text-dim uppercase tracking-widest hover:text-ghost transition-colors">Dashboard</Link>
          <ChevronRight size={12} className="text-dim" />
          <span className="font-mono text-xs text-cyan uppercase tracking-widest">Walrus Audit Trail</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-violet animate-pulse" />
          <span className="font-mono text-xs text-dim uppercase tracking-widest">Immutable · Tamper-proof</span>
        </div>
      </nav>

      <div className="relative z-10 max-w-7xl mx-auto px-6 py-6">

        {/* Header */}
        <div className="mb-6">
          <h1 className="font-display text-2xl font-700 text-primary mb-2">
            Black Box <span className="text-cyan">Audit Trail</span>
          </h1>
          <p className="font-mono text-xs text-dim">
            Every AI decision — reasoning trace, market data, action, outcome — hashed and stored on Walrus permanently.
            No one can modify this. Not even us.
          </p>
        </div>

        {/* Filter tabs */}
        <div className="flex items-center gap-3 mb-4">
          {(["all", "pass", "blocked"] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`font-mono text-xs px-4 py-2 rounded uppercase tracking-widest transition-all ${
                filter === f
                  ? "bg-cyan/10 text-cyan border border-cyan/30"
                  : "text-dim border border-border hover:border-cyan/20 hover:text-ghost"
              }`}>
              {f === "all" ? `All (${MOCK_LOGS.length})` : f === "pass" ? `Passed (${MOCK_LOGS.filter(l=>l.success).length})` : `Blocked (${MOCK_LOGS.filter(l=>!l.success).length})`}
            </button>
          ))}
          <div className="ml-auto flex items-center gap-2 font-mono text-xs text-dim">
            <Filter size={12} />
            <span>{filtered.length} entries</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

          {/* Log list */}
          <div className="space-y-3">
            {filtered.map(log => (
              <button key={log.id} onClick={() => setSelected(log)}
                className={`w-full text-left card p-4 hover:border-cyan/30 transition-all ${selected?.id === log.id ? "border-cyan/40 bg-cyan/5" : ""} ${!log.success ? "border-red/20" : ""}`}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    {log.success
                      ? <CheckCircle size={14} className="text-green" />
                      : <XCircle size={14} className="text-red" />}
                    <span className={`tag ${log.success ? "bg-green/10 text-green border-green/20" : "bg-red/10 text-red border-red/20"}`}>
                      {log.success ? "EXECUTED" : "BLOCKED"}
                    </span>
                    <span className="tag bg-surface text-dim border-border">
                      {ACTION_NAMES[log.action.actionType]} · {PROTOCOL_NAMES[log.action.protocol]}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-dim font-mono text-[10px]">
                    <Clock size={10} />
                    {formatTime(log.timestamp)}
                  </div>
                </div>

                <p className="font-mono text-[11px] text-ghost leading-relaxed line-clamp-2 mb-3">
                  {log.reasoning}
                </p>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-xs text-primary">{formatMist(log.action.amountMist)} SUI</span>
                    {log.blobId && (
                      <span className="flex items-center gap-1 font-mono text-[10px] text-violet">
                        <Eye size={10} /> Walrus: {log.blobId.slice(0, 16)}...
                      </span>
                    )}
                  </div>
                  {log.txDigest && (
                    <a href={`${EXPLORER}/testnet/tx/${log.txDigest}`} target="_blank" rel="noreferrer"
                      onClick={e => e.stopPropagation()}
                      className="flex items-center gap-1 font-mono text-[10px] text-cyan hover:text-cyan/70">
                      Explorer <ExternalLink size={9} />
                    </a>
                  )}
                </div>
              </button>
            ))}
          </div>

          {/* Detail panel */}
          <div className="lg:sticky lg:top-6 lg:self-start">
            {selected ? (
              <div className="card p-5 space-y-5">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs text-primary uppercase tracking-widest">Decision Record</span>
                  <span className={`tag ${selected.success ? "bg-green/10 text-green border-green/20" : "bg-red/10 text-red border-red/20"}`}>
                    {selected.success ? "✓ PASS" : "⛔ BLOCKED"}
                  </span>
                </div>

                {/* Timestamp */}
                <div>
                  <div className="font-mono text-[10px] text-dim uppercase tracking-widest mb-1">Timestamp</div>
                  <div className="font-mono text-xs text-primary">{formatTime(selected.timestamp)}</div>
                </div>

                {/* Goal */}
                <div>
                  <div className="font-mono text-[10px] text-dim uppercase tracking-widest mb-1">Agent Goal</div>
                  <div className="font-mono text-xs text-ghost leading-relaxed bg-panel rounded p-3">{selected.goal}</div>
                </div>

                {/* Market data */}
                {selected.marketData.length > 0 && (
                  <div>
                    <div className="font-mono text-[10px] text-dim uppercase tracking-widest mb-2">Market Data at Decision Time</div>
                    <div className="space-y-1">
                      {selected.marketData.map(d => (
                        <div key={d.protocol} className="flex justify-between font-mono text-xs bg-panel rounded px-3 py-2">
                          <span className="text-ghost">{d.protocol} {d.asset}</span>
                          <span className={d.supplyApy === Math.max(...selected.marketData.map(x => x.supplyApy)) ? "text-green" : "text-dim"}>
                            {(d.supplyApy * 100).toFixed(2)}% APY
                            {d.supplyApy === Math.max(...selected.marketData.map(x => x.supplyApy)) ? " ← selected" : ""}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* AI Reasoning */}
                <div>
                  <div className="font-mono text-[10px] text-dim uppercase tracking-widest mb-1">AI Reasoning Trace</div>
                  <div className="font-mono text-xs text-ghost leading-relaxed bg-panel rounded p-3 border-l-2 border-cyan">
                    {selected.reasoning}
                  </div>
                </div>

                {/* Action taken */}
                <div>
                  <div className="font-mono text-[10px] text-dim uppercase tracking-widest mb-2">Action Submitted</div>
                  <div className="bg-panel rounded p-3 space-y-1 font-mono text-xs">
                    <div className="flex justify-between"><span className="text-dim">Type</span><span className="text-primary">{ACTION_NAMES[selected.action.actionType]}</span></div>
                    <div className="flex justify-between"><span className="text-dim">Protocol</span><span className="text-primary">{PROTOCOL_NAMES[selected.action.protocol]}</span></div>
                    <div className="flex justify-between"><span className="text-dim">Amount</span><span className="text-cyan">{formatMist(selected.action.amountMist)} SUI</span></div>
                    <div className="flex justify-between"><span className="text-dim">Target</span><span className="text-ghost text-[10px]">{selected.action.targetAddress}</span></div>
                  </div>
                </div>

                {/* On-chain result */}
                <div>
                  <div className="font-mono text-[10px] text-dim uppercase tracking-widest mb-2">On-Chain Result</div>
                  {selected.txDigest ? (
                    <a href={`${EXPLORER}/testnet/tx/${selected.txDigest}`} target="_blank" rel="noreferrer"
                      className="flex items-center justify-between bg-green/5 border border-green/20 rounded p-3 hover:bg-green/10 transition-colors">
                      <div>
                        <div className="font-mono text-[10px] text-green uppercase mb-1">Transaction Confirmed</div>
                        <div className="font-mono text-[10px] text-dim">{selected.txDigest.slice(0, 32)}...</div>
                      </div>
                      <ExternalLink size={12} className="text-green" />
                    </a>
                  ) : (
                    <div className="bg-red/5 border border-red/20 rounded p-3">
                      <div className="font-mono text-[10px] text-red uppercase mb-1">Transaction Reverted</div>
                      <div className="font-mono text-[10px] text-dim">Policy check aborted the PTB. Zero funds moved. This is trustless enforcement.</div>
                    </div>
                  )}
                </div>

                {/* Walrus blob */}
                {selected.blobId && (
                  <div>
                    <div className="font-mono text-[10px] text-dim uppercase tracking-widest mb-2">Walrus Storage</div>
                    <a href={`${WALRUS_AGGREGATOR}/${selected.blobId}`} target="_blank" rel="noreferrer"
                      className="flex items-center justify-between bg-violet/5 border border-violet/20 rounded p-3 hover:bg-violet/10 transition-colors">
                      <div>
                        <div className="font-mono text-[10px] text-violet uppercase mb-1">Immutable Blob Stored</div>
                        <div className="font-mono text-[10px] text-dim">{selected.blobId}</div>
                      </div>
                      <ExternalLink size={12} className="text-violet" />
                    </a>
                  </div>
                )}

                {/* Export */}
                <button
                  onClick={() => {
                    const blob = new Blob([JSON.stringify(selected, null, 2)], { type: "application/json" });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement("a");
                    a.href = url; a.download = `guardian_log_${selected.id}.json`; a.click();
                  }}
                  className="w-full flex items-center justify-center gap-2 py-2 border border-border text-dim font-mono text-[10px] uppercase tracking-widest hover:border-cyan/30 hover:text-cyan transition-all rounded">
                  <Download size={10} /> Export JSON
                </button>
              </div>
            ) : (
              <div className="card p-12 flex flex-col items-center justify-center text-center">
                <Eye size={32} className="text-dim mb-4" />
                <div className="font-mono text-xs text-dim uppercase tracking-widest mb-2">Select a log entry</div>
                <div className="font-mono text-[10px] text-muted">Click any entry on the left to inspect the full AI reasoning trace</div>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
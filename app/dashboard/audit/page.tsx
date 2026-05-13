"use client";
import { useState } from "react";
import Link from "next/link";
import { Shield, Eye, ChevronRight, ExternalLink, Filter, Download, CheckCircle, XCircle, Clock, X } from "lucide-react";

const EXPLORER          = "https://suiscan.xyz";
const WALRUS_AGGREGATOR = "https://aggregator.walrus-testnet.walrus.space/v1/blobs";

const MOCK_LOGS = [
  {
    id: 1, timestamp: 1748700721000, blobId: "9wEgMjpZ8pumpVtH...",
    goal: "Maximize SUI yield. Lend to whichever of Scallop or NAVI has the higher APY.",
    reasoning: "[MOCK] Scallop has highest SUI supply APY at 4.00%. Lending 0.1 SUI. Policy cap is 10 SUI/action.",
    action: { actionType: 1, protocol: 0, amountMist: "100000000", targetAddress: "0x000...000", reasoning: "Lend 0.1 SUI on Scallop" },
    txDigest: "9wEgMjpZ8pumpVtHsonY9oKwUJKFQfEtg91A6f2SJfzD", success: true,
    marketData: [{ protocol: "Scallop", protocolId: 0, asset: "SUI", supplyApy: 0.04 }, { protocol: "NAVI", protocolId: 1, asset: "SUI", supplyApy: 0.035 }],
  },
  {
    id: 2, timestamp: 1748700600000, blobId: "7xFkLmQr3nastPqW...",
    goal: "Maximize SUI yield. Lend to whichever of Scallop or NAVI has the higher APY.",
    reasoning: "[MOCK] Scallop has highest SUI supply APY at 4.00%. Lending 0.1 SUI.",
    action: { actionType: 1, protocol: 0, amountMist: "100000000", targetAddress: "0x000...000", reasoning: "Lend 0.1 SUI on Scallop" },
    txDigest: "7xFkLmQr3nastPqWabcd1234efgh5678ijkl9012mnop", success: true,
    marketData: [{ protocol: "Scallop", protocolId: 0, asset: "SUI", supplyApy: 0.04 }, { protocol: "NAVI", protocolId: 1, asset: "SUI", supplyApy: 0.035 }],
  },
  {
    id: 3, timestamp: 1748700480000, blobId: null,
    goal: "Send 50 SUI to external address 0xABCD...",
    reasoning: "Action blocked — policy engine rejected ACTION_SEND. No whitelist configured.",
    action: { actionType: 3, protocol: 0, amountMist: "50000000000", targetAddress: "0xABCD...1234", reasoning: "BLOCKED: Send to external" },
    txDigest: null, success: false, marketData: [],
  },
];

const PROTOCOL_NAMES: Record<number, string> = { 0: "Scallop", 1: "NAVI", 2: "DeepBook", 3: "Cetus" };
const ACTION_NAMES:   Record<number, string> = { 0: "SWAP", 1: "LEND", 2: "HOLD", 3: "SEND" };

function formatTime(ts: number) {
  return new Date(ts).toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}
function formatMist(mist: string) { return (Number(mist) / 1e9).toFixed(4); }

export default function AuditTrail() {
  const [selected, setSelected] = useState<typeof MOCK_LOGS[0] | null>(null);
  const [filter, setFilter]     = useState<"all" | "pass" | "blocked">("all");

  const filtered = MOCK_LOGS.filter(l =>
    filter === "all" ? true : filter === "pass" ? l.success : !l.success
  );

  return (
    <div className="min-h-screen bg-void">
      <div className="fixed inset-0 bg-grid-pattern bg-grid opacity-30 pointer-events-none" />

      {/* Nav */}
      <nav className="relative z-10 flex items-center justify-between px-4 sm:px-6 py-4 border-b border-border bg-surface/80 backdrop-blur">
        <div className="flex items-center gap-2 min-w-0">
          <Link href="/" className="flex items-center gap-2 flex-shrink-0">
            <div className="w-6 h-6 rounded border border-cyan/40 flex items-center justify-center">
              <Shield size={12} className="text-cyan" />
            </div>
            <span className="font-mono text-sm text-primary tracking-widest uppercase hidden sm:inline">Guardian<span className="text-cyan">OS</span></span>
          </Link>
          <ChevronRight size={12} className="text-dim hidden sm:block flex-shrink-0" />
          <Link href="/dashboard" className="font-mono text-[10px] text-dim uppercase tracking-widest hover:text-ghost hidden sm:block">Dashboard</Link>
          <ChevronRight size={12} className="text-dim hidden sm:block flex-shrink-0" />
          <span className="font-mono text-[10px] text-cyan uppercase tracking-widest truncate">Walrus Audit Trail</span>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <div className="w-1.5 h-1.5 rounded-full bg-violet animate-pulse" />
          <span className="font-mono text-[10px] text-dim uppercase hidden sm:inline">Immutable · Tamper-proof</span>
          <span className="font-mono text-[10px] text-dim uppercase sm:hidden">Immutable</span>
        </div>
      </nav>

      <div className="relative z-10 max-w-7xl mx-auto px-3 sm:px-6 py-4 sm:py-6">

        {/* Header */}
        <div className="mb-4 sm:mb-6">
          <h1 className="font-display text-xl sm:text-2xl font-700 text-primary mb-2">
            Black Box <span className="text-cyan">Audit Trail</span>
          </h1>
          <p className="font-mono text-[10px] sm:text-xs text-dim leading-relaxed">
            Every AI decision hashed and stored on Walrus permanently. No one can modify this. Not even us.
          </p>
        </div>

        {/* Filter tabs */}
        <div className="flex items-center gap-2 mb-4 flex-wrap">
          {(["all", "pass", "blocked"] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`font-mono text-[10px] px-3 py-1.5 rounded uppercase tracking-widest transition-all ${
                filter === f ? "bg-cyan/10 text-cyan border border-cyan/30" : "text-dim border border-border hover:border-cyan/20"
              }`}>
              {f === "all" ? `All (${MOCK_LOGS.length})` : f === "pass" ? `Passed (${MOCK_LOGS.filter(l => l.success).length})` : `Blocked (${MOCK_LOGS.filter(l => !l.success).length})`}
            </button>
          ))}
          <div className="ml-auto flex items-center gap-1 font-mono text-[10px] text-dim">
            <Filter size={10} /><span>{filtered.length}</span>
          </div>
        </div>

        {/* On mobile: show detail panel as overlay/sheet when selected */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">

          {/* Log list */}
          <div className="space-y-2 sm:space-y-3">
            {filtered.map(log => (
              <button key={log.id} onClick={() => setSelected(log)}
                className={`w-full text-left card p-3 sm:p-4 hover:border-cyan/30 transition-all ${selected?.id === log.id ? "border-cyan/40 bg-cyan/5" : ""} ${!log.success ? "border-red/20" : ""}`}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    {log.success ? <CheckCircle size={13} className="text-green" /> : <XCircle size={13} className="text-red" />}
                    <span className={`tag ${log.success ? "bg-green/10 text-green border-green/20" : "bg-red/10 text-red border-red/20"}`}>
                      {log.success ? "EXECUTED" : "BLOCKED"}
                    </span>
                    <span className="tag bg-surface text-dim border-border hidden sm:inline">
                      {ACTION_NAMES[log.action.actionType]} · {PROTOCOL_NAMES[log.action.protocol]}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-dim font-mono text-[9px] flex-shrink-0">
                    <Clock size={9} />{formatTime(log.timestamp)}
                  </div>
                </div>
                <p className="font-mono text-[10px] text-ghost leading-relaxed line-clamp-2 mb-2 text-left">{log.reasoning}</p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-[10px] text-primary">{formatMist(log.action.amountMist)} SUI</span>
                    {log.blobId && (
                      <span className="font-mono text-[9px] text-violet hidden sm:inline">Walrus: {log.blobId.slice(0, 12)}...</span>
                    )}
                  </div>
                  {log.txDigest && (
                    <a href={`${EXPLORER}/testnet/tx/${log.txDigest}`} target="_blank" rel="noreferrer"
                      onClick={e => e.stopPropagation()}
                      className="font-mono text-[9px] text-cyan hover:text-cyan/70 flex items-center gap-1">
                      Explorer <ExternalLink size={9} />
                    </a>
                  )}
                </div>
              </button>
            ))}
          </div>

          {/* Detail panel — sticky on desktop, modal-like on mobile */}
          {selected && (
            <div className="fixed inset-0 z-40 lg:static lg:inset-auto lg:z-auto">
              {/* Mobile backdrop */}
              <div className="absolute inset-0 bg-black/60 lg:hidden" onClick={() => setSelected(null)} />
              {/* Panel */}
              <div className="absolute bottom-0 left-0 right-0 lg:static max-h-[80vh] lg:max-h-none overflow-y-auto card p-4 sm:p-5 space-y-4 rounded-t-xl lg:rounded-lg lg:sticky lg:top-6 lg:self-start">
                {/* Mobile close button */}
                <div className="flex items-center justify-between lg:hidden">
                  <span className="font-mono text-xs text-primary uppercase tracking-widest">Decision Record</span>
                  <button onClick={() => setSelected(null)} className="text-dim hover:text-ghost"><X size={16} /></button>
                </div>

                <div className="hidden lg:flex items-center justify-between">
                  <span className="font-mono text-xs text-primary uppercase tracking-widest">Decision Record</span>
                  <span className={`tag ${selected.success ? "bg-green/10 text-green border-green/20" : "bg-red/10 text-red border-red/20"}`}>
                    {selected.success ? "✓ PASS" : "⛔ BLOCKED"}
                  </span>
                </div>

                <div>
                  <div className="font-mono text-[9px] text-dim uppercase tracking-widest mb-1">Goal</div>
                  <div className="font-mono text-[10px] text-ghost leading-relaxed bg-panel rounded p-2 sm:p-3">{selected.goal}</div>
                </div>

                {selected.marketData.length > 0 && (
                  <div>
                    <div className="font-mono text-[9px] text-dim uppercase tracking-widest mb-1.5">Market Data</div>
                    <div className="space-y-1">
                      {selected.marketData.map(d => (
                        <div key={d.protocol} className="flex justify-between font-mono text-[10px] bg-panel rounded px-2 sm:px-3 py-1.5">
                          <span className="text-ghost">{d.protocol} {d.asset}</span>
                          <span className={d.supplyApy === Math.max(...selected.marketData.map(x => x.supplyApy)) ? "text-green" : "text-dim"}>
                            {(d.supplyApy * 100).toFixed(2)}% {d.supplyApy === Math.max(...selected.marketData.map(x => x.supplyApy)) ? "← selected" : ""}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <div className="font-mono text-[9px] text-dim uppercase tracking-widest mb-1">AI Reasoning</div>
                  <div className="font-mono text-[10px] text-ghost leading-relaxed bg-panel rounded p-2 sm:p-3 border-l-2 border-cyan">{selected.reasoning}</div>
                </div>

                <div>
                  <div className="font-mono text-[9px] text-dim uppercase tracking-widest mb-1.5">Action</div>
                  <div className="bg-panel rounded p-2 sm:p-3 space-y-1 font-mono text-[10px]">
                    <div className="flex justify-between"><span className="text-dim">Type</span><span className="text-primary">{ACTION_NAMES[selected.action.actionType]}</span></div>
                    <div className="flex justify-between"><span className="text-dim">Protocol</span><span className="text-primary">{PROTOCOL_NAMES[selected.action.protocol]}</span></div>
                    <div className="flex justify-between"><span className="text-dim">Amount</span><span className="text-cyan">{formatMist(selected.action.amountMist)} SUI</span></div>
                  </div>
                </div>

                <div>
                  <div className="font-mono text-[9px] text-dim uppercase tracking-widest mb-1.5">On-Chain Result</div>
                  {selected.txDigest ? (
                    <a href={`${EXPLORER}/testnet/tx/${selected.txDigest}`} target="_blank" rel="noreferrer"
                      className="flex items-center justify-between bg-green/5 border border-green/20 rounded p-2 sm:p-3 hover:bg-green/10 transition-colors">
                      <div>
                        <div className="font-mono text-[9px] text-green uppercase mb-0.5">Transaction Confirmed</div>
                        <div className="font-mono text-[9px] text-dim truncate max-w-[200px]">{selected.txDigest.slice(0, 28)}...</div>
                      </div>
                      <ExternalLink size={11} className="text-green flex-shrink-0" />
                    </a>
                  ) : (
                    <div className="bg-red/5 border border-red/20 rounded p-2 sm:p-3">
                      <div className="font-mono text-[9px] text-red uppercase mb-0.5">Transaction Reverted</div>
                      <div className="font-mono text-[9px] text-dim">Policy check aborted PTB. Zero funds moved.</div>
                    </div>
                  )}
                </div>

                {selected.blobId && (
                  <div>
                    <div className="font-mono text-[9px] text-dim uppercase tracking-widest mb-1.5">Walrus Storage</div>
                    <a href={`${WALRUS_AGGREGATOR}/${selected.blobId}`} target="_blank" rel="noreferrer"
                      className="flex items-center justify-between bg-violet/5 border border-violet/20 rounded p-2 sm:p-3 hover:bg-violet/10 transition-colors">
                      <div>
                        <div className="font-mono text-[9px] text-violet uppercase mb-0.5">Immutable Blob</div>
                        <div className="font-mono text-[9px] text-dim">{selected.blobId}</div>
                      </div>
                      <ExternalLink size={11} className="text-violet flex-shrink-0" />
                    </a>
                  </div>
                )}

                <button onClick={() => { const b = new Blob([JSON.stringify(selected, null, 2)], { type: "application/json" }); const u = URL.createObjectURL(b); const a = document.createElement("a"); a.href = u; a.download = `guardian_log_${selected.id}.json`; a.click(); }}
                  className="w-full flex items-center justify-center gap-2 py-2 border border-border text-dim font-mono text-[9px] uppercase tracking-widest hover:border-cyan/30 hover:text-cyan transition-all rounded">
                  <Download size={10} /> Export JSON
                </button>
              </div>
            </div>
          )}

          {/* Empty state — desktop only */}
          {!selected && (
            <div className="hidden lg:flex card p-12 flex-col items-center justify-center text-center">
              <Eye size={28} className="text-dim mb-4" />
              <div className="font-mono text-xs text-dim uppercase tracking-widest mb-2">Select a log entry</div>
              <div className="font-mono text-[10px] text-muted">Click any entry to inspect the full AI reasoning trace</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
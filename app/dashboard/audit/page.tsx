"use client";
import { useState, useEffect, useCallback } from "react";
import { useSuiClient } from "@mysten/dapp-kit";
import Link from "next/link";
import {
  Shield, Eye, ChevronRight, ExternalLink,
  Filter, Download, CheckCircle, XCircle, Clock, X, Loader
} from "lucide-react";

const EXPLORER          = "https://suiscan.xyz";
const WALRUS_AGGREGATOR = "https://walruscan.com/testnet/blob";
const PACKAGE_ID        = process.env.NEXT_PUBLIC_PACKAGE_ID ?? "";

const PROTOCOL_NAMES: Record<number, string> = { 0: "Scallop", 1: "NAVI", 2: "DeepBook", 3: "Cetus" };
const ACTION_NAMES:   Record<number, string> = { 0: "SWAP", 1: "LEND", 2: "HOLD", 3: "SEND" };

interface WalrusLog {
  timestamp: number;
  goal: string;
  marketData: { protocol: string; protocolId: number; asset: string; supplyApy: number }[];
  reasoning?: string;           // old field name
  claudeReasoning?: string;     // new field name
  action: {
    actionType: number;
    protocol: number;
    amountMist: string;
    targetAddress: string;
    reasoning: string;
  } | null;
  txDigest: string | null;
  success: boolean;
  vaultId?: string;
  walrusBlobId?: string;
}

interface AuditEntry {
  id: string;
  txDigest: string;
  timestampMs: number;
  blobId: string | null;
  log: WalrusLog | null;
  status: "success" | "blocked";
  amountSUI: number;
  protocol: string;
  action: string;
}

function formatTime(ts: number) {
  return new Date(ts).toLocaleString("en-US", {
    month: "short", day: "numeric",
    hour: "2-digit", minute: "2-digit"
  });
}

function formatMist(mist: string | number) {
  return (Number(mist) / 1e9).toFixed(4);
}

// Extract blob ID from Walrus log — it stores it internally
// We derive it from the tx event data or stored field
function extractBlobId(log: WalrusLog | null): string | null {
  return log?.walrusBlobId ?? null;
}

function getReasoning(log: WalrusLog | null): string {
  if (!log) return "No reasoning available";
  return log.claudeReasoning ?? log.reasoning ?? "No reasoning recorded";
}

export default function AuditTrail() {
  const client = useSuiClient();
  const [entries,  setEntries]  = useState<AuditEntry[]>([]);
  const [selected, setSelected] = useState<AuditEntry | null>(null);
  const [loading,  setLoading]  = useState(true);
  const [filter,   setFilter]   = useState<"all" | "pass" | "blocked">("all");

  const fetchAuditTrail = useCallback(async () => {
    if (!PACKAGE_ID) return;
    setLoading(true);

    try {
      // Fetch SpendExecuted events (successful actions)
      const spendEvents = await client.queryEvents({
        query: { MoveEventType: `${PACKAGE_ID}::execution_vault::SpendExecuted` },
        limit: 20,
        order: "descending",
      });

      const auditEntries: AuditEntry[] = await Promise.all(
        spendEvents.data.map(async (e) => {
          const json = e.parsedJson as any;
          const txDigest = e.id.txDigest;

          // Try to find the Walrus blob ID stored in the log
          // The agent stores it in the WalrusLogEntry.walrusBlobId field
          // We fetch the blob by querying Walrus with the tx digest as a hint
          // For now we try known blob IDs or skip
          let log: WalrusLog | null = null;
          let blobId: string | null = null;

          // We don't have a direct tx→blobId mapping on-chain yet (v2 feature)
          // So we fetch the tx details to see if there's any memo/note
          // For hackathon: we match known tx→blob pairs
          const KNOWN_BLOBS: Record<string, string> = {
            "9shqjTHPyQUkKXTUjfssvd83ZTdubBmn8rDmbzQVRmxN": "M2iDrFK-BAmoZBQDb2pPWGrBoqs-xzUTO6YOHXpZfvo",
            "Gieevs82gVxqrnbbFLbMzRScAzf3WVuCgLH4hohck55M": "gStCvTPz86O-qP5uKdbdkIRhQzoMUSYHxZ1EWmAIJUA",
            // Add new ones here as you run the agent
          };

          blobId = KNOWN_BLOBS[txDigest] ?? null;

          // If we have a blob ID, fetch the full reasoning from Walrus
          if (blobId) {
            try {
              const res = await fetch(`${WALRUS_AGGREGATOR}/${blobId}`);
              if (res.ok) log = await res.json();
            } catch {
              // Walrus fetch failed — non-critical
            }
          }

          return {
            id:          txDigest + e.id.eventSeq,
            txDigest,
            timestampMs: Number(e.timestampMs ?? 0),
            blobId,
            log,
            status:      "success" as const,
            amountSUI:   Number(BigInt(json?.amount_mist ?? 0)) / 1e9,
            protocol:    PROTOCOL_NAMES[json?.protocol] ?? "Unknown",
            action:      ACTION_NAMES[json?.action_type] ?? "Unknown",
          };
        })
      );

      // Also fetch PolicyViolationBlocked events
      const blockedEvents = await client.queryEvents({
        query: { MoveEventType: `${PACKAGE_ID}::execution_vault::PolicyViolationBlocked` },
        limit: 10,
        order: "descending",
      });

      const blockedEntries: AuditEntry[] = blockedEvents.data.map(e => {
        const json = e.parsedJson as any;
        return {
          id:          e.id.txDigest + e.id.eventSeq,
          txDigest:    e.id.txDigest,
          timestampMs: Number(e.timestampMs ?? 0),
          blobId:      null,
          log:         null,
          status:      "blocked" as const,
          amountSUI:   Number(BigInt(json?.attempted_amount_mist ?? 0)) / 1e9,
          protocol:    PROTOCOL_NAMES[json?.protocol] ?? "Unknown",
          action:      ACTION_NAMES[json?.attempted_action] ?? "Unknown",
        };
      });

      const all = [...auditEntries, ...blockedEntries]
        .sort((a, b) => b.timestampMs - a.timestampMs);

      setEntries(all);
    } catch (err) {
      console.error("Audit trail fetch failed:", err);
    } finally {
      setLoading(false);
    }
  }, [client]);

  useEffect(() => { fetchAuditTrail(); }, [fetchAuditTrail]);

  const filtered = entries.filter(e =>
    filter === "all" ? true :
    filter === "pass" ? e.status === "success" :
    e.status === "blocked"
  );

  const passCount    = entries.filter(e => e.status === "success").length;
  const blockedCount = entries.filter(e => e.status === "blocked").length;

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
            <span className="font-mono text-sm text-primary tracking-widest uppercase hidden sm:inline">
              Guardian<span className="text-cyan">OS</span>
            </span>
          </Link>
          <ChevronRight size={12} className="text-dim hidden sm:block flex-shrink-0" />
          <Link href="/dashboard" className="font-mono text-[10px] text-dim uppercase tracking-widest hover:text-ghost hidden sm:block">
            Dashboard
          </Link>
          <ChevronRight size={12} className="text-dim hidden sm:block flex-shrink-0" />
          <span className="font-mono text-[10px] text-cyan uppercase tracking-widest truncate">
            Walrus Audit Trail
          </span>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <div className="w-1.5 h-1.5 rounded-full bg-violet animate-pulse" />
          <span className="font-mono text-[10px] text-dim uppercase hidden sm:inline">
            Immutable · Tamper-proof
          </span>
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
                filter === f
                  ? "bg-cyan/10 text-cyan border border-cyan/30"
                  : "text-dim border border-border hover:border-cyan/20"
              }`}>
              {f === "all"     ? `All (${entries.length})` :
               f === "pass"    ? `Passed (${passCount})` :
               `Blocked (${blockedCount})`}
            </button>
          ))}
          <div className="ml-auto flex items-center gap-1 font-mono text-[10px] text-dim">
            <Filter size={10} /><span>{filtered.length}</span>
          </div>
        </div>

        {/* Loading state */}
        {loading && (
          <div className="flex items-center justify-center py-20 gap-3">
            <Loader size={16} className="text-cyan animate-spin" />
            <span className="font-mono text-xs text-dim">Fetching from chain...</span>
          </div>
        )}

        {/* Empty state */}
        {!loading && entries.length === 0 && (
          <div className="card p-12 text-center">
            <Eye size={28} className="text-dim mb-4 mx-auto" />
            <div className="font-mono text-xs text-dim uppercase tracking-widest mb-2">No events yet</div>
            <div className="font-mono text-[10px] text-muted">
              Run the agent to generate audit trail entries
            </div>
          </div>
        )}

        {!loading && entries.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">

            {/* Log list */}
            <div className="space-y-2 sm:space-y-3">
              {filtered.map(entry => (
                <button key={entry.id} onClick={() => setSelected(entry)}
                  className={`w-full text-left card p-3 sm:p-4 hover:border-cyan/30 transition-all
                    ${selected?.id === entry.id ? "border-cyan/40 bg-cyan/5" : ""}
                    ${entry.status === "blocked" ? "border-red/20" : ""}`}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      {entry.status === "success"
                        ? <CheckCircle size={13} className="text-green" />
                        : <XCircle size={13} className="text-red" />}
                      <span className={`tag ${entry.status === "success"
                        ? "bg-green/10 text-green border-green/20"
                        : "bg-red/10 text-red border-red/20"}`}>
                        {entry.status === "success" ? "EXECUTED" : "BLOCKED"}
                      </span>
                      <span className="tag bg-surface text-dim border-border hidden sm:inline">
                        {entry.action} · {entry.protocol}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 text-dim font-mono text-[9px] flex-shrink-0">
                      <Clock size={9} />{formatTime(entry.timestampMs)}
                    </div>
                  </div>

                  {/* Show reasoning preview if blob loaded */}
                  <p className="font-mono text-[10px] text-ghost leading-relaxed line-clamp-2 mb-2 text-left">
                    {getReasoning(entry.log)}
                  </p>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-[10px] text-primary">
                        {entry.amountSUI.toFixed(4)} SUI
                      </span>
                      {entry.blobId && (
                        <span className="font-mono text-[9px] text-violet hidden sm:inline">
                          Walrus ✓
                        </span>
                      )}
                    </div>
                    {entry.txDigest && (
                      <a href={`${EXPLORER}/testnet/tx/${entry.txDigest}`}
                        target="_blank" rel="noreferrer"
                        onClick={e => e.stopPropagation()}
                        className="font-mono text-[9px] text-cyan hover:text-cyan/70 flex items-center gap-1">
                        Explorer <ExternalLink size={9} />
                      </a>
                    )}
                  </div>
                </button>
              ))}
            </div>

            {/* Detail panel */}
            {selected && (
              <div className="fixed inset-0 z-40 lg:static lg:inset-auto lg:z-auto">
                <div className="absolute inset-0 bg-black/60 lg:hidden" onClick={() => setSelected(null)} />
                <div className="absolute bottom-0 left-0 right-0 lg:static max-h-[80vh] lg:max-h-none overflow-y-auto card p-4 sm:p-5 space-y-4 rounded-t-xl lg:rounded-lg lg:sticky lg:top-6 lg:self-start">

                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs text-primary uppercase tracking-widest">
                      Decision Record
                    </span>
                    <div className="flex items-center gap-2">
                      <span className={`tag ${selected.status === "success"
                        ? "bg-green/10 text-green border-green/20"
                        : "bg-red/10 text-red border-red/20"}`}>
                        {selected.status === "success" ? "✓ PASS" : "⛔ BLOCKED"}
                      </span>
                      <button onClick={() => setSelected(null)} className="text-dim hover:text-ghost lg:hidden">
                        <X size={16} />
                      </button>
                    </div>
                  </div>

                  {/* Goal */}
                  {selected.log?.goal && (
                    <div>
                      <div className="font-mono text-[9px] text-dim uppercase tracking-widest mb-1">Goal</div>
                      <div className="font-mono text-[10px] text-ghost leading-relaxed bg-panel rounded p-2 sm:p-3">
                        {selected.log.goal}
                      </div>
                    </div>
                  )}

                  {/* Market data */}
                  {selected.log?.marketData && selected.log.marketData.length > 0 && (
                    <div>
                      <div className="font-mono text-[9px] text-dim uppercase tracking-widest mb-1.5">
                        Market Data
                      </div>
                      <div className="space-y-1">
                        {selected.log.marketData.map(d => {
                          const best = Math.max(...selected.log!.marketData.map(x => x.supplyApy));
                          return (
                            <div key={d.protocol}
                              className="flex justify-between font-mono text-[10px] bg-panel rounded px-2 sm:px-3 py-1.5">
                              <span className="text-ghost">{d.protocol} {d.asset}</span>
                              <span className={d.supplyApy === best ? "text-green" : "text-dim"}>
                                {(d.supplyApy * 100).toFixed(2)}%
                                {d.supplyApy === best ? " ← selected" : ""}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* AI Reasoning */}
                  <div>
                    <div className="font-mono text-[9px] text-dim uppercase tracking-widest mb-1">
                      AI Reasoning
                    </div>
                    <div className="font-mono text-[10px] text-ghost leading-relaxed bg-panel rounded p-2 sm:p-3 border-l-2 border-cyan">
                      {getReasoning(selected.log)}
                    </div>
                  </div>

                  {/* Action */}
                  {selected.log?.action && (
                    <div>
                      <div className="font-mono text-[9px] text-dim uppercase tracking-widest mb-1.5">
                        Action
                      </div>
                      <div className="bg-panel rounded p-2 sm:p-3 space-y-1 font-mono text-[10px]">
                        <div className="flex justify-between">
                          <span className="text-dim">Type</span>
                          <span className="text-primary">{ACTION_NAMES[selected.log.action.actionType]}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-dim">Protocol</span>
                          <span className="text-primary">{PROTOCOL_NAMES[selected.log.action.protocol]}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-dim">Amount</span>
                          <span className="text-cyan">{formatMist(selected.log.action.amountMist)} SUI</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* On-chain result */}
                  <div>
                    <div className="font-mono text-[9px] text-dim uppercase tracking-widest mb-1.5">
                      On-Chain Result
                    </div>
                    {selected.txDigest ? (
                      <a href={`${EXPLORER}/testnet/tx/${selected.txDigest}`}
                        target="_blank" rel="noreferrer"
                        className="flex items-center justify-between bg-green/5 border border-green/20 rounded p-2 sm:p-3 hover:bg-green/10 transition-colors">
                        <div>
                          <div className="font-mono text-[9px] text-green uppercase mb-0.5">
                            Transaction Confirmed
                          </div>
                          <div className="font-mono text-[9px] text-dim truncate max-w-[200px]">
                            {selected.txDigest.slice(0, 28)}...
                          </div>
                        </div>
                        <ExternalLink size={11} className="text-green flex-shrink-0" />
                      </a>
                    ) : (
                      <div className="bg-red/5 border border-red/20 rounded p-2 sm:p-3">
                        <div className="font-mono text-[9px] text-red uppercase mb-0.5">
                          Transaction Reverted
                        </div>
                        <div className="font-mono text-[9px] text-dim">
                          Policy check aborted. Zero funds moved.
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Walrus blob */}
                  {selected.blobId && (
                    <div>
                      <div className="font-mono text-[9px] text-dim uppercase tracking-widest mb-1.5">
                        Walrus Storage
                      </div>
                      <a href={`${WALRUS_AGGREGATOR}/${selected.blobId}`}
                        target="_blank" rel="noreferrer"
                        className="flex items-center justify-between bg-violet/5 border border-violet/20 rounded p-2 sm:p-3 hover:bg-violet/10 transition-colors">
                        <div>
                          <div className="font-mono text-[9px] text-violet uppercase mb-0.5">
                            Immutable Blob
                          </div>
                          <div className="font-mono text-[9px] text-dim break-all">
                            {selected.blobId}
                          </div>
                        </div>
                        <ExternalLink size={11} className="text-violet flex-shrink-0" />
                      </a>
                    </div>
                  )}

                  {/* Export */}
                  <button onClick={() => {
                    const data = { txDigest: selected.txDigest, blobId: selected.blobId, log: selected.log };
                    const b = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
                    const u = URL.createObjectURL(b);
                    const a = document.createElement("a");
                    a.href = u; a.download = `guardian_log_${selected.txDigest?.slice(0,8)}.json`;
                    a.click();
                  }}
                    className="w-full flex items-center justify-center gap-2 py-2 border border-border text-dim font-mono text-[9px] uppercase tracking-widest hover:border-cyan/30 hover:text-cyan transition-all rounded">
                    <Download size={10} /> Export JSON
                  </button>
                </div>
              </div>
            )}

            {/* Empty detail state */}
            {!selected && (
              <div className="hidden lg:flex card p-12 flex-col items-center justify-center text-center">
                <Eye size={28} className="text-dim mb-4" />
                <div className="font-mono text-xs text-dim uppercase tracking-widest mb-2">
                  Select a log entry
                </div>
                <div className="font-mono text-[10px] text-muted">
                  Click any entry to inspect the full AI reasoning trace
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
"use client";
import { useState } from "react";
import Link from "next/link";
import { Shield, Zap, AlertTriangle, Activity, Lock, TrendingUp, Clock, Eye, Terminal, ChevronRight, Power, Wallet, Menu, X } from "lucide-react";
import { AreaChart, Area, ResponsiveContainer, Tooltip } from "recharts";
import { useCurrentAccount, useConnectWallet, useDisconnectWallet, useSignAndExecuteTransaction, useWallets } from "@mysten/dapp-kit";
import { Transaction } from "@mysten/sui/transactions";

const VAULT_ID     = process.env.NEXT_PUBLIC_VAULT_ID     ?? "";
const IDENTITY_ID  = process.env.NEXT_PUBLIC_IDENTITY_ID  ?? "";
const PACKAGE_ID   = process.env.NEXT_PUBLIC_PACKAGE_ID   ?? "";
const OWNER_CAP_ID = process.env.NEXT_PUBLIC_OWNER_CAP_ID ?? "";
const EXPLORER     = "https://suiscan.xyz";

const MOCK_ACTIONS = [
  { id: 1, time: "14:32:01", type: "LEND", protocol: "Scallop",  amount: "0.10",  status: "PASS",    tx: "9wEgMjpZ8pump...", score: +10 },
  { id: 2, time: "14:31:44", type: "LEND", protocol: "Scallop",  amount: "0.10",  status: "PASS",    tx: "7xFkLmQr3nast...", score: +10 },
  { id: 3, time: "14:30:12", type: "SEND", protocol: "External", amount: "50.00", status: "BLOCKED", tx: null,               score: -50 },
  { id: 4, time: "14:28:55", type: "SWAP", protocol: "DeepBook", amount: "15.00", status: "BLOCKED", tx: null,               score: -50 },
  { id: 5, time: "14:25:33", type: "LEND", protocol: "NAVI",     amount: "0.10",  status: "PASS",    tx: "3mPvWxYz9conf...", score: +10 },
];

const SKORE_HISTORY   = [{ t: "T-5h", v: 500 }, { t: "T-4h", v: 510 }, { t: "T-3h", v: 490 }, { t: "T-2h", v: 500 }, { t: "T-1h", v: 510 }, { t: "Now", v: 520 }];
const BALANCE_HISTORY = [{ t: "T-5", v: 0.5 }, { t: "T-4", v: 0.5 }, { t: "T-3", v: 0.5 }, { t: "T-2", v: 0.4 }, { t: "T-1", v: 0.4 }, { t: "Now", v: 0.3 }];

function Blink({ active = true }: { active?: boolean }) {
  return <span className={`inline-block w-1.5 h-1.5 rounded-full flex-shrink-0 ${active ? "bg-green animate-pulse" : "bg-muted"}`} />;
}

function SkoreMeter({ score }: { score: number }) {
  const pct  = (score / 1000) * 100;
  const tier = score >= 600 ? { label: "GOLD", color: "amber" } : score >= 300 ? { label: "SILVER", color: "cyan" } : { label: "BRONZE", color: "ghost" };
  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <span className="font-mono text-[10px] text-dim uppercase tracking-widest">Skore</span>
        <span className={`tag bg-${tier.color}/10 text-${tier.color} border border-${tier.color}/20`}>{tier.label}</span>
      </div>
      <div className="font-mono text-3xl sm:text-4xl font-700 text-cyan glow-cyan">{score}</div>
      <div className="h-1.5 bg-border rounded-full overflow-hidden">
        <div className="h-full bg-gradient-to-r from-cyan to-green rounded-full transition-all duration-1000" style={{ width: `${pct}%` }} />
      </div>
      <div className="flex justify-between font-mono text-[9px] text-dim">
        <span>0</span><span className="hidden sm:inline">BRONZE 300</span><span className="hidden sm:inline">GOLD 600</span><span>1000</span>
      </div>
    </div>
  );
}

function EmergencyModal({ onConfirm, onCancel, loading }: { onConfirm: () => void; onCancel: () => void; loading: boolean }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="card border-glow-red p-6 sm:p-8 max-w-md w-full space-y-5">
        <div className="flex items-center gap-3">
          <AlertTriangle size={20} className="text-red" />
          <span className="font-mono text-sm text-red uppercase tracking-widest">Emergency Stop</span>
        </div>
        <p className="font-sans text-ghost text-sm leading-relaxed">
          This calls <code className="font-mono text-xs bg-panel px-1 rounded">set_active(false)</code> on your vault.
          Agent pauses immediately. <strong className="text-primary">No funds move.</strong>
        </p>
        <div className="flex gap-3">
          <button onClick={onCancel} className="flex-1 py-2 border border-border text-ghost font-mono text-xs uppercase tracking-widest hover:border-cyan/30 hover:text-cyan transition-all rounded">Cancel</button>
          <button onClick={onConfirm} disabled={loading} className="flex-1 py-2 bg-red/10 border border-red/40 text-red font-mono text-xs uppercase tracking-widest hover:bg-red/20 transition-all rounded disabled:opacity-50">
            {loading ? "Signing..." : "Confirm"}
          </button>
        </div>
      </div>
    </div>
  );
}

function WalletButton() {
  const account                = useCurrentAccount();
  const wallets                = useWallets();
  const { mutate: connect }    = useConnectWallet();
  const { mutate: disconnect } = useDisconnectWallet();
  if (account) {
    return (
      <button onClick={() => disconnect()} className="flex items-center gap-1.5 px-2 sm:px-3 py-1.5 border border-green/30 text-green font-mono text-[10px] uppercase tracking-wider hover:bg-green/10 transition-all rounded">
        <div className="w-1.5 h-1.5 rounded-full bg-green" />
        <span className="hidden sm:inline">{account.address.slice(0, 6)}...{account.address.slice(-4)}</span>
        <span className="sm:hidden">Connected</span>
      </button>
    );
  }
  return (
    <button onClick={() => wallets[0] && connect({ wallet: wallets[0] })} className="flex items-center gap-1.5 px-2 sm:px-3 py-1.5 border border-cyan/30 text-cyan font-mono text-[10px] uppercase tracking-wider hover:bg-cyan/10 transition-all rounded">
      <Wallet size={10} />
      <span className="hidden sm:inline">Connect Wallet</span>
      <span className="sm:hidden">Connect</span>
    </button>
  );
}

export default function Dashboard() {
  const [vaultBalance]                = useState(0.3);
  const [skore]                       = useState(520);
  const [isActive, setIsActive]       = useState(true);
  const [actions]                     = useState(MOCK_ACTIONS);
  const [showModal, setShowModal]     = useState(false);
  const [stopLoading, setStopLoading] = useState(false);
  const [stopSuccess, setStopSuccess] = useState(false);
  const [menuOpen, setMenuOpen]       = useState(false);

  const account = useCurrentAccount();
  const { mutate: signAndExecute } = useSignAndExecuteTransaction();

  const passed  = actions.filter(a => a.status === "PASS").length;
  const blocked = actions.filter(a => a.status === "BLOCKED").length;

  const handleEmergencyStop = () => {
    if (!account) { alert("Connect your Sui wallet first."); return; }
    setShowModal(true);
  };

  const confirmStop = () => {
    setStopLoading(true);
    const tx = new Transaction();
    tx.moveCall({
      target: `${PACKAGE_ID}::execution_vault::set_active`,
      arguments: [tx.object(VAULT_ID), tx.object(OWNER_CAP_ID), tx.pure.bool(false)],
    });
    signAndExecute({ transaction: tx }, {
      onSuccess: (result) => { setStopLoading(false); setShowModal(false); setIsActive(false); setStopSuccess(true); console.log("Stop tx:", result.digest); },
      onError:   (err)    => { setStopLoading(false); setShowModal(false); alert("Failed: " + err.message); },
    });
  };

  return (
    <div className="min-h-screen bg-void">
      <div className="fixed inset-0 bg-grid-pattern bg-grid opacity-30 pointer-events-none" />
      {showModal && <EmergencyModal onConfirm={confirmStop} onCancel={() => setShowModal(false)} loading={stopLoading} />}

      {stopSuccess && (
        <div className="fixed top-0 left-0 right-0 z-40 bg-red/10 border-b border-red/30 px-4 py-2 flex items-center justify-center gap-2">
          <AlertTriangle size={12} className="text-red flex-shrink-0" />
          <span className="font-mono text-[10px] text-red uppercase tracking-widest text-center">Agent paused — vault deactivated on-chain</span>
        </div>
      )}

      {/* Nav */}
      <nav className={`relative z-10 flex items-center justify-between px-4 sm:px-6 py-4 border-b border-border bg-surface/80 backdrop-blur ${stopSuccess ? "mt-8" : ""}`}>
        <div className="flex items-center gap-2 sm:gap-4 min-w-0">
          <Link href="/" className="flex items-center gap-2 flex-shrink-0">
            <div className="w-6 h-6 rounded border border-cyan/40 flex items-center justify-center">
              <Shield size={12} className="text-cyan" />
            </div>
            <span className="font-mono text-sm text-primary tracking-widest uppercase hidden sm:inline">Guardian<span className="text-cyan">OS</span></span>
          </Link>
          <ChevronRight size={12} className="text-dim hidden sm:block flex-shrink-0" />
          <span className="font-mono text-[10px] text-dim uppercase tracking-widest hidden sm:block truncate">Command Center</span>
        </div>

        {/* Desktop right */}
        <div className="hidden md:flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Blink active={isActive} />
            <span className={`font-mono text-xs uppercase tracking-widest ${isActive ? "text-green" : "text-red"}`}>
              {isActive ? "ACTIVE" : "PAUSED"}
            </span>
          </div>
          <WalletButton />
          <Link href="/dashboard/audit" className="flex items-center gap-1 font-mono text-xs text-ghost hover:text-cyan transition-colors uppercase tracking-wider">
            <Eye size={12} /> Audit
          </Link>
          <button onClick={handleEmergencyStop} disabled={!isActive}
            className={`flex items-center gap-2 px-3 py-2 border font-mono text-xs tracking-wider uppercase transition-all rounded
              ${isActive ? "border-red/40 text-red hover:bg-red/10" : "border-muted text-muted cursor-not-allowed opacity-50"}`}>
            <Power size={12} /> {isActive ? "Emergency Stop" : "Paused"}
          </button>
        </div>

        {/* Mobile right */}
        <div className="flex md:hidden items-center gap-2">
          <WalletButton />
          <button onClick={() => setMenuOpen(o => !o)} className="text-ghost p-1">
            {menuOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </nav>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="relative z-10 md:hidden border-b border-border bg-surface px-4 py-4 space-y-3">
          <div className="flex items-center gap-2">
            <Blink active={isActive} />
            <span className={`font-mono text-xs uppercase ${isActive ? "text-green" : "text-red"}`}>{isActive ? "AGENT ACTIVE" : "AGENT PAUSED"}</span>
          </div>
          <Link href="/dashboard/audit" onClick={() => setMenuOpen(false)} className="block font-mono text-xs text-ghost uppercase tracking-widest">Audit Trail</Link>
          <button onClick={() => { setMenuOpen(false); handleEmergencyStop(); }} disabled={!isActive}
            className={`w-full flex items-center justify-center gap-2 py-2 border font-mono text-xs tracking-wider uppercase rounded
              ${isActive ? "border-red/40 text-red" : "border-muted text-muted opacity-50"}`}>
            <Power size={12} /> Emergency Stop
          </button>
        </div>
      )}

      <div className="relative z-10 max-w-7xl mx-auto px-3 sm:px-6 py-4 sm:py-6 space-y-4 sm:space-y-6">

        {/* Object IDs — scrollable on mobile */}
        <div className="card p-2 sm:p-3 flex items-center gap-3 sm:gap-6 text-[9px] sm:text-[10px] font-mono overflow-x-auto">
          {[{ label: "PKG", id: PACKAGE_ID }, { label: "VAULT", id: VAULT_ID }, { label: "ID", id: IDENTITY_ID }].map(({ label, id }) => (
            <div key={label} className="flex items-center gap-1.5 whitespace-nowrap">
              <span className="text-dim uppercase">{label}:</span>
              <a href={`${EXPLORER}/testnet/object/${id}`} target="_blank" rel="noreferrer" className="text-cyan hover:text-cyan/70">
                {id.slice(0, 8)}...{id.slice(-4)}
              </a>
            </div>
          ))}
          <div className="ml-auto flex items-center gap-1 text-dim whitespace-nowrap">
            <Clock size={9} />
            <span>{new Date().toUTCString().slice(17, 25)} UTC</span>
          </div>
        </div>

        {/* Metrics grid — 2 cols mobile, 4 cols desktop */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div className="card p-4 sm:p-5 border-glow-cyan">
            <div className="flex items-center justify-between mb-2 sm:mb-3">
              <span className="font-mono text-[9px] sm:text-[10px] text-dim uppercase tracking-widest">Balance</span>
              <TrendingUp size={11} className="text-cyan" />
            </div>
            <div className="font-mono text-2xl sm:text-3xl font-700 text-cyan glow-cyan">{vaultBalance.toFixed(3)}</div>
            <div className="font-mono text-[10px] text-dim mt-1">SUI · TESTNET</div>
            <div className="mt-2 sm:mt-3 h-8 sm:h-10">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={BALANCE_HISTORY}>
                  <Area type="monotone" dataKey="v" stroke="#00D4FF" fill="rgba(0,212,255,0.1)" strokeWidth={1.5} dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="card p-4 sm:p-5">
            <div className="flex items-center justify-between mb-2 sm:mb-3">
              <span className="font-mono text-[9px] sm:text-[10px] text-dim uppercase tracking-widest">Passed</span>
              <Activity size={11} className="text-green" />
            </div>
            <div className="font-mono text-2xl sm:text-3xl font-700 text-green glow-green">{passed}</div>
            <div className="font-mono text-[10px] text-dim mt-1">POLICY OK</div>
            <div className="mt-2 sm:mt-3 h-1 bg-border rounded-full">
              <div className="h-full bg-green rounded-full" style={{ width: `${(passed / actions.length) * 100}%` }} />
            </div>
          </div>

          <div className="card p-4 sm:p-5 border-glow-red">
            <div className="flex items-center justify-between mb-2 sm:mb-3">
              <span className="font-mono text-[9px] sm:text-[10px] text-dim uppercase tracking-widest">Blocked</span>
              <AlertTriangle size={11} className="text-red" />
            </div>
            <div className="font-mono text-2xl sm:text-3xl font-700 text-red glow-red">{blocked}</div>
            <div className="font-mono text-[10px] text-dim mt-1">VIOLATIONS</div>
            <div className="mt-2 sm:mt-3 font-mono text-[9px] text-red/60">TRUSTLESS</div>
          </div>

          <div className="card p-4 sm:p-5">
            <div className="flex items-center justify-between mb-2 sm:mb-3">
              <span className="font-mono text-[9px] sm:text-[10px] text-dim uppercase tracking-widest">Daily</span>
              <Clock size={11} className="text-amber" />
            </div>
            <div className="font-mono text-2xl sm:text-3xl font-700 text-amber glow-amber">0.20</div>
            <div className="font-mono text-[10px] text-dim mt-1">of 50 SUI</div>
            <div className="mt-2 sm:mt-3 h-1 bg-border rounded-full">
              <div className="h-full bg-amber rounded-full" style={{ width: "0.4%" }} />
            </div>
          </div>
        </div>

        {/* Skore + Feed — stack on mobile */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-4">
          <div className="card p-5 space-y-5">
            <SkoreMeter score={skore} />
            <div className="h-14">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={SKORE_HISTORY}>
                  <Area type="monotone" dataKey="v" stroke="#00D4FF" fill="rgba(0,212,255,0.08)" strokeWidth={1.5} dot={false} />
                  <Tooltip contentStyle={{ background: "#0D1117", border: "1px solid #1F2937", borderRadius: 4, fontFamily: "JetBrains Mono", fontSize: 10 }} labelStyle={{ color: "#6B7280" }} itemStyle={{ color: "#00D4FF" }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-1.5 text-[10px] font-mono">
              <div className="flex justify-between"><span className="text-dim">SUCCESS +10</span><span className="text-green">▲ reward</span></div>
              <div className="flex justify-between"><span className="text-dim">FAILURE −50</span><span className="text-red">▼ penalty</span></div>
              <div className="flex justify-between"><span className="text-dim">EMERGENCY −100</span><span className="text-red">▼ penalty</span></div>
            </div>
          </div>

          {/* Action feed */}
          <div className="lg:col-span-2 card p-0 overflow-hidden">
            <div className="flex items-center justify-between px-4 sm:px-5 py-3 sm:py-4 border-b border-border">
              <div className="flex items-center gap-2">
                <Terminal size={11} className="text-cyan" />
                <span className="font-mono text-[10px] sm:text-xs text-primary uppercase tracking-widest">Live Action Feed</span>
              </div>
              <div className="flex items-center gap-1.5"><Blink /><span className="font-mono text-[10px] text-green uppercase">Live</span></div>
            </div>

            {/* Mobile: simplified rows */}
            <div className="divide-y divide-border">
              {actions.map((action) => (
                <div key={action.id} className={`px-3 sm:px-5 py-2.5 sm:py-3 ${action.status === "BLOCKED" ? "bg-red/5" : ""}`}>
                  {/* Mobile layout */}
                  <div className="flex items-center gap-2 sm:hidden">
                    <div className={`w-1 h-6 rounded-full flex-shrink-0 ${action.status === "PASS" ? "bg-green" : "bg-red"}`} />
                    <span className={`tag flex-shrink-0 ${action.status === "BLOCKED" ? "bg-red/10 text-red border-red/20" : "bg-green/10 text-green border-green/20"}`}>
                      {action.status === "BLOCKED" ? "⛔" : "✓"} {action.type}
                    </span>
                    <span className="font-mono text-[10px] text-ghost flex-shrink-0">{action.protocol}</span>
                    <span className="font-mono text-[10px] text-primary ml-auto">{action.amount} SUI</span>
                    <span className={`font-mono text-[10px] flex-shrink-0 ${action.score > 0 ? "text-green" : "text-red"}`}>
                      {action.score > 0 ? "+" : ""}{action.score}
                    </span>
                  </div>
                  {/* Desktop layout */}
                  <div className="hidden sm:flex items-center gap-4">
                    <div className={`w-1 h-8 rounded-full flex-shrink-0 ${action.status === "PASS" ? "bg-green" : "bg-red"}`} />
                    <span className="font-mono text-[10px] text-dim w-16 flex-shrink-0">{action.time}</span>
                    <span className={`tag flex-shrink-0 ${action.status === "BLOCKED" ? "bg-red/10 text-red border-red/20" : "bg-green/10 text-green border-green/20"}`}>
                      {action.status === "BLOCKED" ? "⛔ " : "✓ "}{action.type}
                    </span>
                    <span className="font-mono text-xs text-ghost flex-shrink-0 w-20">{action.protocol}</span>
                    <span className="font-mono text-xs text-primary flex-shrink-0 w-20">{action.amount} SUI</span>
                    <span className="font-mono text-[10px] text-dim flex-1 truncate">
                      {action.status === "BLOCKED" ? "Policy violation — tx reverted atomically" : `Tx: ${action.tx}`}
                    </span>
                    <span className={`font-mono text-xs flex-shrink-0 ${action.score > 0 ? "text-green" : "text-red"}`}>
                      {action.score > 0 ? "+" : ""}{action.score}
                    </span>
                    {action.tx && (
                      <a href={`${EXPLORER}/testnet/tx/${action.tx}`} target="_blank" rel="noreferrer" className="flex-shrink-0 text-dim hover:text-cyan transition-colors">
                        <Eye size={12} />
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="mx-3 sm:mx-5 my-3 sm:my-4 p-3 sm:p-4 border border-red/20 bg-red/5 rounded">
              <div className="flex items-start gap-2 sm:gap-3">
                <AlertTriangle size={12} className="text-red flex-shrink-0 mt-0.5" />
                <div>
                  <div className="font-mono text-[10px] text-red uppercase tracking-widest mb-1">Trustless Enforcement Active</div>
                  <div className="font-mono text-[10px] text-dim leading-relaxed">
                    2 actions blocked by the on-chain policy engine. Move VM reverted atomically. Zero funds moved.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Policy + Identity — stack on mobile */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
          <div className="card p-4 sm:p-5">
            <div className="flex items-center gap-2 mb-3 sm:mb-4">
              <Lock size={11} className="text-amber" />
              <span className="font-mono text-[10px] sm:text-xs text-primary uppercase tracking-widest">Active Policy</span>
            </div>
            <div className="space-y-2 font-mono text-[10px] sm:text-xs">
              {[
                { label: "Protocols",    value: "Scallop, NAVI",        ok: true  },
                { label: "Actions",      value: "LEND, SWAP",           ok: true  },
                { label: "Max/Action",   value: "10.00 SUI",            ok: true  },
                { label: "Daily Cap",    value: "50.00 SUI",            ok: true  },
                { label: "Send",         value: "BLOCKED — no whitelist", ok: false },
              ].map(({ label, value, ok }) => (
                <div key={label} className="flex items-center justify-between py-1 border-b border-border last:border-0">
                  <span className="text-dim uppercase tracking-wider">{label}</span>
                  <span className={ok ? "text-primary" : "text-red"}>{value}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="card p-4 sm:p-5">
            <div className="flex items-center gap-2 mb-3 sm:mb-4">
              <Shield size={11} className="text-cyan" />
              <span className="font-mono text-[10px] sm:text-xs text-primary uppercase tracking-widest">Agent Identity</span>
            </div>
            <div className="space-y-2 font-mono text-[10px] sm:text-xs">
              {[
                { label: "Type",      value: "Yield Optimizer"              },
                { label: "Status",    value: isActive ? "ACTIVE" : "PAUSED" },
                { label: "Executions", value: "5 total"                     },
                { label: "Success",   value: "3 (60%)"                      },
                { label: "Skore",     value: `${skore} / 1000`              },
              ].map(({ label, value }) => (
                <div key={label} className="flex items-center justify-between py-1 border-b border-border last:border-0">
                  <span className="text-dim uppercase tracking-wider">{label}</span>
                  <span className={value === "ACTIVE" ? "text-green" : value === "PAUSED" ? "text-amber" : "text-primary"}>{value}</span>
                </div>
              ))}
            </div>
            <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-border flex gap-2 sm:gap-3">
              <Link href="/dashboard/audit" className="flex-1 flex items-center justify-center gap-1.5 py-2 border border-border text-ghost font-mono text-[9px] sm:text-[10px] uppercase tracking-widest hover:border-cyan/30 hover:text-cyan transition-all rounded">
                <Eye size={9} /> Audit Trail
              </Link>
              <a href={`${EXPLORER}/testnet/object/${IDENTITY_ID}`} target="_blank" rel="noreferrer"
                className="flex-1 flex items-center justify-center gap-1.5 py-2 border border-border text-ghost font-mono text-[9px] sm:text-[10px] uppercase tracking-widest hover:border-cyan/30 hover:text-cyan transition-all rounded">
                <Zap size={9} /> On-Chain
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
"use client";
import Link from "next/link";
import { useState, useEffect } from "react";
import { Shield, Zap, Lock, Eye, ArrowRight, Terminal } from "lucide-react";

const TYPING_LINES = [
  "Initializing GuardianOS v1.0...",
  "Loading policy engine............. OK",
  "Execution vault................... ARMED",
  "Walrus audit layer................ CONNECTED",
  "Skoré reputation engine........... ONLINE",
  "Agent identity NFT................ MINTED",
  "All systems nominal. Ready.",
];

const STATS = [
  { label: "Vaults Secured", value: "1", suffix: "" },
  { label: "Policies Enforced", value: "100", suffix: "%" },
  { label: "Audit Logs", value: "∞", suffix: "" },
  { label: "Rug Risk", value: "0", suffix: "%" },
];

export default function Home() {
  const [lines, setLines] = useState<string[]>([]);
  const [currentLine, setCurrentLine] = useState(0);
  const [currentChar, setCurrentChar] = useState(0);
  const [showCursor, setShowCursor] = useState(true);

  useEffect(() => {
    if (currentLine >= TYPING_LINES.length) return;
    const line = TYPING_LINES[currentLine];
    if (currentChar < line.length) {
      const t = setTimeout(() => setCurrentChar(c => c + 1), 28);
      return () => clearTimeout(t);
    } else {
      const t = setTimeout(() => {
        setLines(l => [...l, line]);
        setCurrentLine(l => l + 1);
        setCurrentChar(0);
      }, 400);
      return () => clearTimeout(t);
    }
  }, [currentLine, currentChar]);

  useEffect(() => {
    const t = setInterval(() => setShowCursor(c => !c), 530);
    return () => clearInterval(t);
  }, []);

  const typingText = currentLine < TYPING_LINES.length
    ? TYPING_LINES[currentLine].slice(0, currentChar)
    : "";

  return (
    <main className="min-h-screen bg-void relative overflow-hidden">

      {/* Grid background */}
      <div className="fixed inset-0 bg-grid-pattern bg-grid opacity-40 pointer-events-none" />
      <div className="fixed inset-0 bg-radial-glow pointer-events-none" />

      {/* Top nav */}
      <nav className="relative z-10 flex items-center justify-between px-8 py-5 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded border border-cyan/40 flex items-center justify-center animate-glow_cyan">
            <Shield size={14} className="text-cyan" />
          </div>
          <span className="font-mono text-sm font-600 tracking-widest text-primary uppercase">
            Guardian<span className="text-cyan">OS</span>
          </span>
          <span className="tag bg-cyan/10 text-cyan border border-cyan/20 ml-2">TESTNET</span>
        </div>
        <div className="flex items-center gap-6">
          <Link href="/dashboard" className="font-mono text-xs text-ghost hover:text-cyan transition-colors tracking-wider uppercase">
            Dashboard
          </Link>
          <Link href="/dashboard/audit" className="font-mono text-xs text-ghost hover:text-cyan transition-colors tracking-wider uppercase">
            Audit Trail
          </Link>
          <Link href="/dashboard" className="flex items-center gap-2 px-4 py-2 bg-cyan/10 border border-cyan/30 text-cyan font-mono text-xs tracking-wider uppercase hover:bg-cyan/20 transition-all rounded">
            <Zap size={12} /> Launch App
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative z-10 max-w-6xl mx-auto px-8 pt-24 pb-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">

          {/* Left — copy */}
          <div className="animate-slide_up">
            <div className="flex items-center gap-2 mb-6">
              <div className="w-1.5 h-1.5 rounded-full bg-green animate-pulse" />
              <span className="font-mono text-xs text-green tracking-widest uppercase">System Online</span>
            </div>

            <h1 className="font-display text-5xl font-700 leading-tight mb-6">
              The{" "}
              <span className="text-cyan glow-cyan">Safe</span>
              {" "}for the<br />
              <span className="text-primary">Agentic Web.</span>
            </h1>

            <p className="text-ghost font-sans text-lg leading-relaxed mb-4">
              AI agents are managing real money on-chain.
              Most are a single exploit away from draining everything.
            </p>
            <p className="text-primary font-sans text-lg leading-relaxed mb-8">
              GuardianOS is the <span className="text-cyan">trust enforcement layer</span> that sits between
              the agent and the blockchain — making autonomous DeFi safe by design.
            </p>

            <div className="flex items-center gap-4">
              <Link href="/dashboard" className="group flex items-center gap-3 px-6 py-3 bg-cyan text-void font-mono text-sm font-600 tracking-wider uppercase rounded hover:bg-cyan/90 transition-all">
                Open Dashboard
                <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
              </Link>
              <a href="https://suiscan.xyz/testnet" target="_blank" rel="noreferrer"
                className="flex items-center gap-2 px-6 py-3 border border-border text-ghost font-mono text-xs tracking-wider uppercase hover:border-cyan/30 hover:text-cyan transition-all rounded">
                <Eye size={12} /> Explorer
              </a>
            </div>
          </div>

          {/* Right — terminal */}
          <div className="relative animate-fade_in">
            <div className="card border-glow-cyan p-0 overflow-hidden">
              {/* Terminal header */}
              <div className="flex items-center gap-2 px-4 py-3 border-b border-border bg-panel">
                <div className="w-3 h-3 rounded-full bg-red/60" />
                <div className="w-3 h-3 rounded-full bg-amber/60" />
                <div className="w-3 h-3 rounded-full bg-green/60" />
                <span className="font-mono text-xs text-dim ml-2 tracking-wider">guardian_os — init.sh</span>
              </div>
              {/* Terminal body */}
              <div className="p-5 font-mono text-xs leading-relaxed min-h-[200px]">
                <div className="text-dim mb-2">$ ./guardian_os --init --network testnet</div>
                {lines.map((line, i) => (
                  <div key={i} className={`${line.includes("OK") || line.includes("ARMED") || line.includes("ONLINE") || line.includes("MINTED") || line.includes("CONNECTED") || line.includes("Ready") ? "text-green" : "text-ghost"} mb-1`}>
                    {line}
                  </div>
                ))}
                {currentLine < TYPING_LINES.length && (
                  <div className="text-ghost">
                    {typingText}
                    <span className={`text-cyan ${showCursor ? "opacity-100" : "opacity-0"}`}>█</span>
                  </div>
                )}
              </div>
            </div>

            {/* Floating stat */}
            <div className="absolute -right-4 -bottom-4 card px-4 py-3 border-glow-green">
              <div className="font-mono text-xs text-dim mb-1">LAST TX</div>
              <div className="font-mono text-sm text-green">✓ CONFIRMED</div>
              <div className="font-mono text-[10px] text-dim mt-1">9wEgMjpZ8pump...</div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats bar */}
      <section className="relative z-10 border-y border-border bg-surface/50">
        <div className="max-w-6xl mx-auto px-8 py-6 grid grid-cols-4 gap-0">
          {STATS.map((s, i) => (
            <div key={i} className={`px-6 py-2 ${i > 0 ? "border-l border-border" : ""}`}>
              <div className="font-mono text-2xl font-700 text-cyan glow-cyan">{s.value}{s.suffix}</div>
              <div className="font-mono text-xs text-dim uppercase tracking-widest mt-1">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="relative z-10 max-w-6xl mx-auto px-8 py-20">
        <div className="flex items-center gap-3 mb-12">
          <Terminal size={16} className="text-cyan" />
          <span className="font-mono text-xs text-cyan uppercase tracking-widest">Architecture</span>
          <div className="flex-1 h-px bg-border ml-2" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { icon: "01", title: "Agent Identity", desc: "Soulbound NFT on Sui. Non-transferable passport that tracks every action.", color: "cyan", tag: "guardian_identity.move" },
            { icon: "02", title: "Execution Vault", desc: "Agent is a limited operator. Funds never leave without policy approval.", color: "green", tag: "execution_vault.move" },
            { icon: "03", title: "Policy Engine", desc: "On-chain rules: which protocols, max spend, daily cap. Atomic enforcement.", color: "amber", tag: "policy_engine.move" },
            { icon: "04", title: "Walrus Black Box", desc: "Every AI decision hashed and stored. Tamper-proof audit trail forever.", color: "violet", tag: "walrus storage" },
          ].map((item) => (
            <div key={item.icon} className="card p-5 hover:border-cyan/20 transition-colors group">
              <div className={`font-mono text-3xl font-700 text-${item.color}/20 group-hover:text-${item.color}/40 transition-colors mb-4`}>{item.icon}</div>
              <h3 className="font-display font-600 text-primary mb-2">{item.title}</h3>
              <p className="font-sans text-sm text-ghost leading-relaxed mb-4">{item.desc}</p>
              <span className={`tag bg-${item.color}/10 text-${item.color} border border-${item.color}/20`}>{item.tag}</span>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="relative z-10 max-w-6xl mx-auto px-8 pb-20">
        <div className="card border-glow-cyan p-12 text-center relative overflow-hidden">
          <div className="absolute inset-0 bg-radial-glow opacity-50" />
          <div className="relative z-10">
            <Lock size={32} className="text-cyan mx-auto mb-4 animate-float" />
            <h2 className="font-display text-3xl font-700 text-primary mb-4">
              Your agent. Your rules. <span className="text-cyan">Enforced on-chain.</span>
            </h2>
            <p className="font-sans text-ghost mb-8 max-w-xl mx-auto">
              Deploy your first GuardianOS vault in one transaction. No trust required.
            </p>
            <Link href="/dashboard" className="inline-flex items-center gap-3 px-8 py-4 bg-cyan text-void font-mono text-sm font-600 tracking-wider uppercase rounded hover:bg-cyan/90 transition-all animate-glow_cyan">
              <Shield size={16} /> Launch GuardianOS
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-border px-8 py-6 flex items-center justify-between">
        <span className="font-mono text-xs text-dim">GuardianOS © 2026 — Sui Overflow Hackathon</span>
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-green animate-pulse" />
          <span className="font-mono text-xs text-dim">Testnet Live</span>
        </div>
      </footer>
    </main>
  );
}
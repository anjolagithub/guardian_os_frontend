"use client";
import Link from "next/link";
import { Shield, ChevronRight, Copy, Check } from "lucide-react";
import { useState } from "react";

function CodeBlock({ code, lang = "typescript" }: { code: string; lang?: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <div className="relative bg-panel border border-border rounded-lg overflow-hidden mb-4">
      <div className="flex items-center justify-between px-4 py-2 border-b border-border">
        <span className="font-mono text-[10px] text-dim uppercase tracking-widest">{lang}</span>
        <button onClick={copy} className="flex items-center gap-1 font-mono text-[10px] text-dim hover:text-cyan transition-colors">
          {copied ? <Check size={10} className="text-green" /> : <Copy size={10} />}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <pre className="p-4 overflow-x-auto text-[11px] font-mono text-ghost leading-relaxed">
        <code>{code}</code>
      </pre>
    </div>
  );
}

function Section({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} className="mb-12">
      <h2 className="font-display text-lg font-700 text-primary mb-4 pb-2 border-b border-border">
        {title}
      </h2>
      {children}
    </section>
  );
}

function Param({ name, type, desc }: { name: string; type: string; desc: string }) {
  return (
    <div className="flex gap-4 py-2 border-b border-border/50 last:border-0">
      <span className="font-mono text-[11px] text-cyan w-32 flex-shrink-0">{name}</span>
      <span className="font-mono text-[11px] text-violet w-24 flex-shrink-0">{type}</span>
      <span className="font-mono text-[11px] text-ghost">{desc}</span>
    </div>
  );
}

export default function DocsPage() {
  return (
    <div className="min-h-screen bg-void">
      <div className="fixed inset-0 bg-grid-pattern bg-grid opacity-30 pointer-events-none" />

      {/* Nav */}
      <nav className="relative z-10 flex items-center justify-between px-4 sm:px-6 py-4 border-b border-border bg-surface/80 backdrop-blur">
        <div className="flex items-center gap-2">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-6 h-6 rounded border border-cyan/40 flex items-center justify-center">
              <Shield size={12} className="text-cyan" />
            </div>
            <span className="font-mono text-sm text-primary tracking-widest uppercase hidden sm:inline">
              Guardian<span className="text-cyan">OS</span>
            </span>
          </Link>
          <ChevronRight size={12} className="text-dim" />
          <span className="font-mono text-[10px] text-cyan uppercase tracking-widest">Docs</span>
        </div>
        <Link href="/deploy"
          className="px-4 py-2 bg-cyan text-void font-mono text-xs font-600 uppercase tracking-wider rounded hover:bg-cyan/90 transition-all">
          Deploy Vault →
        </Link>
      </nav>

      <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12">

        {/* Hero */}
        <div className="mb-12">
          <div className="tag bg-cyan/10 text-cyan border-cyan/20 mb-4">Developer Documentation</div>
          <h1 className="font-display text-3xl sm:text-4xl font-700 text-primary mb-4">
            GuardianOS <span className="text-cyan">Integration Guide</span>
          </h1>
          <p className="font-sans text-ghost leading-relaxed max-w-2xl">
            Add on-chain policy enforcement to any AI agent in minutes.
            GuardianOS vaults enforce spending rules at the Move VM level —
            your agent cannot exceed its limits, even if compromised.
          </p>
        </div>

        {/* TOC */}
        <div className="card p-4 mb-10">
          <div className="font-mono text-[10px] text-dim uppercase tracking-widest mb-3">Contents</div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
            {[
              ["#overview",    "Overview"],
              ["#quickstart",  "Quickstart"],
              ["#deploy-vault","Deploy a Vault"],
              ["#request-spend","Call request_spend"],
              ["#agent-types", "Agent Types"],
              ["#error-codes", "Error Codes"],
              ["#walrus",      "Walrus Audit Trail"],
              ["#contracts",   "Contract Reference"],
            ].map(([href, label]) => (
              <a key={href} href={href}
                className="font-mono text-[11px] text-ghost hover:text-cyan transition-colors py-1">
                {label}
              </a>
            ))}
          </div>
        </div>

        {/* Overview */}
        <Section id="overview" title="Overview">
          <p className="font-sans text-ghost text-sm leading-relaxed mb-4">
            GuardianOS is a trust enforcement layer for autonomous AI agents on Sui.
            Instead of giving your agent unrestricted wallet access, you deploy a vault
            with explicit spending rules. The vault enforces those rules atomically —
            if the agent violates any rule, the entire transaction reverts.
          </p>
          <div className="card p-4 border-cyan/20 bg-cyan/5 mb-4">
            <div className="font-mono text-[10px] text-cyan uppercase tracking-widest mb-2">
              The security model in one sentence
            </div>
            <div className="font-sans text-sm text-primary">
              Your agent calls <code className="text-cyan">request_spend()</code> instead of submitting
              transactions directly. The vault checks policy before releasing any funds.
              Violation = full PTB revert. Nothing moves.
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              { title: "Protocol whitelist", desc: "Agent can only interact with approved protocols" },
              { title: "Spending caps", desc: "Per-action and daily limits enforced by the VM" },
              { title: "Kill switch", desc: "Owner drains vault and freezes agent in one tx" },
            ].map(({ title, desc }) => (
              <div key={title} className="card p-3">
                <div className="font-mono text-[10px] text-cyan uppercase tracking-widest mb-1">{title}</div>
                <div className="font-sans text-xs text-ghost">{desc}</div>
              </div>
            ))}
          </div>
        </Section>

        {/* Quickstart */}
        <Section id="quickstart" title="Quickstart">
          <p className="font-sans text-ghost text-sm mb-4">
            Three steps to add GuardianOS to your existing agent:
          </p>
          <div className="space-y-4">
            <div className="flex gap-4">
              <div className="w-7 h-7 rounded-full bg-cyan/10 border border-cyan/30 flex items-center justify-center font-mono text-xs text-cyan flex-shrink-0">1</div>
              <div>
                <div className="font-mono text-xs text-primary mb-1">Deploy a vault</div>
                <div className="font-sans text-xs text-ghost">Use the GuardianOS dashboard to create a vault with your policy settings. Takes 30 seconds.</div>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="w-7 h-7 rounded-full bg-cyan/10 border border-cyan/30 flex items-center justify-center font-mono text-xs text-cyan flex-shrink-0">2</div>
              <div>
                <div className="font-mono text-xs text-primary mb-1">Replace your transaction submission</div>
                <div className="font-sans text-xs text-ghost">Instead of submitting transactions directly, route them through <code className="text-cyan">request_spend()</code>.</div>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="w-7 h-7 rounded-full bg-cyan/10 border border-cyan/30 flex items-center justify-center font-mono text-xs text-cyan flex-shrink-0">3</div>
              <div>
                <div className="font-mono text-xs text-primary mb-1">Fund and activate</div>
                <div className="font-sans text-xs text-ghost">Deposit SUI into the vault and your agent is live with full policy enforcement.</div>
              </div>
            </div>
          </div>
        </Section>

        {/* Deploy vault */}
        <Section id="deploy-vault" title="Deploy a Vault">
          <p className="font-sans text-ghost text-sm mb-4">
            Deploy via the UI at <Link href="/deploy" className="text-cyan hover:underline">guardian-os-frontend.vercel.app/deploy</Link>,
            or programmatically using the TypeScript SDK:
          </p>
          <CodeBlock code={`import { Transaction } from "@mysten/sui/transactions";
import { SuiClient, getFullnodeUrl } from "@mysten/sui/client";

const PACKAGE_ID = "0xd89bcaeaab49e51b21baaaee43924081e2ee899da7ce1fdbdb6ff0b7a8ee8c1f";

const tx = new Transaction();

tx.moveCall({
  target: \`\${PACKAGE_ID}::guardian_setup::setup_guardian\`,
  arguments: [
    tx.pure.u8(0),                          // agent_type: 0=Yield, 1=Trader, 2=DAO, 3=Custom
    tx.pure.vector("u8", [0, 1]),           // allowed_protocols: Scallop(0) + NAVI(1)
    tx.pure.vector("u8", [1]),              // allowed_actions: Lend(1) only
    tx.pure.u64(BigInt(10_000_000_000)),    // max per action: 10 SUI in MIST
    tx.pure.u64(BigInt(50_000_000_000)),    // daily cap: 50 SUI in MIST
    tx.pure.vector("address", []),          // send whitelist: [] = send blocked
  ],
});

// Sign and execute — creates ExecutionVault + AgentIdentity + OwnerCap
// All transferred to your wallet automatically`} />

          <div className="card p-4 mb-4">
            <div className="font-mono text-[10px] text-dim uppercase tracking-widest mb-3">Protocol IDs</div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[["0", "Scallop"], ["1", "NAVI"], ["2", "DeepBook"], ["3", "Cetus"]].map(([id, name]) => (
                <div key={id} className="bg-panel rounded p-2 text-center">
                  <div className="font-mono text-sm text-cyan">{id}</div>
                  <div className="font-mono text-[10px] text-dim">{name}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="card p-4">
            <div className="font-mono text-[10px] text-dim uppercase tracking-widest mb-3">Action IDs</div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[["0", "SWAP"], ["1", "LEND"], ["2", "HOLD"], ["3", "SEND"]].map(([id, name]) => (
                <div key={id} className="bg-panel rounded p-2 text-center">
                  <div className="font-mono text-sm text-cyan">{id}</div>
                  <div className="font-mono text-[10px] text-dim">{name}</div>
                </div>
              ))}
            </div>
          </div>
        </Section>

        {/* request_spend */}
        <Section id="request-spend" title="Calling request_spend">
          <p className="font-sans text-ghost text-sm mb-4">
            This is the core integration point. Replace your existing transaction
            submission with a call to <code className="text-cyan">request_spend()</code>.
            The vault enforces your policy atomically — if any rule is violated,
            the entire transaction reverts before any funds move.
          </p>
          <CodeBlock code={`import { Transaction } from "@mysten/sui/transactions";

const PACKAGE_ID  = "0xd89bca..."; // GuardianOS package
const VAULT_ID    = "0x4934...";   // Your vault object ID
const IDENTITY_ID = "0x3a0f...";   // Your agent identity ID

const tx = new Transaction();

// request_spend returns Coin<SUI> — you MUST consume it
const [spendCoin] = tx.moveCall({
  target: \`\${PACKAGE_ID}::execution_vault::request_spend\`,
  arguments: [
    tx.object(VAULT_ID),              // &mut ExecutionVault
    tx.object(IDENTITY_ID),           // &mut AgentIdentity
    tx.pure.u8(1),                    // action_type: 1 = LEND
    tx.pure.u8(0),                    // protocol: 0 = Scallop
    tx.pure.u64(BigInt(1_000_000_000)), // amount: 1 SUI in MIST
    tx.pure.address("0x0..."),        // target address (0x0 for lend/swap)
  ],
});

// Route the coin to your target protocol in the same PTB
// For now: return to agent wallet
tx.transferObjects([spendCoin], agentAddress);

// If policy is violated → entire tx reverts. Nothing moves.
// If policy passes → coin is released and routed to target.
await client.signAndExecuteTransaction({ transaction: tx, signer: keypair });`} />

          <div className="card p-4 border-amber-500/20 bg-amber-500/5 mb-4">
            <div className="font-mono text-[10px] text-amber-400 uppercase tracking-widest mb-2">
              ⚠️ Critical
            </div>
            <div className="font-sans text-xs text-ghost">
              <code className="text-cyan">request_spend()</code> returns <code className="text-cyan">Coin&lt;SUI&gt;</code>.
              In Sui PTBs, every return value must be consumed. If you don't handle the returned coin,
              your transaction will fail. Always follow with <code className="text-cyan">transferObjects</code> or
              a protocol deposit call.
            </div>
          </div>

          <div className="font-mono text-[10px] text-dim uppercase tracking-widest mb-3">Parameters</div>
          <div className="card p-4 mb-4">
            <Param name="vault" type="&mut ExecutionVault" desc="The vault object ID. Must be active and funded." />
            <Param name="identity" type="&mut AgentIdentity" desc="The agent identity. Must not be frozen." />
            <Param name="action_type" type="u8" desc="0=Swap, 1=Lend, 2=Hold, 3=Send" />
            <Param name="protocol" type="u8" desc="0=Scallop, 1=NAVI, 2=DeepBook, 3=Cetus" />
            <Param name="amount_mist" type="u64" desc="Amount in MIST (1 SUI = 1,000,000,000 MIST)" />
            <Param name="target_address" type="address" desc="Destination. Use 0x0 for lend/swap. Required for SEND action." />
          </div>
        </Section>

        {/* Agent types */}
        <Section id="agent-types" title="Agent Types">
          <p className="font-sans text-ghost text-sm mb-4">
            GuardianOS supports four agent archetypes. Choose one when deploying your vault —
            it's stored in your AgentIdentity and affects Skoré calculation and recommended policy templates.
          </p>
          <div className="space-y-3">
            {[
              {
                id: 0, icon: "📈", name: "Yield Optimizer",
                desc: "Lends idle funds to whichever protocol offers the highest APY. Rebalances automatically.",
                policy: "Protocols: Scallop + NAVI. Actions: Lend. Cap: 10 SUI/action."
              },
              {
                id: 1, icon: "⚡", name: "Trader",
                desc: "Executes swap strategies on DeepBook or Cetus within defined limits.",
                policy: "Protocols: DeepBook + Cetus. Actions: Swap. Cap: 20 SUI/action."
              },
              {
                id: 2, icon: "🏛️", name: "DAO Treasury",
                desc: "Manages protocol-owned liquidity. Supports whitelisted sends for contributor payments.",
                policy: "Protocols: Scallop + NAVI. Actions: Lend + Send. Cap: 500 SUI/action."
              },
              {
                id: 3, icon: "⚙️", name: "Custom",
                desc: "Full control over every parameter. For advanced integrations.",
                policy: "Configurable. Set any combination of protocols, actions, and caps."
              },
            ].map(t => (
              <div key={t.id} className="card p-4">
                <div className="flex items-start gap-3">
                  <div className="text-2xl">{t.icon}</div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-display font-600 text-primary text-sm">{t.name}</span>
                      <span className="tag bg-surface text-dim border-border font-mono text-[9px]">
                        type={t.id}
                      </span>
                    </div>
                    <p className="font-sans text-xs text-ghost mb-2">{t.desc}</p>
                    <div className="font-mono text-[10px] text-dim bg-panel rounded px-3 py-1.5">
                      {t.policy}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Section>

        {/* Error codes */}
        <Section id="error-codes" title="Error Codes">
          <p className="font-sans text-ghost text-sm mb-4">
            When a policy violation occurs, the Move VM aborts with one of these error codes.
            The entire PTB reverts — no funds move.
          </p>
          <div className="card p-4">
            {[
              ["E_PROTOCOL_NOT_ALLOWED",    "1", "Protocol not in vault's allowed_protocols list"],
              ["E_ACTION_NOT_ALLOWED",      "2", "Action type not in vault's allowed_actions list"],
              ["E_EXCEEDS_PER_ACTION_CAP",  "3", "Amount exceeds max_per_action_mist"],
              ["E_EXCEEDS_DAILY_CAP",       "4", "Would exceed daily_cap_mist for this epoch"],
              ["E_ADDRESS_NOT_WHITELISTED", "5", "Send target not in whitelist"],
              ["E_VAULT_MISMATCH",          "6", "Policy does not belong to this vault"],
              ["E_IDENTITY_FROZEN",         "2", "Agent identity is frozen (emergency stop triggered)"],
              ["E_VAULT_INACTIVE",          "3", "Vault is paused (set_active called with false)"],
              ["E_INSUFFICIENT_FUNDS",      "4", "Vault balance too low for requested amount"],
            ].map(([name, code, desc]) => (
              <div key={name} className="flex gap-4 py-2 border-b border-border/50 last:border-0">
                <span className="font-mono text-[10px] text-red w-52 flex-shrink-0">{name}</span>
                <span className="font-mono text-[10px] text-dim w-6 flex-shrink-0">{code}</span>
                <span className="font-mono text-[10px] text-ghost">{desc}</span>
              </div>
            ))}
          </div>
        </Section>

        {/* Walrus */}
        <Section id="walrus" title="Walrus Audit Trail">
          <p className="font-sans text-ghost text-sm mb-4">
            Every agent decision should be logged to Walrus for permanent, tamper-proof storage.
            This creates an immutable black box — anyone can verify what the agent was thinking
            when it made a decision.
          </p>
          <CodeBlock code={`// Log every decision to Walrus — success or failure
const logEntry = {
  timestamp:   Date.now(),
  goal:        "Maximize SUI yield",
  marketData:  [{ protocol: "Scallop", supplyApy: 0.042 }],
  reasoning:   "Scallop leads at 4.2%. Lending 1 SUI within policy.",
  action:      { actionType: 1, protocol: 0, amountMist: "1000000000" },
  txDigest:    "9shqjT...", // null if reverted
  success:     true,
  vaultId:     VAULT_ID,
};

const res = await fetch(
  "https://publisher.walrus-testnet.walrus.space/v1/blobs?epochs=5",
  {
    method:  "PUT",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify(logEntry),
  }
);

const { newlyCreated } = await res.json();
const blobId = newlyCreated?.blobObject?.blobId;

// Verify at: https://walruscan.com/testnet/blob/\${blobId}`} />

          <div className="card p-4 border-violet/20 bg-violet/5">
            <div className="font-mono text-[10px] text-violet uppercase tracking-widest mb-2">
              About Walrus
            </div>
            <div className="font-sans text-xs text-ghost leading-relaxed">
              Walrus is a decentralized storage protocol built on Sui. Blobs stored on Walrus
              are content-addressed and cannot be modified after creation. This makes it ideal
              for audit trails — neither you nor GuardianOS can alter the reasoning logs after
              they're written.
            </div>
          </div>
        </Section>

        {/* Contract reference */}
        <Section id="contracts" title="Contract Reference">
          <div className="card p-4 mb-4">
            <div className="font-mono text-[10px] text-dim uppercase tracking-widest mb-3">
              Deployed Package
            </div>
            <div className="font-mono text-xs text-cyan break-all">
              0xd89bcaeaab49e51b21baaaee43924081e2ee899da7ce1fdbdb6ff0b7a8ee8c1f
            </div>
            <div className="font-mono text-[10px] text-dim mt-1">Sui Testnet</div>
          </div>

          <div className="space-y-3">
            {[
              {
                module: "execution_vault",
                functions: [
                  "create_vault(policy, identity, ctx) → (ExecutionVault, OwnerCap)",
                  "deposit(vault, coin)",
                  "request_spend(vault, identity, action, protocol, amount, target, ctx) → Coin<SUI>",
                  "emergency_withdraw(vault, identity, cap, ctx) → Coin<SUI>",
                  "set_active(vault, cap, active)",
                ]
              },
              {
                module: "policy_engine",
                functions: [
                  "create_policy(vault_id, protocols, actions, per_action, daily, whitelist, ctx) → PolicyNFT",
                  "check_action_allowed(policy, vault_id, action, protocol, amount, target, daily_spent) → bool",
                ]
              },
              {
                module: "guardian_identity",
                functions: [
                  "mint_identity(agent_type, ctx) → AgentIdentity",
                  "record_execution(identity, success)",
                  "freeze_identity(identity)",
                ]
              },
              {
                module: "guardian_setup",
                functions: [
                  "setup_guardian(type, protocols, actions, per_action, daily, whitelist, ctx)",
                ]
              },
            ].map(({ module, functions }) => (
              <div key={module} className="card p-4">
                <div className="font-mono text-xs text-cyan mb-3">{module}.move</div>
                <div className="space-y-1">
                  {functions.map(fn => (
                    <div key={fn} className="font-mono text-[10px] text-ghost bg-panel rounded px-3 py-1.5">
                      {fn}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </Section>

        {/* CTA */}
        <div className="card p-6 text-center border-cyan/20 bg-cyan/5">
          <h3 className="font-display text-lg font-700 text-primary mb-2">
            Ready to integrate?
          </h3>
          <p className="font-sans text-sm text-ghost mb-4">
            Deploy your vault in 30 seconds and start protecting your agent.
          </p>
          <div className="flex gap-3 justify-center">
            <Link href="/deploy"
              className="px-6 py-2.5 bg-cyan text-void font-mono text-xs font-600 uppercase tracking-wider rounded hover:bg-cyan/90 transition-all">
              Deploy Vault →
            </Link>
            <a href="https://github.com/your-repo/guardian_os"
              target="_blank" rel="noreferrer"
              className="px-6 py-2.5 border border-border text-ghost font-mono text-xs uppercase tracking-widest rounded hover:border-cyan/30 hover:text-cyan transition-all">
              View on GitHub
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
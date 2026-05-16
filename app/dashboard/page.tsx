'use client'
import { useState } from 'react'
import Link from 'next/link'
import { Shield, Zap, AlertTriangle, Activity, Lock, TrendingUp, Clock, Eye, Terminal, ChevronRight, Power, Wallet, Menu, X, RefreshCw, Plus } from 'lucide-react'
import { AreaChart, Area, ResponsiveContainer, Tooltip } from 'recharts'
import { useCurrentAccount, useConnectWallet, useDisconnectWallet, useSignAndExecuteTransaction, useWallets } from '@mysten/dapp-kit'
import { Transaction } from '@mysten/sui/transactions'
import { useVaultData } from '@/hooks/useVaultData'
import { suiscanTx, suiscanObj, TIER_COLORS } from '@/lib/constants'

const PACKAGE_ID   = process.env.NEXT_PUBLIC_PACKAGE_ID   ?? ''
const OWNER_CAP_ID = process.env.NEXT_PUBLIC_OWNER_CAP_ID ?? ''

function timeAgo(ms: number) {
  const diff = Date.now() - ms
  if (diff < 60_000)   return `${Math.floor(diff / 1000)}s ago`
  if (diff < 3600_000) return `${Math.floor(diff / 60_000)}m ago`
  return `${Math.floor(diff / 3600_000)}h ago`
}

function Blink({ active = true }: { active?: boolean }) {
  return <span className={`inline-block w-1.5 h-1.5 rounded-full flex-shrink-0 ${active ? 'bg-green animate-pulse' : 'bg-muted'}`} />
}

function TrustMeter({ score, tier, tierIndex }: { score: number; tier: string; tierIndex: number }) {
  const pct = (score / 1000) * 100
  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <span className="font-mono text-[10px] text-dim uppercase tracking-widest">Trust Score</span>
        <span className={`tag border ${TIER_COLORS[tierIndex]}`}>{tier}</span>
      </div>
      <div className="font-mono text-3xl sm:text-4xl font-700 text-cyan glow-cyan">{score}<span className="text-dim text-lg">/1000</span></div>
      <div className="h-1.5 bg-border rounded-full overflow-hidden">
        <div className="h-full bg-gradient-to-r from-cyan to-green rounded-full transition-all duration-1000" style={{ width: `${pct}%` }} />
      </div>
      <div className="flex justify-between font-mono text-[9px] text-dim">
        <span>Bronze</span><span>Silver</span><span>Gold</span><span>Elite</span>
      </div>
    </div>
  )
}

function EmergencyModal({ onConfirm, onCancel, loading }: { onConfirm: () => void; onCancel: () => void; loading: boolean }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="card border-glow-red p-6 sm:p-8 max-w-md w-full space-y-5">
        <div className="flex items-center gap-3">
          <AlertTriangle size={20} className="text-red" />
          <span className="font-mono text-sm text-red uppercase tracking-widest">Stop Agent</span>
        </div>
        <p className="font-sans text-ghost text-sm leading-relaxed">
          This will <strong className="text-primary">return all vault funds to your wallet</strong> and permanently freeze the agent. Your trust score history is preserved.
        </p>
        <p className="font-mono text-[10px] text-dim bg-panel rounded p-3">
          Your wallet will ask you to sign once. Funds return immediately.
        </p>
        <div className="flex gap-3">
          <button onClick={onCancel} className="flex-1 py-2.5 border border-border text-ghost font-mono text-xs uppercase tracking-widest hover:border-cyan/30 hover:text-cyan transition-all rounded">Cancel</button>
          <button onClick={onConfirm} disabled={loading}
            className="flex-1 py-2.5 bg-red/10 border border-red/40 text-red font-mono text-xs uppercase tracking-widest hover:bg-red/20 transition-all rounded disabled:opacity-50">
            {loading ? 'Signing...' : 'Stop & Withdraw'}
          </button>
        </div>
      </div>
    </div>
  )
}

function WalletButton() {
  const account                = useCurrentAccount()
  const wallets                = useWallets()
  const { mutate: connect }    = useConnectWallet()
  const { mutate: disconnect } = useDisconnectWallet()

  if (account) return (
    <button onClick={() => disconnect()}
      className="flex items-center gap-1.5 px-2 sm:px-3 py-1.5 border border-green/30 text-green font-mono text-[10px] uppercase tracking-wider hover:bg-green/10 transition-all rounded">
      <div className="w-1.5 h-1.5 rounded-full bg-green" />
      <span className="hidden sm:inline">{account.address.slice(0, 6)}...{account.address.slice(-4)}</span>
      <span className="sm:hidden">Connected</span>
    </button>
  )

  return (
    <button onClick={() => wallets[0] && connect({ wallet: wallets[0] })}
      className="flex items-center gap-1.5 px-2 sm:px-3 py-1.5 border border-cyan/30 text-cyan font-mono text-[10px] uppercase tracking-wider hover:bg-cyan/10 transition-all rounded">
      <Wallet size={10} />
      <span className="hidden sm:inline">Connect Wallet</span>
      <span className="sm:hidden">Connect</span>
    </button>
  )
}

export default function Dashboard() {
  const account = useCurrentAccount()
  const { vault, events, loading, refresh } = useVaultData(account?.address)
  const [showModal, setShowModal]     = useState(false)
  const [stopLoading, setStopLoading] = useState(false)
  const [stopSuccess, setStopSuccess] = useState(false)
  const [menuOpen, setMenuOpen]       = useState(false)

  const { mutate: signAndExecute } = useSignAndExecuteTransaction()

  const passed  = events.filter(e => e.status === 'success').length
  const blocked = events.filter(e => e.status === 'blocked').length

  const balanceHistory = [
    { v: 0.5 }, { v: 0.5 }, { v: 0.5 },
    { v: vault?.balanceSUI ?? 0.3 }, { v: vault?.balanceSUI ?? 0.3 }, { v: vault?.balanceSUI ?? 0.3 },
  ]

  const isActive = vault?.isActive ?? true
  const isFrozen = vault?.isFrozen ?? false

  // Use dynamic IDs from the hook — not hardcoded env vars
  const vaultId    = vault?.vaultId    ?? ''
  const identityId = vault?.identityId ?? ''

  const handleEmergencyStop = () => {
    if (!account) { alert('Connect your Sui wallet first.'); return }
    if (!vaultId)  { alert('No vault found for this wallet.'); return }
    setShowModal(true)
  }

  const confirmStop = () => {
    setStopLoading(true)
    const tx = new Transaction()
    tx.moveCall({
      target: `${PACKAGE_ID}::execution_vault::emergency_withdraw`,
      arguments: [
        tx.object(vaultId),
        tx.object(identityId),
        tx.object(OWNER_CAP_ID),
      ],
    })
    signAndExecute({ transaction: tx }, {
      onSuccess: (result) => {
        setStopLoading(false)
        setShowModal(false)
        setStopSuccess(true)
        refresh()
        console.log('Emergency stop tx:', result.digest)
      },
      onError: (err) => {
        setStopLoading(false)
        setShowModal(false)
        alert('Failed: ' + err.message)
      },
    })
  }

  return (
    <div className="min-h-screen bg-void">
      <div className="fixed inset-0 bg-grid-pattern bg-grid opacity-30 pointer-events-none" />
      {showModal && <EmergencyModal onConfirm={confirmStop} onCancel={() => setShowModal(false)} loading={stopLoading} />}

      {stopSuccess && (
        <div className="fixed top-0 left-0 right-0 z-40 bg-red/10 border-b border-red/30 px-4 py-2 flex items-center justify-center gap-2">
          <AlertTriangle size={12} className="text-red flex-shrink-0" />
          <span className="font-mono text-[10px] text-red uppercase tracking-widest">Agent stopped — funds returned to your wallet</span>
        </div>
      )}

      {/* Nav */}
      <nav className={`relative z-10 flex items-center justify-between px-4 sm:px-6 py-4 border-b border-border bg-surface/80 backdrop-blur ${stopSuccess ? 'mt-8' : ''}`}>
        <div className="flex items-center gap-2 sm:gap-4 min-w-0">
          <Link href="/" className="flex items-center gap-2 flex-shrink-0">
            <div className="w-6 h-6 rounded border border-cyan/40 flex items-center justify-center">
              <Shield size={12} className="text-cyan" />
            </div>
            <span className="font-mono text-sm text-primary tracking-widest uppercase hidden sm:inline">Guardian<span className="text-cyan">OS</span></span>
          </Link>
          <ChevronRight size={12} className="text-dim hidden sm:block flex-shrink-0" />
          <span className="font-mono text-[10px] text-dim uppercase tracking-widest hidden sm:block">My Vault</span>
        </div>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Blink active={isActive && !isFrozen} />
            <span className={`font-mono text-xs uppercase tracking-widest ${isFrozen ? 'text-red' : isActive ? 'text-green' : 'text-amber'}`}>
              {isFrozen ? 'FROZEN' : isActive ? 'ACTIVE' : 'PAUSED'}
            </span>
          </div>
          <button onClick={refresh} className="text-dim hover:text-cyan transition-colors p-1" title="Refresh">
            <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
          </button>
          <WalletButton />
          {/* Create new vault */}
          <Link href="/deploy"
            className="flex items-center gap-1 font-mono text-xs text-ghost hover:text-cyan transition-colors uppercase tracking-wider">
            <Plus size={12} /> New Vault
          </Link>
          <Link href="/dashboard/audit"
            className="flex items-center gap-1 font-mono text-xs text-ghost hover:text-cyan transition-colors uppercase tracking-wider">
            <Eye size={12} /> Audit Trail
          </Link>
          <button onClick={handleEmergencyStop} disabled={!isActive || isFrozen || !vaultId}
            className={`flex items-center gap-2 px-3 py-2 border font-mono text-xs tracking-wider uppercase transition-all rounded
              ${isActive && !isFrozen && vaultId ? 'border-red/40 text-red hover:bg-red/10' : 'border-muted text-muted cursor-not-allowed opacity-50'}`}>
            <Power size={12} />
            {isFrozen ? 'Frozen' : isActive ? 'Stop Agent' : 'Paused'}
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
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Blink active={isActive && !isFrozen} />
              <span className={`font-mono text-xs uppercase ${isFrozen ? 'text-red' : isActive ? 'text-green' : 'text-amber'}`}>
                {isFrozen ? 'Frozen' : isActive ? 'Active' : 'Paused'}
              </span>
            </div>
            <button onClick={refresh} className="text-dim hover:text-cyan">
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>
          <Link href="/deploy" onClick={() => setMenuOpen(false)} className="block font-mono text-xs text-ghost uppercase tracking-widest">+ New Vault</Link>
          <Link href="/dashboard/audit" onClick={() => setMenuOpen(false)} className="block font-mono text-xs text-ghost uppercase tracking-widest">Audit Trail</Link>
          <button onClick={() => { setMenuOpen(false); handleEmergencyStop() }} disabled={!isActive || isFrozen || !vaultId}
            className={`w-full flex items-center justify-center gap-2 py-2 border font-mono text-xs tracking-wider uppercase rounded
              ${isActive && !isFrozen && vaultId ? 'border-red/40 text-red' : 'border-muted text-muted opacity-50'}`}>
            <Power size={12} /> Stop Agent
          </button>
        </div>
      )}

      <div className="relative z-10 max-w-7xl mx-auto px-3 sm:px-6 py-4 sm:py-6 space-y-4 sm:space-y-6">

        {/* No wallet connected */}
        {!account && (
          <div className="card p-12 flex flex-col items-center justify-center text-center space-y-4">
            <Shield size={32} className="text-dim" />
            <div className="font-display text-lg font-600 text-primary">Connect your wallet</div>
            <div className="font-mono text-xs text-dim">Connect your Sui wallet to view your vault dashboard</div>
            <WalletButton />
          </div>
        )}

        {/* No vault found */}
        {account && !loading && !vault && (
          <div className="card p-12 flex flex-col items-center justify-center text-center space-y-4">
            <Shield size={32} className="text-dim" />
            <div className="font-display text-lg font-600 text-primary">No vault found</div>
            <div className="font-mono text-xs text-dim max-w-sm">
              You don&apos;t have a GuardianOS vault yet. Create one to get started.
            </div>
            <Link href="/deploy" className="flex items-center gap-2 px-6 py-3 bg-cyan text-void font-mono text-sm font-600 tracking-wider uppercase rounded hover:bg-cyan/90 transition-all">
              <Plus size={14} /> Create Your Vault
            </Link>
          </div>
        )}

        {/* Loading */}
        {account && loading && !vault && (
          <div className="card p-8 flex items-center justify-center gap-3">
            <RefreshCw size={16} className="text-cyan animate-spin" />
            <span className="font-mono text-xs text-dim uppercase tracking-widest">Reading your vault from chain...</span>
          </div>
        )}

        {/* Main content — only show when vault is found */}
        {vault && (
          <>
            {/* Vault ID bar */}
            <div className="card p-2 sm:p-3 flex items-center gap-3 sm:gap-6 text-[9px] sm:text-[10px] font-mono overflow-x-auto">
              {[
                { label: 'Vault',    id: vaultId },
                { label: 'Agent ID', id: identityId },
                { label: 'Package',  id: PACKAGE_ID },
              ].map(({ label, id }) => (
                <div key={label} className="flex items-center gap-1.5 whitespace-nowrap">
                  <span className="text-dim">{label}:</span>
                  <a href={suiscanObj(id)} target="_blank" rel="noreferrer" className="text-cyan hover:text-cyan/70">
                    {id.slice(0, 8)}...{id.slice(-4)}
                  </a>
                </div>
              ))}
              <div className="ml-auto flex items-center gap-1 text-dim whitespace-nowrap">
                <Clock size={9} /><span>{new Date().toUTCString().slice(17, 25)} UTC</span>
              </div>
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              <div className="card p-4 sm:p-5 border-glow-cyan">
                <div className="flex items-center justify-between mb-2 sm:mb-3">
                  <span className="font-mono text-[9px] sm:text-[10px] text-dim uppercase tracking-widest">Vault Balance</span>
                  <TrendingUp size={11} className="text-cyan" />
                </div>
                <div className="font-mono text-2xl sm:text-3xl font-700 text-cyan glow-cyan">{vault.balanceSUI.toFixed(3)}</div>
                <div className="font-mono text-[10px] text-dim mt-1">SUI · TESTNET</div>
                <div className="mt-2 sm:mt-3 h-8 sm:h-10">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={balanceHistory}>
                      <Area type="monotone" dataKey="v" stroke="#00D4FF" fill="rgba(0,212,255,0.1)" strokeWidth={1.5} dot={false} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="card p-4 sm:p-5">
                <div className="flex items-center justify-between mb-2 sm:mb-3">
                  <span className="font-mono text-[9px] sm:text-[10px] text-dim uppercase tracking-widest">Successful</span>
                  <Activity size={11} className="text-green" />
                </div>
                <div className="font-mono text-2xl sm:text-3xl font-700 text-green glow-green">{vault.successfulExecutions}</div>
                <div className="font-mono text-[10px] text-dim mt-1">ACTIONS COMPLETED</div>
                <div className="mt-2 sm:mt-3 h-1 bg-border rounded-full">
                  <div className="h-full bg-green rounded-full" style={{ width: vault.totalExecutions > 0 ? `${(vault.successfulExecutions / vault.totalExecutions) * 100}%` : '0%' }} />
                </div>
              </div>

              <div className="card p-4 sm:p-5 border-glow-red">
                <div className="flex items-center justify-between mb-2 sm:mb-3">
                  <span className="font-mono text-[9px] sm:text-[10px] text-dim uppercase tracking-widest">Blocked</span>
                  <AlertTriangle size={11} className="text-red" />
                </div>
                <div className="font-mono text-2xl sm:text-3xl font-700 text-red glow-red">{blocked}</div>
                <div className="font-mono text-[10px] text-dim mt-1">POLICY VIOLATIONS</div>
                <div className="mt-2 sm:mt-3 font-mono text-[9px] text-red/60">CHAIN ENFORCED</div>
              </div>

              <div className="card p-4 sm:p-5">
                <div className="flex items-center justify-between mb-2 sm:mb-3">
                  <span className="font-mono text-[9px] sm:text-[10px] text-dim uppercase tracking-widest">{"Today's Usage"}</span>
                  <Clock size={11} className="text-amber" />
                </div>
                <div className="font-mono text-2xl sm:text-3xl font-700 text-amber glow-amber">{vault.dailySpentSUI.toFixed(2)}</div>
                <div className="font-mono text-[10px] text-dim mt-1">of {vault.dailyCapSUI.toFixed(0)} SUI limit</div>
                <div className="mt-2 sm:mt-3 h-1 bg-border rounded-full">
                  <div className="h-full bg-amber rounded-full" style={{ width: vault.dailyCapSUI > 0 ? `${Math.min((vault.dailySpentSUI / vault.dailyCapSUI) * 100, 100)}%` : '0%' }} />
                </div>
              </div>
            </div>

            {/* Trust Score + Feed */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-4">
              <div className="card p-5 space-y-5">
                <TrustMeter score={vault.skore} tier={vault.tier} tierIndex={vault.tierIndex} />
                <div className="space-y-1.5 text-[10px] font-mono pt-2 border-t border-border">
                  <div className="flex justify-between"><span className="text-dim">Each successful action</span><span className="text-green">+10 points</span></div>
                  <div className="flex justify-between"><span className="text-dim">Each failure</span><span className="text-red">−50 points</span></div>
                  <div className="flex justify-between"><span className="text-dim">Emergency stop</span><span className="text-red">−100 points</span></div>
                </div>
                <div className="text-[10px] font-mono text-dim space-y-1 pt-2 border-t border-border">
                  <div className="flex justify-between"><span>Total actions</span><span className="text-primary">{vault.totalExecutions}</span></div>
                  <div className="flex justify-between"><span>Success rate</span>
                    <span className="text-green">{vault.totalExecutions > 0 ? Math.round((vault.successfulExecutions / vault.totalExecutions) * 100) : 0}%</span>
                  </div>
                </div>
              </div>

              {/* Live feed */}
              <div className="lg:col-span-2 card p-0 overflow-hidden">
                <div className="flex items-center justify-between px-4 sm:px-5 py-3 sm:py-4 border-b border-border">
                  <div className="flex items-center gap-2">
                    <Terminal size={11} className="text-cyan" />
                    <span className="font-mono text-[10px] sm:text-xs text-primary uppercase tracking-widest">Live Action Feed</span>
                  </div>
                  <div className="flex items-center gap-2"><Blink /><span className="font-mono text-[10px] text-green uppercase">Live</span></div>
                </div>

                {events.length === 0 ? (
                  <div className="p-8 text-center space-y-3">
                    <div className="font-mono text-xs text-dim uppercase tracking-widest">No actions yet</div>
                    <div className="font-mono text-[10px] text-muted">Run the agent middleware to see activity here</div>
                    <div className="font-mono text-[10px] text-dim bg-panel rounded p-3 text-left">
                      <div className="text-cyan mb-1">$ cd middleware</div>
                      <div>$ npx ts-node agent.ts</div>
                    </div>
                  </div>
                ) : (
                  <div className="divide-y divide-border">
                    {events.map((event) => (
                      <div key={event.id} className={`px-3 sm:px-5 py-2.5 sm:py-3 ${event.status === 'blocked' ? 'bg-red/5' : ''}`}>
                        <div className="flex items-center gap-2 sm:hidden">
                          <div className={`w-1 h-6 rounded-full flex-shrink-0 ${event.status === 'success' ? 'bg-green' : 'bg-red'}`} />
                          <span className={`tag flex-shrink-0 ${event.status === 'blocked' ? 'bg-red/10 text-red border-red/20' : 'bg-green/10 text-green border-green/20'}`}>
                            {event.status === 'blocked' ? '⛔' : '✓'} {event.action}
                          </span>
                          <span className="font-mono text-[10px] text-ghost">{event.protocol}</span>
                          <span className="font-mono text-[10px] text-primary ml-auto">{event.amountSUI.toFixed(3)} SUI</span>
                        </div>
                        <div className="hidden sm:flex items-center gap-4">
                          <div className={`w-1 h-8 rounded-full flex-shrink-0 ${event.status === 'success' ? 'bg-green' : 'bg-red'}`} />
                          <span className="font-mono text-[10px] text-dim w-16 flex-shrink-0">{timeAgo(event.timestampMs)}</span>
                          <span className={`tag flex-shrink-0 ${event.status === 'blocked' ? 'bg-red/10 text-red border-red/20' : 'bg-green/10 text-green border-green/20'}`}>
                            {event.status === 'blocked' ? '⛔ ' : '✓ '}{event.action}
                          </span>
                          <span className="font-mono text-xs text-ghost flex-shrink-0 w-20">{event.protocol}</span>
                          <span className="font-mono text-xs text-primary flex-shrink-0 w-24">{event.amountSUI.toFixed(3)} SUI</span>
                          <span className="font-mono text-[10px] text-dim flex-1 truncate">
                            {event.status === 'blocked' ? 'Policy blocked — no funds moved' : 'Confirmed on-chain'}
                          </span>
                          <a href={suiscanTx(event.txDigest)} target="_blank" rel="noreferrer"
                            className="flex-shrink-0 font-mono text-[10px] text-cyan hover:text-cyan/70">View →</a>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {blocked > 0 && (
                  <div className="mx-3 sm:mx-5 my-3 p-3 border border-red/20 bg-red/5 rounded">
                    <div className="flex items-start gap-2">
                      <AlertTriangle size={12} className="text-red flex-shrink-0 mt-0.5" />
                      <div className="font-mono text-[10px] text-dim leading-relaxed">
                        <span className="text-red">{blocked} action{blocked > 1 ? 's' : ''} blocked</span> — rejected by the on-chain policy engine. Move VM reverted atomically. Zero funds moved.
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Policy + Status */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
              <div className="card p-4 sm:p-5">
                <div className="flex items-center gap-2 mb-3 sm:mb-4">
                  <Lock size={11} className="text-amber" />
                  <span className="font-mono text-[10px] sm:text-xs text-primary uppercase tracking-widest">Spending Policy</span>
                </div>
                <div className="space-y-2 font-mono text-[10px] sm:text-xs">
                  {[
                    { label: 'Allowed platforms', value: 'Scallop, NAVI', ok: true  },
                    { label: 'Allowed actions',   value: 'Lend, Swap',   ok: true  },
                    { label: 'Max per action',    value: '10 SUI',       ok: true  },
                    { label: "Today's limit",     value: `${vault.dailyCapSUI.toFixed(0)} SUI`, ok: true },
                    { label: 'Send to external',  value: 'Blocked',      ok: false },
                  ].map(({ label, value, ok }) => (
                    <div key={label} className="flex items-center justify-between py-1 border-b border-border last:border-0">
                      <span className="text-dim">{label}</span>
                      <span className={ok ? 'text-primary' : 'text-red'}>{value}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="card p-4 sm:p-5">
                <div className="flex items-center gap-2 mb-3 sm:mb-4">
                  <Shield size={11} className="text-cyan" />
                  <span className="font-mono text-[10px] sm:text-xs text-primary uppercase tracking-widest">Vault Status</span>
                </div>
                <div className="space-y-2 font-mono text-[10px] sm:text-xs">
                  {[
                    { label: 'Type',          value: 'Yield Optimizer' },
                    { label: 'Status',        value: isFrozen ? 'Frozen' : isActive ? 'Active' : 'Paused' },
                    { label: 'Total actions', value: String(vault.totalExecutions) },
                    { label: 'Completed',     value: String(vault.successfulExecutions) },
                    { label: 'Trust score',   value: `${vault.skore} / 1000` },
                  ].map(({ label, value }) => (
                    <div key={label} className="flex items-center justify-between py-1 border-b border-border last:border-0">
                      <span className="text-dim">{label}</span>
                      <span className={value === 'Active' ? 'text-green' : value === 'Frozen' ? 'text-red' : value === 'Paused' ? 'text-amber' : 'text-primary'}>{value}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-3 sm:mt-4 pt-3 border-t border-border flex gap-2">
                  <Link href="/dashboard/audit" className="flex-1 flex items-center justify-center gap-1.5 py-2 border border-border text-ghost font-mono text-[9px] uppercase tracking-widest hover:border-cyan/30 hover:text-cyan transition-all rounded">
                    <Eye size={9} /> Audit Trail
                  </Link>
                  <a href={suiscanObj(vaultId)} target="_blank" rel="noreferrer"
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 border border-border text-ghost font-mono text-[9px] uppercase tracking-widest hover:border-cyan/30 hover:text-cyan transition-all rounded">
                    <Zap size={9} /> View On-Chain
                  </a>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
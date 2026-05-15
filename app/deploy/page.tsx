'use client'
import { useState } from 'react'
import { useSignAndExecuteTransaction, useCurrentAccount, useWallets, useConnectWallet } from '@mysten/dapp-kit'
import { Transaction } from '@mysten/sui/transactions'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Shield, ChevronRight, ChevronLeft, Wallet, Check } from 'lucide-react'
import { toMIST } from '@/lib/constants'

const PACKAGE_ID = process.env.NEXT_PUBLIC_PACKAGE_ID
if (!PACKAGE_ID) {
  return <div>Missing NEXT_PUBLIC_PACKAGE_ID in environment</div>
}

const TEMPLATES = [
  {
    id: 0, icon: '📈', name: 'Yield Optimizer',
    desc: 'Automatically moves your SUI to whichever protocol offers the best yield today.',
    protocols: [0, 1], actions: [1], perAction: 10, daily: 50,
  },
  {
    id: 1, icon: '⚡', name: 'Trader',
    desc: 'Executes swap strategies across DeepBook and Cetus within your limits.',
    protocols: [2, 3], actions: [0], perAction: 20, daily: 100,
  },
  {
    id: 2, icon: '🏛️', name: 'DAO Treasury',
    desc: 'Manages treasury funds with strict controls and whitelisted addresses only.',
    protocols: [0, 1], actions: [1, 3], perAction: 500, daily: 2000,
  },
  {
    id: 3, icon: '⚙️', name: 'Custom',
    desc: 'Configure every parameter yourself from scratch.',
    protocols: [0], actions: [1], perAction: 5, daily: 25,
  },
]

const PROTOCOL_OPTS = [{ id: 0, name: 'Scallop' }, { id: 1, name: 'NAVI' }, { id: 2, name: 'DeepBook' }, { id: 3, name: 'Cetus' }]
const ACTION_OPTS   = [{ id: 0, name: 'Swap' }, { id: 1, name: 'Lend' }, { id: 2, name: 'Hold' }, { id: 3, name: 'Send' }]

function StepDots({ step }: { step: number }) {
  return (
    <div className="flex items-center justify-center gap-2 mb-8">
      {[1, 2, 3, 4, 5].map(s => (
        <div key={s} className="flex items-center gap-2">
          <div className={`w-7 h-7 rounded-full flex items-center justify-center font-mono text-xs font-600 transition-all
            ${step > s ? 'bg-green text-void' : step === s ? 'bg-cyan text-void' : 'bg-surface border border-border text-dim'}`}>
            {step > s ? <Check size={12} /> : s}
          </div>
          {s < 5 && <div className={`w-8 h-px transition-all ${step > s ? 'bg-green' : 'bg-border'}`} />}
        </div>
      ))}
    </div>
  )
}

export default function DeployPage() {
  const router = useRouter()
  const account = useCurrentAccount()
  const wallets = useWallets()
  const { mutate: connect } = useConnectWallet()
  const { mutate: signAndExecute, isPending } = useSignAndExecuteTransaction()

  const [step, setStep]         = useState(1)
  const [template, setTemplate] = useState<typeof TEMPLATES[0] | null>(null)
  const [protocols, setProtocols] = useState([0, 1])
  const [actions, setActions]   = useState([1])
  const [perAction, setPerAction] = useState(10)
  const [daily, setDaily]       = useState(50)
  const [whitelist, setWhitelist] = useState<string[]>([])
  const [asset, setAsset]       = useState<'SUI' | 'USDsui'>('SUI')
  const [deposit, setDeposit]   = useState(5)
  const [isDeploying, setIsDeploying] = useState(false)
  const [deployStatus, setDeployStatus] = useState<'idle' | 'creating' | 'depositing' | 'done'>('idle')

  const policySummary = () => {
    const pNames = protocols.map(p => ['Scallop', 'NAVI', 'DeepBook', 'Cetus'][p])
    const aNames = actions.map(a => ['Swap', 'Lend', 'Hold', 'Send'][a])
    return `${pNames.join(' and ')} only. ${aNames.join(' and ')}. Max ${perAction} SUI per action. ${daily} SUI daily limit.`
  }

  const handleDeploy = async () => {
    if (!account) return
    setIsDeploying(true)
    setDeployStatus('creating')

    const setupTx = new Transaction()
    setupTx.moveCall({
      target: `${PACKAGE_ID}::guardian_setup::setup_guardian`,
      arguments: [
        setupTx.pure.u8(template?.id ?? 0),
        setupTx.pure.vector('u8', protocols),
        setupTx.pure.vector('u8', actions),
        setupTx.pure.u64(toMIST(perAction)),
        setupTx.pure.u64(toMIST(daily)),
        setupTx.pure.vector('address', whitelist),
      ],
    })

    signAndExecute({ transaction: setupTx, chain: 'sui:testnet' }, {
     onSuccess: async (setupResult) => {
  setDeployStatus('depositing')
  
  // Fetch the full tx to get object changes
  const txDetails = await fetch(
    `https://fullnode.testnet.sui.io:443`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'sui_getTransactionBlock',
        params: [
          setupResult.digest,
          { showObjectChanges: true, showEffects: true }
        ]
      })
    }
  ).then(r => r.json())

  const changes = txDetails?.result?.objectChanges ?? []
  const vaultChange = changes.find(
    (c: any) => c.type === 'created' && c.objectType?.includes('ExecutionVault')
  )

  if (!vaultChange?.objectId) {
    console.error('Object changes:', changes)
    // Still redirect — vault was created, user can use existing dashboard
    router.push('/dashboard')
    return
  }

  const newVaultId = vaultChange.objectId
  console.log('New vault ID:', newVaultId)
  
  // Deposit
  const depositTx = new Transaction()
  const [coin] = depositTx.splitCoins(depositTx.gas, [depositTx.pure.u64(toMIST(deposit))])
  depositTx.moveCall({
    target: `${PACKAGE_ID}::execution_vault::deposit`,
    arguments: [depositTx.object(newVaultId), coin],
  })

  signAndExecute({ transaction: depositTx }, {
    onSuccess: () => { setDeployStatus('done'); setTimeout(() => router.push('/dashboard'), 1500) },
    onError:   () => { setDeployStatus('done'); setTimeout(() => router.push('/dashboard'), 1500) },
  })
},
      onError: (err) => {
        console.error('Setup failed:', err)
        setIsDeploying(false)
        setDeployStatus('idle')
        alert('Deploy failed: ' + err.message)
      },
    })
  }

  if (!account) {
    return (
      <div className="min-h-screen bg-void flex items-center justify-center p-4">
        <div className="card p-8 sm:p-12 max-w-md w-full text-center space-y-6">
          <div className="w-12 h-12 rounded border border-cyan/40 flex items-center justify-center mx-auto">
            <Shield size={24} className="text-cyan" />
          </div>
          <div>
            <h2 className="font-display text-xl font-700 text-primary mb-2">Connect your wallet</h2>
            <p className="font-sans text-sm text-ghost">You need a Sui wallet to deploy a GuardianOS vault.</p>
          </div>
          <button onClick={() => wallets[0] && connect({ wallet: wallets[0] })}
            className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-cyan text-void font-mono text-sm font-600 tracking-wider uppercase rounded hover:bg-cyan/90 transition-all">
            <Wallet size={16} /> Connect Wallet
          </button>
          <Link href="/" className="block font-mono text-xs text-dim hover:text-ghost uppercase tracking-widest">← Back to home</Link>
        </div>
      </div>
    )
  }

  if (isDeploying) {
    return (
      <div className="min-h-screen bg-void flex items-center justify-center p-4">
        <div className="card p-8 sm:p-12 max-w-md w-full text-center space-y-6">
          <div className="w-12 h-12 rounded-full border border-cyan/40 flex items-center justify-center mx-auto animate-pulse">
            <Shield size={24} className="text-cyan" />
          </div>
          <div>
            <h2 className="font-display text-xl font-700 text-primary mb-2">
              {deployStatus === 'creating'   ? 'Creating your vault...' :
               deployStatus === 'depositing' ? 'Depositing funds...' :
               'Done! Redirecting...'}
            </h2>
            <p className="font-mono text-xs text-dim">
              {deployStatus === 'creating'   ? 'Sign the first transaction in your wallet.' :
               deployStatus === 'depositing' ? 'Sign the second transaction to deposit funds.' :
               'Your vault is live on Sui testnet.'}
            </p>
          </div>
          <div className="flex justify-center gap-3 font-mono text-[10px]">
            {['creating', 'depositing', 'done'].map((s, i) => (
              <div key={s} className={`flex items-center gap-1.5 ${deployStatus === s ? 'text-cyan' : ['creating', 'depositing', 'done'].indexOf(deployStatus) > i ? 'text-green' : 'text-dim'}`}>
                {['creating', 'depositing', 'done'].indexOf(deployStatus) > i ? <Check size={10} /> : <div className="w-1.5 h-1.5 rounded-full bg-current" />}
                <span className="uppercase">{s === 'creating' ? 'Create vault' : s === 'depositing' ? 'Deposit' : 'Done'}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-void">
      <div className="fixed inset-0 bg-grid-pattern bg-grid opacity-30 pointer-events-none" />

      <nav className="relative z-10 flex items-center justify-between px-4 sm:px-8 py-4 border-b border-border bg-surface/80 backdrop-blur">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-6 h-6 rounded border border-cyan/40 flex items-center justify-center">
            <Shield size={12} className="text-cyan" />
          </div>
          <span className="font-mono text-sm text-primary tracking-widest uppercase hidden sm:inline">Guardian<span className="text-cyan">OS</span></span>
        </Link>
        <span className="font-mono text-xs text-dim uppercase tracking-widest">Deploy Agent</span>
        <div className="flex items-center gap-2 text-[10px] font-mono text-green border border-green/30 px-2 py-1 rounded">
          <div className="w-1.5 h-1.5 rounded-full bg-green" />
          {account.address.slice(0, 6)}...{account.address.slice(-4)}
        </div>
      </nav>

      <div className="relative z-10 max-w-2xl mx-auto px-4 py-8 sm:py-12">
        <StepDots step={step} />

        {/* Step 1 — Choose type */}
        {step === 1 && (
          <div>
            <h2 className="font-display text-2xl sm:text-3xl font-700 text-primary mb-2">What should your agent do?</h2>
            <p className="font-sans text-ghost text-sm mb-8">Choose a template — you can customize everything on the next step.</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {TEMPLATES.map(t => (
                <button key={t.id} onClick={() => { setTemplate(t); setProtocols(t.protocols); setActions(t.actions); setPerAction(t.perAction); setDaily(t.daily); setStep(2) }}
                  className="card p-5 text-left hover:border-cyan/30 transition-all group">
                  <div className="text-3xl mb-3">{t.icon}</div>
                  <div className="font-display font-600 text-primary mb-2 group-hover:text-cyan transition-colors">{t.name}</div>
                  <div className="font-sans text-xs text-ghost leading-relaxed">{t.desc}</div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 2 — Configure */}
        {step === 2 && (
          <div className="space-y-6">
            <div>
              <h2 className="font-display text-2xl sm:text-3xl font-700 text-primary mb-2">Set your agent's limits</h2>
              <p className="font-sans text-ghost text-sm">These are enforced by the blockchain — your agent literally cannot exceed them.</p>
            </div>

            <div>
              <label className="font-mono text-xs text-dim uppercase tracking-widest mb-3 block">Allowed platforms</label>
              <div className="flex gap-2 flex-wrap">
                {PROTOCOL_OPTS.map(p => (
                  <button key={p.id} onClick={() => setProtocols(prev => prev.includes(p.id) ? prev.filter(x => x !== p.id) : [...prev, p.id])}
                    className={`px-4 py-2 rounded border font-mono text-xs uppercase tracking-wider transition-all ${protocols.includes(p.id) ? 'border-cyan/40 bg-cyan/10 text-cyan' : 'border-border text-dim hover:border-border/60'}`}>
                    {p.name}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="font-mono text-xs text-dim uppercase tracking-widest mb-3 block">Allowed actions</label>
              <div className="flex gap-2 flex-wrap">
                {ACTION_OPTS.map(a => (
                  <button key={a.id} onClick={() => setActions(prev => prev.includes(a.id) ? prev.filter(x => x !== a.id) : [...prev, a.id])}
                    className={`px-4 py-2 rounded border font-mono text-xs uppercase tracking-wider transition-all ${actions.includes(a.id) ? 'border-green/40 bg-green/10 text-green' : 'border-border text-dim hover:border-border/60'}`}>
                    {a.name}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div className="flex justify-between mb-2">
                <label className="font-mono text-xs text-dim uppercase tracking-widest">Max per action</label>
                <span className="font-mono text-sm text-primary font-600">{perAction} SUI</span>
              </div>
              <input type="range" min="0.1" max="100" step="0.1" value={perAction}
                onChange={e => setPerAction(Number(e.target.value))}
                className="w-full accent-cyan h-1 bg-border rounded-full" />
            </div>

            <div>
              <div className="flex justify-between mb-2">
                <label className="font-mono text-xs text-dim uppercase tracking-widest">{"Daily limit"}</label>
                <span className="font-mono text-sm text-primary font-600">{daily} SUI</span>
              </div>
              <input type="range" min="1" max="1000" step="1" value={daily}
                onChange={e => setDaily(Number(e.target.value))}
                className="w-full accent-cyan h-1 bg-border rounded-full" />
            </div>

            {actions.includes(3) && (
              <div>
                <label className="font-mono text-xs text-dim uppercase tracking-widest mb-2 block">Approved send addresses</label>
                <textarea placeholder="0x... (one address per line)"
                  className="w-full bg-surface border border-border rounded-lg p-3 font-mono text-xs text-ghost h-20 resize-none focus:border-cyan/40 focus:outline-none"
                  onChange={e => setWhitelist(e.target.value.split('\n').map(s => s.trim()).filter(Boolean))} />
                <p className="font-mono text-[10px] text-dim mt-1">Your agent can only send to these addresses. Leave blank to block sending.</p>
              </div>
            )}

            <div className="card p-4 border-cyan/20 bg-cyan/5">
              <div className="font-mono text-[10px] text-cyan uppercase tracking-widest mb-2">Your policy in plain English</div>
              <div className="font-sans text-sm text-primary leading-relaxed">{policySummary()}</div>
            </div>

            <div className="flex gap-3">
              <button onClick={() => setStep(1)} className="flex items-center gap-1 px-4 py-2.5 border border-border text-ghost font-mono text-xs uppercase tracking-widest hover:border-cyan/30 hover:text-cyan transition-all rounded">
                <ChevronLeft size={12} /> Back
              </button>
              <button onClick={() => setStep(3)} disabled={protocols.length === 0 || actions.length === 0}
                className="flex-1 flex items-center justify-center gap-1 py-2.5 bg-cyan text-void font-mono text-xs font-600 uppercase tracking-wider rounded hover:bg-cyan/90 transition-all disabled:opacity-50">
                Continue <ChevronRight size={12} />
              </button>
            </div>
          </div>
        )}

        {/* Step 3 — Asset */}
        {step === 3 && (
          <div className="space-y-6">
            <div>
              <h2 className="font-display text-2xl sm:text-3xl font-700 text-primary mb-2">Choose your vault asset</h2>
              <p className="font-sans text-ghost text-sm">What asset will your agent manage?</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <button onClick={() => setAsset('SUI')}
                className={`card p-5 text-left transition-all ${asset === 'SUI' ? 'border-cyan/40 bg-cyan/5' : 'hover:border-cyan/20'}`}>
                <div className="text-3xl mb-3">🔵</div>
                <div className="font-display font-600 text-primary mb-1">SUI</div>
                <div className="tag bg-green/10 text-green border-green/20 mb-3">✓ Live on testnet</div>
                <div className="font-sans text-xs text-ghost">Sui's native token. Ready to use right now.</div>
              </button>

              <button onClick={() => setAsset('USDsui')}
                className={`card p-5 text-left transition-all ${asset === 'USDsui' ? 'border-violet/40 bg-violet/5' : 'hover:border-violet/20'}`}>
                <div className="text-3xl mb-3">💵</div>
                <div className="font-display font-600 text-primary mb-1">USDsui</div>
                <div className="tag bg-violet/10 text-violet border-violet/20 mb-3">🔜 Mainnet ready</div>
                <div className="font-sans text-xs text-ghost">Built by Mysten Labs for AI agent transactions. Same policy engine, same guarantees.</div>
              </button>
            </div>

            {asset === 'USDsui' && (
              <div className="card p-4 border-violet/20 bg-violet/5">
                <div className="font-mono text-[10px] text-violet uppercase tracking-widest mb-2">About USDsui</div>
                <div className="font-sans text-sm text-ghost leading-relaxed">USDsui was designed by Mysten Labs specifically for AI agent transactions on Sui. GuardianOS is the enforcement layer that makes those transactions safe. Available on mainnet with the same architecture.</div>
              </div>
            )}

            <div className="flex gap-3">
              <button onClick={() => setStep(2)} className="flex items-center gap-1 px-4 py-2.5 border border-border text-ghost font-mono text-xs uppercase tracking-widest hover:border-cyan/30 hover:text-cyan transition-all rounded">
                <ChevronLeft size={12} /> Back
              </button>
              <button onClick={() => setStep(4)}
                className="flex-1 flex items-center justify-center gap-1 py-2.5 bg-cyan text-void font-mono text-xs font-600 uppercase tracking-wider rounded hover:bg-cyan/90 transition-all">
                Continue <ChevronRight size={12} />
              </button>
            </div>
          </div>
        )}

        {/* Step 4 — Fund */}
        {step === 4 && (
          <div className="space-y-6">
            <div>
              <h2 className="font-display text-2xl sm:text-3xl font-700 text-primary mb-2">Fund your vault</h2>
              <p className="font-sans text-ghost text-sm">This is the starting balance your agent will work with. You can add more anytime.</p>
            </div>

            <div className="card p-5">
              <label className="font-mono text-xs text-dim uppercase tracking-widest mb-4 block">Starting amount</label>
              <div className="flex items-center gap-3 mb-4">
                <input type="number" min="0.1" step="0.1" value={deposit}
                  onChange={e => setDeposit(Number(e.target.value))}
                  className="flex-1 bg-panel border border-border rounded-lg px-4 py-3 font-mono text-2xl font-700 text-primary focus:border-cyan/40 focus:outline-none" />
                <span className="font-mono text-lg text-dim font-600">{asset}</span>
              </div>
              <div className="flex gap-2">
                {[1, 5, 10, 50].map(amt => (
                  <button key={amt} onClick={() => setDeposit(amt)}
                    className={`flex-1 py-1.5 border font-mono text-xs rounded transition-all ${deposit === amt ? 'border-cyan/40 text-cyan bg-cyan/10' : 'border-border text-dim hover:border-border/60'}`}>
                    {amt}
                  </button>
                ))}
              </div>
            </div>

            <div className="font-mono text-xs text-dim">
              {"Your agent's daily limit is "}<span className="text-primary">{daily} {asset}</span>.{' '}
              Starting with <span className="text-primary">{deposit} {asset}</span> gives it{' '}
              <span className="text-cyan">{Math.round((deposit / daily) * 100)}%</span> of one day's capacity.
            </div>

            <div className="flex gap-3">
              <button onClick={() => setStep(3)} className="flex items-center gap-1 px-4 py-2.5 border border-border text-ghost font-mono text-xs uppercase tracking-widest hover:border-cyan/30 hover:text-cyan transition-all rounded">
                <ChevronLeft size={12} /> Back
              </button>
              <button onClick={() => setStep(5)}
                className="flex-1 flex items-center justify-center gap-1 py-2.5 bg-cyan text-void font-mono text-xs font-600 uppercase tracking-wider rounded hover:bg-cyan/90 transition-all">
                Review <ChevronRight size={12} />
              </button>
            </div>
          </div>
        )}

        {/* Step 5 — Review & Sign */}
        {step === 5 && (
          <div className="space-y-6">
            <div>
              <h2 className="font-display text-2xl sm:text-3xl font-700 text-primary mb-2">Ready to launch</h2>
              <p className="font-sans text-ghost text-sm">Review your setup before signing.</p>
            </div>

            <div className="card p-5 space-y-3 font-mono text-xs">
              {[
                { label: 'Agent type',       value: `${template?.icon} ${template?.name}` },
                { label: 'Asset',            value: asset },
                { label: 'Starting balance', value: `${deposit} ${asset}` },
                { label: 'Max per action',   value: `${perAction} ${asset}` },
                { label: 'Daily limit',      value: `${daily} ${asset}` },
                { label: 'Platforms',        value: protocols.map(p => ['Scallop', 'NAVI', 'DeepBook', 'Cetus'][p]).join(', ') },
                { label: 'Actions',          value: actions.map(a => ['Swap', 'Lend', 'Hold', 'Send'][a]).join(', ') },
              ].map(({ label, value }) => (
                <div key={label} className="flex items-center justify-between py-1.5 border-b border-border last:border-0">
                  <span className="text-dim">{label}</span>
                  <span className="text-primary">{value}</span>
                </div>
              ))}
            </div>

            <div className="card p-4 border-cyan/20 bg-cyan/5">
              <div className="font-mono text-[10px] text-cyan uppercase tracking-widest mb-2">Spending policy</div>
              <div className="font-sans text-sm text-primary">{policySummary()}</div>
            </div>

            <div className="card p-3 font-mono text-[10px] text-dim">
              Two wallet signatures required: one to create your vault, one to deposit funds. Both happen back-to-back.
            </div>

            <div className="flex gap-3">
              <button onClick={() => setStep(4)} disabled={isDeploying}
                className="flex items-center gap-1 px-4 py-2.5 border border-border text-ghost font-mono text-xs uppercase tracking-widest hover:border-cyan/30 hover:text-cyan transition-all rounded disabled:opacity-50">
                <ChevronLeft size={12} /> Back
              </button>
              <button onClick={handleDeploy} disabled={isDeploying || isPending || !account}
                className="flex-1 flex items-center justify-center gap-2 py-3 bg-cyan text-void font-mono text-sm font-700 uppercase tracking-wider rounded hover:bg-cyan/90 transition-all disabled:opacity-50">
                <Shield size={16} /> Launch Agent 🚀
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
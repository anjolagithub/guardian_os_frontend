// GuardianOS — constants and helpers
// Single source of truth. Never hardcode these anywhere else.

export const PROTOCOLS: Record<number, string> = {
  0: 'Scallop',
  1: 'NAVI',
  2: 'DeepBook',
  3: 'Cetus',
}

export const ACTIONS: Record<number, string> = {
  0: 'Swap',
  1: 'Lend',
  2: 'Hold',
  3: 'Send',
}

export const TIERS: Record<number, string> = {
  0: 'Bronze',
  1: 'Silver',
  2: 'Gold',
  3: 'Elite',
}

export const TIER_COLORS: Record<number, string> = {
  0: 'text-ghost border-ghost/20 bg-ghost/10',
  1: 'text-cyan border-cyan/20 bg-cyan/10',
  2: 'text-amber border-amber/20 bg-amber/10',
  3: 'text-violet border-violet/20 bg-violet/10',
}

export const MIST_PER_SUI = 1_000_000_000n
export const toSUI  = (mist: bigint | string | number) => Number(BigInt(mist.toString())) / 1e9
export const toMIST = (sui: number) => BigInt(Math.floor(sui * 1e9))
export const fmtSUI = (mist: bigint | string | number, decimals = 3) =>
  toSUI(mist).toFixed(decimals)

export const WALRUS_AGGREGATOR = 'https://aggregator.walrus-testnet.walrus.space'
export const WALRUS_PUBLISHER  = 'https://publisher.walrus-testnet.walrus.space'

export const suiscanTx  = (digest: string) => `https://suiscan.xyz/testnet/tx/${digest}`
export const suiscanObj = (id: string)     => `https://suiscan.xyz/testnet/object/${id}`
export const walruscan  = (blobId: string) => `https://walruscan.io/testnet/blob/${blobId}`

// Error code → human readable
export const MOVE_ERRORS: Record<number, string> = {
  1: 'Policy mismatch',
  2: 'Agent is frozen',
  3: 'Vault is paused',
  4: 'Insufficient funds',
  5: 'Not the vault owner',
  6: 'Amount must be greater than zero',
}

// Consumer-friendly labels (use these in UI, never the technical terms)
export const LABELS = {
  vault:       'Vault',
  identity:    'Agent ID',
  ownerCap:    'Owner Key',
  policy:      'Spending Policy',
  skore:       'Trust Score',
  epoch:       'Day',
  dailyCap:    "Today's limit",
  dailySpent:  "Today's usage",
  isActive:    'Agent Status',
  isFrozen:    'Agent Frozen',
}
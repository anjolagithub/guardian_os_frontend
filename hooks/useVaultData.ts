'use client'
import { useSuiClient } from '@mysten/dapp-kit'
import { useEffect, useState, useCallback } from 'react'
import { toSUI, TIERS, PROTOCOLS, ACTIONS } from '@/lib/constants'

export interface VaultData {
  vaultId: string
  identityId: string
  balanceSUI: number
  dailySpentSUI: number
  dailyCapSUI: number
  isActive: boolean
  skore: number
  tier: string
  tierIndex: number
  isFrozen: boolean
  totalExecutions: number
  successfulExecutions: number
  owner: string
}

export interface ActionEvent {
  id: string
  timestampMs: number
  protocol: string
  action: string
  amountSUI: number
  status: 'success' | 'blocked'
  txDigest: string
}

export function useVaultData(walletAddress?: string) {
  const client = useSuiClient()

  const PACKAGE_ID = process.env.NEXT_PUBLIC_PACKAGE_ID ?? ''

  const [vault,   setVault]   = useState<VaultData | null>(null)
  const [events,  setEvents]  = useState<ActionEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    if (!PACKAGE_ID) { setError('Missing PACKAGE_ID'); setLoading(false); return }

    try {
      // ── Step 1: Find vault owned by this wallet ───────────────────────────
      // In production: query by wallet address
      // Fallback: use env var for demo/hackathon
      let vaultId   = process.env.NEXT_PUBLIC_VAULT_ID ?? ''
      let identityId = process.env.NEXT_PUBLIC_IDENTITY_ID ?? ''

      if (walletAddress) {
        // Production path — find vault from wallet
        const ownedVaults = await client.getOwnedObjects({
          owner: walletAddress,
          filter: { StructType: `${PACKAGE_ID}::execution_vault::ExecutionVault` },
          options: { showContent: true },
        })

        const ownedIdentities = await client.getOwnedObjects({
          owner: walletAddress,
          filter: { StructType: `${PACKAGE_ID}::guardian_identity::AgentIdentity` },
          options: { showContent: true },
        })

        if (ownedVaults.data.length > 0) {
          vaultId = ownedVaults.data[0].data?.objectId ?? vaultId
        }
        if (ownedIdentities.data.length > 0) {
          identityId = ownedIdentities.data[0].data?.objectId ?? identityId
        }
      }

      if (!vaultId || !identityId) {
        setError('No vault found for this wallet')
        setLoading(false)
        return
      }

      // ── Step 2: Fetch vault + identity objects ─────────────────────────────
      const [vaultObj, identityObj] = await Promise.all([
        client.getObject({ id: vaultId,    options: { showContent: true } }),
        client.getObject({ id: identityId, options: { showContent: true } }),
      ])

      const vf = (vaultObj.data?.content as any)?.fields
      const id = (identityObj.data?.content as any)?.fields

      if (vf && id) {
        const policyFields = vf?.policy?.fields ?? {}
        const tierIdx = Number(id.tier ?? 1)

        setVault({
          vaultId,
          identityId,
          balanceSUI:           toSUI(vf.balance ?? 0),
          dailySpentSUI:        toSUI(vf.daily_spent_mist ?? 0),
          dailyCapSUI:          toSUI(policyFields.daily_cap_mist ?? 50_000_000_000),
          isActive:             Boolean(vf.is_active),
          skore:                Number(id.skore ?? 500),
          tier:                 TIERS[tierIdx] ?? 'Silver',
          tierIndex:            tierIdx,
          isFrozen:             Boolean(id.is_frozen),
          totalExecutions:      Number(id.total_executions ?? 0),
          successfulExecutions: Number(id.successful_executions ?? 0),
          owner:                vf.owner ?? '',
        })
      }

      // ── Step 3: Fetch events for this vault ────────────────────────────────
      const [spendEvents, blockedEvents] = await Promise.all([
        client.queryEvents({
          query: { MoveEventType: `${PACKAGE_ID}::execution_vault::SpendExecuted` },
          limit: 20, order: 'descending',
        }),
        client.queryEvents({
          query: { MoveEventType: `${PACKAGE_ID}::execution_vault::PolicyViolationBlocked` },
          limit: 10, order: 'descending',
        }),
      ])

      const spendMapped: ActionEvent[] = spendEvents.data.map(e => ({
        id:          e.id.txDigest + e.id.eventSeq,
        timestampMs: Number(e.timestampMs ?? 0),
        protocol:    PROTOCOLS[(e.parsedJson as any)?.protocol] ?? 'Unknown',
        action:      ACTIONS[(e.parsedJson as any)?.action_type] ?? 'Unknown',
        amountSUI:   toSUI((e.parsedJson as any)?.amount_mist ?? 0),
        status:      'success',
        txDigest:    e.id.txDigest,
      }))

      const blockedMapped: ActionEvent[] = blockedEvents.data.map(e => ({
        id:          e.id.txDigest + e.id.eventSeq,
        timestampMs: Number(e.timestampMs ?? 0),
        protocol:    PROTOCOLS[(e.parsedJson as any)?.protocol] ?? 'Unknown',
        action:      ACTIONS[(e.parsedJson as any)?.attempted_action] ?? 'Unknown',
        amountSUI:   toSUI((e.parsedJson as any)?.attempted_amount_mist ?? 0),
        status:      'blocked',
        txDigest:    e.id.txDigest,
      }))

      setEvents([...spendMapped, ...blockedMapped]
        .sort((a, b) => b.timestampMs - a.timestampMs)
        .slice(0, 20))

      setError(null)
    } catch (err: any) {
      console.error('useVaultData:', err)
      setError(err.message ?? 'Failed to fetch')
    } finally {
      setLoading(false)
    }
  }, [client, walletAddress, PACKAGE_ID])

  useEffect(() => {
    fetchData()
    const interval = setInterval(fetchData, 10_000)
    return () => clearInterval(interval)
  }, [fetchData])

  return { vault, events, loading, error, refresh: fetchData }
}
'use client'
import { useSuiClient } from '@mysten/dapp-kit'
import { useEffect, useState, useCallback } from 'react'
import { toSUI, TIERS, PROTOCOLS, ACTIONS } from '@/lib/constants'

export interface VaultData {
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
  walrusBlobId?: string
}

export function useVaultData() {
  const client = useSuiClient()

  const PACKAGE_ID  = process.env.NEXT_PUBLIC_PACKAGE_ID  ?? ''
  const VAULT_ID    = process.env.NEXT_PUBLIC_VAULT_ID    ?? ''
  const IDENTITY_ID = process.env.NEXT_PUBLIC_IDENTITY_ID ?? ''

  const [vault,   setVault]   = useState<VaultData | null>(null)
  const [events,  setEvents]  = useState<ActionEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    if (!VAULT_ID || !IDENTITY_ID || !PACKAGE_ID) {
      setError('Missing environment variables')
      setLoading(false)
      return
    }

    try {
      // ── Vault object ──────────────────────────────────────────────────────────
      const [vaultObj, identityObj] = await Promise.all([
        client.getObject({ id: VAULT_ID,    options: { showContent: true } }),
        client.getObject({ id: IDENTITY_ID, options: { showContent: true } }),
      ])

      const vf = (vaultObj.data?.content as any)?.fields
      const id = (identityObj.data?.content as any)?.fields

      if (vf && id) {
        const policyFields = vf?.policy?.fields ?? {}
        const tierIdx = Number(id.tier ?? 1)

        setVault({
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

      // ── Events ────────────────────────────────────────────────────────────────
      const [spendEvents, blockedEvents] = await Promise.all([
        client.queryEvents({
          query: { MoveEventType: `${PACKAGE_ID}::execution_vault::SpendExecuted` },
          limit: 20,
          order: 'descending',
        }),
        client.queryEvents({
          query: { MoveEventType: `${PACKAGE_ID}::execution_vault::PolicyViolationBlocked` },
          limit: 10,
          order: 'descending',
        }),
      ])

      const spendMapped: ActionEvent[] = spendEvents.data.map(e => ({
        id:          e.id.txDigest + e.id.eventSeq,
        timestampMs: Number(e.timestampMs ?? 0),
        protocol:    PROTOCOLS[e.parsedJson?.protocol as number] ?? 'Unknown',
        action:      ACTIONS[e.parsedJson?.action_type as number] ?? 'Unknown',
        amountSUI:   toSUI(e.parsedJson?.amount_mist ?? 0),
        status:      'success',
        txDigest:    e.id.txDigest,
      }))

      const blockedMapped: ActionEvent[] = blockedEvents.data.map(e => ({
        id:          e.id.txDigest + e.id.eventSeq,
        timestampMs: Number(e.timestampMs ?? 0),
        protocol:    PROTOCOLS[e.parsedJson?.protocol as number] ?? 'Unknown',
        action:      ACTIONS[e.parsedJson?.attempted_action as number] ?? 'Unknown',
        amountSUI:   toSUI(e.parsedJson?.attempted_amount_mist ?? 0),
        status:      'blocked',
        txDigest:    e.id.txDigest,
      }))

      const all = [...spendMapped, ...blockedMapped]
        .sort((a, b) => b.timestampMs - a.timestampMs)
        .slice(0, 20)

      setEvents(all)
      setError(null)
    } catch (err: any) {
      console.error('useVaultData error:', err)
      setError(err.message ?? 'Failed to fetch data')
    } finally {
      setLoading(false)
    }
  }, [client, VAULT_ID, IDENTITY_ID, PACKAGE_ID])

  useEffect(() => {
    fetchData()
    const interval = setInterval(fetchData, 10_000) // refresh every 10s
    return () => clearInterval(interval)
  }, [fetchData])

  return { vault, events, loading, error, refresh: fetchData }
}
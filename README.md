# GuardianOS — Frontend

The dashboard and deploy interface for GuardianOS — trust enforcement infrastructure for autonomous AI agents on Sui.

**Live:** https://guardian-os-frontend.vercel.app

## What this is

A Next.js 14 app that lets users:
- Deploy their own GuardianOS vault (5-step wizard)
- Monitor their vault in real time (balance, Trust Score, action feed)
- Inspect the AI reasoning trail stored on Walrus
- Trigger emergency stop to reclaim funds instantly

## Running locally

```bash
npm install
cp .env.example .env.local
# Fill in env vars (see below)
npm run dev
```

Open http://localhost:3000

## Environment variables

```env
NEXT_PUBLIC_PACKAGE_ID=0xd89bcaeaab49e51b21baaaee43924081e2ee899da7ce1fdbdb6ff0b7a8ee8c1f
NEXT_PUBLIC_VAULT_ID=0x4934ac1e7bca251b1df17e6fd72d2690795f0d95deb775a139934aaa5b6d2cee
NEXT_PUBLIC_IDENTITY_ID=0x3a0fbf7d0f815c51e51d9e2a226102963d6e247e64c6f5680211c0723a46419c
NEXT_PUBLIC_OWNER_CAP_ID=0x...
```

These are the demo vault IDs. When a user connects their own wallet and deploys their own vault, the dashboard automatically switches to show their vault.

## Tech stack

- Next.js 14 App Router
- Tailwind CSS
- @mysten/dapp-kit (Sui wallet connection)
- @mysten/sui (chain reads)
- @tanstack/react-query

## Pages

- `/` — Landing page
- `/deploy` — 5-step vault creation wizard
- `/dashboard` — Live vault monitor
- `/dashboard/audit` — Walrus audit trail


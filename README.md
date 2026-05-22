# IOU — Split Expenses, Not Friendships 💸

A full-featured expense splitting app built with Next.js, Supabase, and Tailwind CSS.

## Features

- **Google OAuth Authentication** via Supabase Auth
- **Group Management** — Create groups for trips, roommates, dining clubs, etc.
- **Expense Tracking** — Log expenses with categories, dates, and flexible split modes
- **Smart Settle Up Optimizer** — Greedy algorithm minimizes the number of transactions needed
- **Real-time Balances** — Net balance calculations per user per group
- **Settlement Recording** — Mark payments as settled
- **Activity Feed** — Timeline of all group actions
- **Invite System** — Share invite links (7-day expiry)
- **Beautiful UI** — Glass morphism, smooth animations, fully responsive

## Tech Stack

- **Frontend**: Next.js 16 (App Router), Tailwind CSS, TypeScript
- **Backend**: Next.js API Routes (serverless)
- **Database**: Supabase (PostgreSQL) with Row-Level Security
- **Auth**: Supabase Auth with Google OAuth
- **Deployment**: Vercel

## Database Schema

| Table | Purpose |
|-------|---------|
| `profiles` | User profiles (synced from auth.users) |
| `groups` | Expense groups |
| `group_members` | Many-to-many: users ↔ groups |
| `expenses` | Individual expenses with payer |
| `splits` | How each expense is split per user |
| `settlements` | Recorded payments between users |
| `activity_feed` | Audit log of group actions |
| `group_invites` | Shareable invite tokens |

## The Settle Up Algorithm

1. Calculate **net balance** for every user (Total Paid − Total Owed − Settlements)
2. Split into **debtors** (negative balance) and **creditors** (positive balance)
3. Sort both by largest amount
4. Greedily match largest debtor → largest creditor
5. Repeat until all balances are $0

This minimizes the number of transactions needed to settle all debts.

## Setup Instructions

### 1. Clone and Install

```bash
git clone https://github.com/etollaw/evenSteven
cd evenSteven
npm install
cp .env.example .env.local
```

### 2. Configure Supabase

The Supabase project is already created at `https://yrtukvmvpopbtxrchtdc.supabase.co`.

Update `.env.local` with your Supabase credentials.

### 3. Configure Google OAuth

1. Go to [Supabase Auth Providers](https://supabase.com/dashboard/project/yrtukvmvpopbtxrchtdc/auth/providers)
2. Enable **Google** provider
3. Create OAuth credentials in [Google Cloud Console](https://console.cloud.google.com)
4. Set the authorized redirect URI to: `https://yrtukvmvpopbtxrchtdc.supabase.co/auth/v1/callback`
5. Add your Client ID and Secret to Supabase

### 4. Configure Auth URLs

In [Supabase Auth Settings](https://supabase.com/dashboard/project/yrtukvmvpopbtxrchtdc/auth/url-configuration):

- **Site URL**: `http://localhost:3000` (dev) or your Vercel URL (prod)
- **Redirect URLs**: Add `http://localhost:3000/**` and `https://your-app.vercel.app/**`

### 5. Deploy to Vercel

Connect this GitHub repository to Vercel and set these environment variables:

| Variable | Value |
|----------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://yrtukvmvpopbtxrchtdc.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your Supabase anon key |
| `NEXT_PUBLIC_SITE_URL` | Your Vercel deployment URL |

### 6. Run Locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   ├── auth/callback/     # OAuth callback
│   ├── dashboard/         # Dashboard page
│   ├── groups/[id]/       # Group detail page
│   └── invite/[token]/    # Invite acceptance
├── components/
│   ├── activity/          # Activity feed
│   ├── auth/              # Login page
│   ├── dashboard/         # Dashboard
│   ├── expenses/          # Expense CRUD
│   ├── groups/            # Group management
│   ├── landing/           # Landing page
│   ├── settle/            # Settle up optimizer
│   └── ui/                # Shared UI components
├── lib/
│   ├── supabase/          # Supabase clients
│   ├── types/             # TypeScript types
│   └── utils/             # Utilities + optimizer
└── proxy.ts               # Auth middleware
```

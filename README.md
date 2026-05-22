# evenSteven

A delightfully simple IOU tracker — a Splitwise-style app for your friend group.
Create a group, log expenses, and use the **Settle-Up Optimizer** to clear
everyone's debts in the **fewest possible payments**.

## Highlights

- Next.js 16 App Router + React 19 + TypeScript
- Supabase Postgres + Auth (Google OAuth and email magic link)
- Tailwind CSS v4 with a polished light/dark UI
- Row-level security on every table so each user only ever sees their own groups
- Equal / exact / percentage / shares split modes with **exact-cent rounding**
- Min-cash-flow greedy optimizer (zero external deps)
- Group invite links, settlement history, per-expense comments, CSV export
- Mobile-first responsive layout, hydration-safe dark mode, accessible primitives

## Tech stack

- **Frontend:** Next.js (App Router, RSC), Tailwind CSS v4, lucide-react icons, sonner toasts
- **Backend:** Supabase Postgres with `@supabase/ssr` cookie-based auth
- **Auth:** Email magic-link and Google OAuth (configurable in Supabase dashboard)
- **Deployment:** Vercel (zero-config)

## Local development

```bash
npm install
cp .env.example .env.local   # then fill in your Supabase URL + anon key
npm run dev
```

Open <http://localhost:3000>.

### Environment variables

| Name | Purpose |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Anon/publishable Supabase key |

On Vercel, set both in **Project Settings → Environment Variables** for the
Production / Preview / Development environments.

## Database schema

See `supabase/` migrations applied via the Supabase MCP. The schema models:

- `profiles` (linked 1:1 with `auth.users`, auto-populated by trigger)
- `groups` + `group_members` (role: `owner` / `member`)
- `expenses` + `expense_splits` (split_type: `equal | exact | percentage | shares`)
- `settlements` (record "X paid Y back $Z")
- `expense_comments`
- `group_invites` (shareable join code with optional TTL / max uses)

All tables have RLS enabled. Membership checks live in `SECURITY DEFINER` helper
functions to avoid recursive policy evaluation. The `accept_group_invite` RPC
verifies code validity and inserts the caller into the group atomically.

## How the optimizer works

`src/lib/optimizer.ts`:

1. Compute each user's **net balance** in integer cents (paid − owed +/-
   settlements).
2. Partition into `creditors` (positive) and `debtors` (negative); sort by
   magnitude descending.
3. Pair the largest creditor with the largest debtor, transfer `min(|both|)`,
   recurse until everything zeroes out.

This is optimal under most realistic balance distributions and produces at most
`N - 1` transactions for `N` people involved.

## Project layout

```
src/
  app/
    (app)/                      # auth-gated routes
      dashboard/                # overview of all groups
      groups/new/               # create a group
      groups/[id]/              # group detail (activity, balances, suggested payments)
      groups/[id]/expenses/     # add / view / edit expenses
      groups/[id]/settle/       # settle-up optimizer + manual settlements
      groups/[id]/settings/     # rename, invite links, member management
      join/                     # paste an invite code
    api/groups/[id]/export/     # CSV export endpoint
    auth/callback/              # OAuth/magic-link code exchange
    auth/signout/               # POST endpoint to clear session
    login/                      # OAuth + magic-link UI
  components/                   # UI primitives + shared widgets
  lib/
    supabase/                   # browser / server / middleware clients
    optimizer.ts                # net-balance + min-cash-flow + split modes
    utils.ts                    # formatters, cn(), color hashing, etc.
    group-data.ts               # server-side bundle loader for a group
  middleware.ts                 # session refresh + auth gating
```

## Deploy to Vercel

```bash
vercel link            # one-time
vercel env add NEXT_PUBLIC_SUPABASE_URL
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
vercel --prod
```

Then in Supabase **Auth → URL Configuration**:

- **Site URL:** `https://your-app.vercel.app`
- **Additional Redirect URLs:** `https://your-app.vercel.app/auth/callback`
  (and `http://localhost:3000/auth/callback` for local dev).

## License

MIT.

# EvenSteven

EvenSteven is a polished IOU tab tracker for friend groups. It is built with Next.js App Router, Tailwind CSS, and
Supabase Auth/Postgres.

## Features

- Google OAuth sign-in through Supabase
- Groups with member management
- Equal and custom expense splits
- Net-balance calculations for every group member
- Settle-up optimizer that minimizes the number of payments
- Recorded settlement payments that update balances
- Mobile-first glassmorphism UI ready for Vercel

## Local setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Copy environment variables:

   ```bash
   cp .env.example .env.local
   ```

3. Fill in `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`.

4. Apply the migration in `supabase/migrations/20260522224500_initial_iou_schema.sql` to your Supabase project.

5. Enable Google as an auth provider in Supabase and add this redirect URL:

   ```text
   http://localhost:3000/auth/callback
   ```

6. Start the app:

   ```bash
   npm run dev
   ```

For Vercel, set the same Supabase environment variables and add your deployed `/auth/callback` URL to Supabase Auth.

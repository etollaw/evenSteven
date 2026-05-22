create extension if not exists pgcrypto;

create table if not exists public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null,
  email text not null unique,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.groups (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  currency text not null default 'USD',
  created_by uuid not null references public.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz
);

create table if not exists public.group_members (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.groups(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  role text not null default 'member' check (role in ('owner', 'member')),
  joined_at timestamptz not null default now(),
  unique (group_id, user_id)
);

create table if not exists public.expenses (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.groups(id) on delete cascade,
  payer_id uuid not null references public.users(id) on delete restrict,
  amount numeric(12, 2) not null check (amount > 0),
  description text not null,
  category text not null default 'General',
  split_method text not null default 'equal' check (split_method in ('equal', 'custom')),
  paid_at date not null default current_date,
  created_by uuid not null references public.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.splits (
  id uuid primary key default gen_random_uuid(),
  expense_id uuid not null references public.expenses(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  amount_owed numeric(12, 2) not null check (amount_owed >= 0),
  created_at timestamptz not null default now(),
  unique (expense_id, user_id)
);

create table if not exists public.settlements (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.groups(id) on delete cascade,
  payer_id uuid not null references public.users(id) on delete restrict,
  receiver_id uuid not null references public.users(id) on delete restrict,
  amount numeric(12, 2) not null check (amount > 0),
  note text,
  settled_at timestamptz not null default now(),
  created_by uuid not null references public.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  check (payer_id <> receiver_id)
);

create index if not exists idx_group_members_user_id on public.group_members(user_id);
create index if not exists idx_expenses_group_id on public.expenses(group_id);
create index if not exists idx_expenses_payer_id on public.expenses(payer_id);
create index if not exists idx_splits_user_id on public.splits(user_id);
create index if not exists idx_settlements_group_id on public.settlements(group_id);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists users_set_updated_at on public.users;
create trigger users_set_updated_at
before update on public.users
for each row execute function public.set_updated_at();

drop trigger if exists groups_set_updated_at on public.groups;
create trigger groups_set_updated_at
before update on public.groups
for each row execute function public.set_updated_at();

drop trigger if exists expenses_set_updated_at on public.expenses;
create trigger expenses_set_updated_at
before update on public.expenses
for each row execute function public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.users (id, name, email, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    new.email,
    new.raw_user_meta_data->>'avatar_url'
  )
  on conflict (id) do update
    set name = excluded.name,
        email = excluded.email,
        avatar_url = excluded.avatar_url;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

create or replace function public.is_group_member(target_group_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1
    from public.group_members
    where group_id = target_group_id
      and user_id = auth.uid()
  );
$$;

alter table public.users enable row level security;
alter table public.groups enable row level security;
alter table public.group_members enable row level security;
alter table public.expenses enable row level security;
alter table public.splits enable row level security;
alter table public.settlements enable row level security;

drop policy if exists "Users can view signed-in users" on public.users;
create policy "Users can view signed-in users"
on public.users for select
to authenticated
using (true);

drop policy if exists "Users can update themselves" on public.users;
create policy "Users can update themselves"
on public.users for update
to authenticated
using (id = auth.uid())
with check (id = auth.uid());

drop policy if exists "Users can insert themselves" on public.users;
create policy "Users can insert themselves"
on public.users for insert
to authenticated
with check (id = auth.uid());

drop policy if exists "Members can view groups" on public.groups;
create policy "Members can view groups"
on public.groups for select
to authenticated
using (public.is_group_member(id));

drop policy if exists "Authenticated users can create groups" on public.groups;
create policy "Authenticated users can create groups"
on public.groups for insert
to authenticated
with check (created_by = auth.uid());

drop policy if exists "Members can update groups" on public.groups;
create policy "Members can update groups"
on public.groups for update
to authenticated
using (public.is_group_member(id))
with check (public.is_group_member(id));

drop policy if exists "Members can view memberships" on public.group_members;
create policy "Members can view memberships"
on public.group_members for select
to authenticated
using (public.is_group_member(group_id));

drop policy if exists "Users can create own membership" on public.group_members;
create policy "Users can create own membership"
on public.group_members for insert
to authenticated
with check (user_id = auth.uid() or public.is_group_member(group_id));

drop policy if exists "Members can remove memberships" on public.group_members;
create policy "Members can remove memberships"
on public.group_members for delete
to authenticated
using (public.is_group_member(group_id));

drop policy if exists "Members can view expenses" on public.expenses;
create policy "Members can view expenses"
on public.expenses for select
to authenticated
using (public.is_group_member(group_id));

drop policy if exists "Members can create expenses" on public.expenses;
create policy "Members can create expenses"
on public.expenses for insert
to authenticated
with check (created_by = auth.uid() and public.is_group_member(group_id));

drop policy if exists "Members can update expenses" on public.expenses;
create policy "Members can update expenses"
on public.expenses for update
to authenticated
using (public.is_group_member(group_id))
with check (public.is_group_member(group_id));

drop policy if exists "Members can delete expenses" on public.expenses;
create policy "Members can delete expenses"
on public.expenses for delete
to authenticated
using (public.is_group_member(group_id));

drop policy if exists "Members can view splits" on public.splits;
create policy "Members can view splits"
on public.splits for select
to authenticated
using (
  exists (
    select 1
    from public.expenses e
    where e.id = splits.expense_id
      and public.is_group_member(e.group_id)
  )
);

drop policy if exists "Members can create splits" on public.splits;
create policy "Members can create splits"
on public.splits for insert
to authenticated
with check (
  exists (
    select 1
    from public.expenses e
    where e.id = splits.expense_id
      and public.is_group_member(e.group_id)
  )
);

drop policy if exists "Members can delete splits" on public.splits;
create policy "Members can delete splits"
on public.splits for delete
to authenticated
using (
  exists (
    select 1
    from public.expenses e
    where e.id = splits.expense_id
      and public.is_group_member(e.group_id)
  )
);

drop policy if exists "Members can view settlements" on public.settlements;
create policy "Members can view settlements"
on public.settlements for select
to authenticated
using (public.is_group_member(group_id));

drop policy if exists "Members can create settlements" on public.settlements;
create policy "Members can create settlements"
on public.settlements for insert
to authenticated
with check (created_by = auth.uid() and public.is_group_member(group_id));

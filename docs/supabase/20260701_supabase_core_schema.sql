-- ==========================================
-- Tranquillo Green — Supabase core schema
-- ==========================================

-- 1. profiles
create table if not exists public.profiles (
  id uuid primary key default gen_random_uuid(),
  clerk_user_id text unique not null,
  email text not null,
  operator_type text not null,
  company_name text not null,
  state text not null,
  license_number text,
  is_cpa boolean not null default false,
  cpa_org_id text,
  stripe_customer_id text,
  subscription_status text not null default 'trial',
  trial_started_at timestamptz,
  trial_expires_at timestamptz,
  mfa_enabled boolean not null default false,
  onboarding_complete boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 2. subscriptions
create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  stripe_subscription_id text unique not null,
  stripe_price_id text not null,
  plan_tier text not null,
  status text not null,
  current_period_start timestamptz,
  current_period_end timestamptz,
  trial_end timestamptz,
  created_at timestamptz not null default now()
);

-- 3. cpa_client_links
create table if not exists public.cpa_client_links (
  id uuid primary key default gen_random_uuid(),
  cpa_user_id uuid not null references public.profiles(id) on delete cascade,
  client_user_id uuid not null references public.profiles(id) on delete cascade,
  clerk_org_id text not null,
  linked_at timestamptz not null default now(),
  unique (cpa_user_id, client_user_id)
);

-- Row Level Security
alter table public.profiles enable row level security;
alter table public.subscriptions enable row level security;
alter table public.cpa_client_links enable row level security;

-- profiles policies
create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid()::text = clerk_user_id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid()::text = clerk_user_id);

create policy "Users can insert own profile"
  on public.profiles for insert
  with check (auth.uid()::text = clerk_user_id);

create policy "CPAs can view linked clients"
  on public.profiles for select
  using (
    exists (
      select 1 from public.cpa_client_links
      where cpa_client_links.cpa_user_id = profiles.id
    )
  );

-- subscriptions policies
create policy "Users can view own subscriptions"
  on public.subscriptions for select
  using (
    user_id in (
      select id from public.profiles
      where clerk_user_id = auth.uid()::text
    )
  );

create policy "Users can insert own subscriptions"
  on public.subscriptions for insert
  with check (
    user_id in (
      select id from public.profiles
      where clerk_user_id = auth.uid()::text
    )
  );

create policy "Users can update own subscriptions"
  on public.subscriptions for update
  using (
    user_id in (
      select id from public.profiles
      where clerk_user_id = auth.uid()::text
    )
  );

-- cpa_client_links policies
create policy "CPAs can view client links"
  on public.cpa_client_links for select
  using (
    cpa_user_id in (
      select id from public.profiles
      where clerk_user_id = auth.uid()::text
    )
    or client_user_id in (
      select id from public.profiles
      where clerk_user_id = auth.uid()::text
    )
  );

create policy "CPAs can insert client links"
  on public.cpa_client_links for insert
  with check (
    cpa_user_id in (
      select id from public.profiles
      where clerk_user_id = auth.uid()::text
    )
  );

create policy "CPAs can delete client links"
  on public.cpa_client_links for delete
  using (
    cpa_user_id in (
      select id from public.profiles
      where clerk_user_id = auth.uid()::text
    )
  );

-- helpful indexes
create index if not exists profiles_clerk_user_id_idx
  on public.profiles (clerk_user_id);

create index if not exists profiles_subscription_status_idx
  on public.profiles (subscription_status);

create index if not exists subscriptions_user_id_idx
  on public.subscriptions (user_id);

create index if not exists subscriptions_status_idx
  on public.subscriptions (status);

create index if not exists cpa_client_links_cpa_user_id_idx
  on public.cpa_client_links (cpa_user_id);

create index if not exists cpa_client_links_client_user_id_idx
  on public.cpa_client_links (client_user_id);

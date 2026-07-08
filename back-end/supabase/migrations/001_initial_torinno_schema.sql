create extension if not exists "pgcrypto";

create table if not exists public.teams (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  logo_url text,
  description text,
  created_at timestamptz not null default now()
);

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null,
  email text,
  role text not null default 'player' check (role in ('player', 'admin')),
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.player_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  team_id uuid references public.teams(id) on delete set null,
  full_name text not null,
  nickname text not null,
  position text not null,
  shirt_number int not null check (shirt_number >= 0 and shirt_number <= 999),
  dominant_foot text,
  bio text,
  status text not null default 'Ativo' check (status in ('Ativo', 'Contratado', 'Lesionado', 'Suspenso', 'Reserva')),
  instagram text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id)
);

create table if not exists public.player_stats (
  id uuid primary key default gen_random_uuid(),
  player_id uuid not null references public.player_profiles(id) on delete cascade,
  goals int not null default 0,
  assists int not null default 0,
  ball_recoveries int not null default 0,
  shots int not null default 0,
  accurate_passes int not null default 0,
  matches int not null default 0,
  wins int not null default 0,
  losses int not null default 0,
  yellow_cards int not null default 0,
  red_cards int not null default 0,
  average_rating numeric(3,1) not null default 0,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (player_id)
);

create table if not exists public.championships (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  type text not null default 'Liga',
  start_date date,
  end_date date,
  status text not null default 'Preparacao' check (status in ('Preparacao', 'Em andamento', 'Encerrado')),
  created_at timestamptz not null default now()
);

create table if not exists public.matches (
  id uuid primary key default gen_random_uuid(),
  home_team text not null,
  away_team text not null,
  match_date date not null,
  match_time time,
  location text,
  championship_id uuid references public.championships(id) on delete set null,
  status text not null default 'Agendada' check (status in ('Agendada', 'Em andamento', 'Encerrada')),
  home_score int,
  away_score int,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.teams enable row level security;
alter table public.profiles enable row level security;
alter table public.player_profiles enable row level security;
alter table public.player_stats enable row level security;
alter table public.championships enable row level security;
alter table public.matches enable row level security;

create or replace function public.is_admin()
returns boolean
language sql
stable
security invoker
as $$
  select exists (
    select 1
    from public.profiles
    where id = (select auth.uid())
      and role = 'admin'
  );
$$;

create policy "Authenticated users can view teams"
on public.teams for select
to authenticated
using (true);

create policy "Admins manage teams"
on public.teams for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "Users view own profile"
on public.profiles for select
to authenticated
using ((select auth.uid()) = id or public.is_admin());

create policy "Users update own profile"
on public.profiles for update
to authenticated
using ((select auth.uid()) = id)
with check ((select auth.uid()) = id);

create policy "Players are visible to authenticated users"
on public.player_profiles for select
to authenticated
using (true);

create policy "Users manage own player profile"
on public.player_profiles for all
to authenticated
using ((select auth.uid()) = user_id or public.is_admin())
with check ((select auth.uid()) = user_id or public.is_admin());

create policy "Stats are visible to authenticated users"
on public.player_stats for select
to authenticated
using (true);

create policy "Users manage own stats"
on public.player_stats for all
to authenticated
using (
  public.is_admin()
  or exists (
    select 1 from public.player_profiles
    where player_profiles.id = player_stats.player_id
      and player_profiles.user_id = (select auth.uid())
  )
)
with check (
  public.is_admin()
  or exists (
    select 1 from public.player_profiles
    where player_profiles.id = player_stats.player_id
      and player_profiles.user_id = (select auth.uid())
  )
);

create policy "Authenticated users can view championships"
on public.championships for select
to authenticated
using (true);

create policy "Admins manage championships"
on public.championships for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "Authenticated users can view matches"
on public.matches for select
to authenticated
using (true);

create policy "Admins manage matches"
on public.matches for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

insert into public.teams (name, logo_url, description)
values ('TorinnoFC', '/assets/logo-torrino.png', 'Plataforma oficial do TorinnoFC.')
on conflict do nothing;

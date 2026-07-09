alter table public.matches
add column if not exists observations text;

create table if not exists public.tryouts (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  tryout_date date not null,
  tryout_time time,
  location text,
  category text not null default 'Geral',
  requirements text,
  observations text,
  status text not null default 'Agendada' check (status in ('Agendada', 'Confirmada', 'Encerrada', 'Cancelada')),
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.notification_logs (
  id uuid primary key default gen_random_uuid(),
  event_type text not null,
  entity_id uuid not null,
  channel text not null default 'whatsapp',
  destination text not null,
  status text not null default 'pending' check (status in ('pending', 'sent', 'failed', 'skipped')),
  message_body text not null,
  api_response jsonb,
  error_message text,
  sent_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (event_type, entity_id, channel, destination)
);

create index if not exists notification_logs_lookup_idx
on public.notification_logs (event_type, entity_id, channel, destination);

create index if not exists notification_logs_status_idx
on public.notification_logs (status, created_at);

alter table public.tryouts enable row level security;
alter table public.notification_logs enable row level security;

grant select on public.matches to authenticated;
grant select, insert, update, delete on public.matches to service_role;

grant select on public.tryouts to authenticated;
grant insert, update, delete on public.tryouts to authenticated;
grant select, insert, update, delete on public.tryouts to service_role;

grant select on public.notification_logs to authenticated;
grant insert, update, delete on public.notification_logs to authenticated;
grant select, insert, update, delete on public.notification_logs to service_role;

create policy "Authenticated users can view tryouts"
on public.tryouts for select
to authenticated
using (true);

create policy "Admins manage tryouts"
on public.tryouts for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "Admins view notification logs"
on public.notification_logs for select
to authenticated
using (public.is_admin());

create policy "Admins manage notification logs"
on public.notification_logs for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

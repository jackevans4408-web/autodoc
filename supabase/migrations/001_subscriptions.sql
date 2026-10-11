-- Subscriptions and usage metering for Engine Eye.
-- Run once in the Supabase SQL editor. The backend reaches these tables with the service-role key
-- (SUPABASE_SERVICE_KEY). Row level security is on with no policies, so the app's anon/user keys cannot read or write them.

create table if not exists public.subscriptions (
  user_id       uuid primary key references auth.users(id) on delete cascade,
  tier          text not null default 'free' check (tier in ('free', 'plus', 'unlimited')),
  expires_at    timestamptz,
  last_event_ms bigint not null default 0,
  last_event_id text,
  updated_at    timestamptz not null default now()
);

create table if not exists public.usage_events (
  id         bigint generated always as identity primary key,
  user_id    uuid not null references auth.users(id) on delete cascade,
  kind       text not null check (kind in ('diagnosis', 'followup', 'quote')),
  created_at timestamptz not null default now()
);

create index if not exists usage_events_user_kind_created
  on public.usage_events (user_id, kind, created_at desc);

alter table public.subscriptions enable row level security;
alter table public.usage_events  enable row level security;

-- Atomically check the rolling-window allowance and record one use.
-- p_limit null means unlimited. The advisory lock stops parallel requests from both passing the check.
create or replace function public.consume_usage(p_user uuid, p_kind text, p_limit int, p_window_hours int default 24)
returns table (allowed boolean, event_id bigint, used int)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_used int;
  v_id   bigint;
begin
  perform pg_advisory_xact_lock(hashtextextended(p_user::text || ':' || p_kind, 0));

  select count(*) into v_used
  from usage_events
  where user_id = p_user and kind = p_kind
    and created_at > now() - make_interval(hours => p_window_hours);

  if p_limit is not null and v_used >= p_limit then
    return query select false, null::bigint, v_used;
    return;
  end if;

  insert into usage_events (user_id, kind) values (p_user, p_kind) returning id into v_id;
  return query select true, v_id, v_used + 1;
end;
$$;

-- Give a use back when the request failed before an answer was produced.
create or replace function public.release_usage(p_event bigint)
returns void
language sql
security definer
set search_path = public
as $$
  delete from usage_events where id = p_event;
$$;

-- Apply a RevenueCat event unless a newer one has already been applied (webhooks can arrive out of order or twice).
create or replace function public.apply_subscription_event(
  p_user uuid, p_tier text, p_expires_at timestamptz, p_event_ms bigint, p_event_id text
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_rows int;
begin
  insert into subscriptions (user_id, tier, expires_at, last_event_ms, last_event_id, updated_at)
  values (p_user, p_tier, p_expires_at, p_event_ms, p_event_id, now())
  on conflict (user_id) do update
    set tier = excluded.tier,
        expires_at = excluded.expires_at,
        last_event_ms = excluded.last_event_ms,
        last_event_id = excluded.last_event_id,
        updated_at = now()
    where subscriptions.last_event_ms < excluded.last_event_ms;
  get diagnostics v_rows = row_count;
  return v_rows > 0;
end;
$$;

revoke all on function public.consume_usage(uuid, text, int, int) from public, anon, authenticated;
revoke all on function public.release_usage(bigint) from public, anon, authenticated;
revoke all on function public.apply_subscription_event(uuid, text, timestamptz, bigint, text) from public, anon, authenticated;
grant execute on function public.consume_usage(uuid, text, int, int) to service_role;
grant execute on function public.release_usage(bigint) to service_role;
grant execute on function public.apply_subscription_event(uuid, text, timestamptz, bigint, text) to service_role;

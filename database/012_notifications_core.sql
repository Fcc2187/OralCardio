-- =============================================================================
-- OralCardio — 012: preferências e inscrições Web Push
-- Depende de 011_remove_caregivers.sql.
-- =============================================================================

create type public.habit_notification_type as enum ('brushing', 'flossing');

create table public.notification_preferences (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.users (id) on delete cascade,
  enabled boolean not null default false,
  brushing_enabled boolean not null default false,
  flossing_enabled boolean not null default false,
  appointments_enabled boolean not null default false,
  appointment_lead_minutes int[] not null default array[1440, 120],
  quiet_hours_start time not null default time '22:00',
  quiet_hours_end time not null default time '07:00',
  consented_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint notification_preferences_leads_valid check (
    cardinality(appointment_lead_minutes) between 1 and 3
    and appointment_lead_minutes <@ array[15, 30, 60, 120, 360, 720, 1440, 2880, 10080]
  ),
  constraint notification_preferences_quiet_hours_distinct check (
    quiet_hours_start <> quiet_hours_end
  )
);

create table public.habit_notification_schedules (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  habit_type public.habit_notification_type not null,
  local_time time not null,
  target_ordinal smallint not null,
  enabled boolean not null default true,
  next_due_at timestamptz not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint habit_notification_schedules_ordinal_valid check (
    target_ordinal between 1 and 5
  ),
  constraint habit_notification_schedules_unique_ordinal unique (
    user_id, habit_type, target_ordinal
  ),
  constraint habit_notification_schedules_unique_time unique (
    user_id, habit_type, local_time
  )
);

create index habit_notification_schedules_due_idx
  on public.habit_notification_schedules (next_due_at)
  where enabled = true;

create table public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  endpoint text not null unique,
  p256dh text not null,
  auth_secret text not null,
  expiration_time timestamptz,
  device_label text,
  vapid_key_version smallint not null default 1,
  is_active boolean not null default true,
  last_seen_at timestamptz not null default now(),
  revoked_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint push_subscriptions_endpoint_length check (octet_length(endpoint) between 1 and 4096),
  constraint push_subscriptions_p256dh_length check (octet_length(p256dh) between 16 and 512),
  constraint push_subscriptions_auth_length check (octet_length(auth_secret) between 8 and 256),
  constraint push_subscriptions_device_label_length check (
    device_label is null or char_length(device_label) <= 80
  ),
  constraint push_subscriptions_vapid_version_valid check (vapid_key_version > 0)
);

create index push_subscriptions_active_user_idx
  on public.push_subscriptions (user_id)
  where is_active = true;

create trigger notification_preferences_set_updated_at
  before update on public.notification_preferences
  for each row execute function public.handle_updated_at();

create trigger habit_notification_schedules_set_updated_at
  before update on public.habit_notification_schedules
  for each row execute function public.handle_updated_at();

create trigger push_subscriptions_set_updated_at
  before update on public.push_subscriptions
  for each row execute function public.handle_updated_at();

create or replace function public.notification_next_occurrence(
  p_local_time time,
  p_after timestamptz default now()
)
returns timestamptz
language plpgsql
stable
set search_path = public
as $$
declare
  v_local_date date := (p_after at time zone 'America/Sao_Paulo')::date;
  v_candidate timestamptz;
begin
  v_candidate := (v_local_date + p_local_time) at time zone 'America/Sao_Paulo';
  if v_candidate <= p_after then
    v_candidate := ((v_local_date + 1) + p_local_time) at time zone 'America/Sao_Paulo';
  end if;
  return v_candidate;
end;
$$;

create or replace function public.notification_time_is_quiet(
  p_time time,
  p_quiet_start time,
  p_quiet_end time
)
returns boolean
language sql
immutable
set search_path = public
as $$
  select case
    when p_quiet_start < p_quiet_end
      then p_time >= p_quiet_start and p_time < p_quiet_end
    else p_time >= p_quiet_start or p_time < p_quiet_end
  end;
$$;

create or replace function public.create_default_notification_settings(p_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.notification_preferences (user_id)
  values (p_user_id)
  on conflict (user_id) do nothing;

  insert into public.habit_notification_schedules (
    user_id, habit_type, local_time, target_ordinal, next_due_at
  )
  values
    (p_user_id, 'brushing', time '08:00', 1, public.notification_next_occurrence(time '08:00')),
    (p_user_id, 'brushing', time '20:00', 2, public.notification_next_occurrence(time '20:00')),
    (p_user_id, 'flossing', time '21:00', 1, public.notification_next_occurrence(time '21:00'))
  on conflict do nothing;
end;
$$;

create or replace function public.handle_new_notification_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.create_default_notification_settings(new.id);
  return new;
end;
$$;

create trigger on_user_notification_settings_created
  after insert on public.users
  for each row execute function public.handle_new_notification_user();

do $$
declare
  v_user_id uuid;
begin
  for v_user_id in select id from public.users loop
    perform public.create_default_notification_settings(v_user_id);
  end loop;
end;
$$;

create or replace function public.update_notification_preferences(
  p_enabled boolean,
  p_brushing_enabled boolean,
  p_brushing_times time[],
  p_flossing_enabled boolean,
  p_flossing_time time,
  p_appointments_enabled boolean,
  p_appointment_lead_minutes int[],
  p_quiet_hours_start time,
  p_quiet_hours_end time
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_duplicate_count int;
begin
  if v_user_id is null then
    raise exception 'Usuário não autenticado';
  end if;

  if cardinality(p_brushing_times) not between 1 and 5 then
    raise exception 'Configure entre um e cinco lembretes de escovação';
  end if;

  select count(*) - count(distinct value)
    into v_duplicate_count
    from unnest(p_brushing_times) as value;
  if v_duplicate_count > 0 then
    raise exception 'Os horários de escovação não podem se repetir';
  end if;

  if cardinality(p_appointment_lead_minutes) not between 1 and 3
     or not p_appointment_lead_minutes
       <@ array[15, 30, 60, 120, 360, 720, 1440, 2880, 10080] then
    raise exception 'Antecedência de consulta inválida';
  end if;

  select count(*) - count(distinct value)
    into v_duplicate_count
    from unnest(p_appointment_lead_minutes) as value;
  if v_duplicate_count > 0 then
    raise exception 'As antecedências de consulta não podem se repetir';
  end if;

  if p_quiet_hours_start = p_quiet_hours_end then
    raise exception 'O início e o fim do horário silencioso devem ser diferentes';
  end if;

  if exists (
    select 1
      from unnest(p_brushing_times || array[p_flossing_time]) as reminder_time
     where public.notification_time_is_quiet(
       reminder_time, p_quiet_hours_start, p_quiet_hours_end
     )
  ) then
    raise exception 'Lembretes de hábitos não podem ficar dentro do horário silencioso';
  end if;

  perform public.create_default_notification_settings(v_user_id);

  update public.notification_preferences
     set enabled = p_enabled,
         brushing_enabled = p_brushing_enabled,
         flossing_enabled = p_flossing_enabled,
         appointments_enabled = p_appointments_enabled,
         appointment_lead_minutes = p_appointment_lead_minutes,
         quiet_hours_start = p_quiet_hours_start,
         quiet_hours_end = p_quiet_hours_end,
         consented_at = case
           when p_enabled then coalesce(consented_at, now())
           else consented_at
         end
   where user_id = v_user_id;

  delete from public.habit_notification_schedules where user_id = v_user_id;

  insert into public.habit_notification_schedules (
    user_id, habit_type, local_time, target_ordinal, next_due_at
  )
  select
    v_user_id,
    'brushing'::public.habit_notification_type,
    reminder_time,
    row_number() over (order by reminder_time)::smallint,
    public.notification_next_occurrence(reminder_time)
  from unnest(p_brushing_times) as reminder_time;

  insert into public.habit_notification_schedules (
    user_id, habit_type, local_time, target_ordinal, next_due_at
  ) values (
    v_user_id,
    'flossing',
    p_flossing_time,
    1,
    public.notification_next_occurrence(p_flossing_time)
  );
end;
$$;

create or replace function public.upsert_push_subscription(
  p_endpoint text,
  p_p256dh text,
  p_auth_secret text,
  p_expiration_time timestamptz,
  p_device_label text,
  p_vapid_key_version smallint default 1
)
returns table(subscription_id uuid, active boolean)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_subscription_id uuid;
begin
  if v_user_id is null then
    raise exception 'Usuário não autenticado';
  end if;
  if p_endpoint !~ '^https://' or octet_length(p_endpoint) > 4096 then
    raise exception 'Endpoint de notificação inválido';
  end if;
  if octet_length(p_p256dh) not between 16 and 512
     or octet_length(p_auth_secret) not between 8 and 256 then
    raise exception 'Chaves da inscrição de notificação inválidas';
  end if;
  if p_device_label is not null and char_length(p_device_label) > 80 then
    raise exception 'Identificação do dispositivo inválida';
  end if;

  insert into public.push_subscriptions (
    user_id, endpoint, p256dh, auth_secret, expiration_time,
    device_label, vapid_key_version, is_active, last_seen_at, revoked_at
  ) values (
    v_user_id, p_endpoint, p_p256dh, p_auth_secret, p_expiration_time,
    p_device_label, p_vapid_key_version, true, now(), null
  )
  on conflict (endpoint) do update
    set user_id = excluded.user_id,
        p256dh = excluded.p256dh,
        auth_secret = excluded.auth_secret,
        expiration_time = excluded.expiration_time,
        device_label = excluded.device_label,
        vapid_key_version = excluded.vapid_key_version,
        is_active = true,
        last_seen_at = now(),
        revoked_at = null
  returning id into v_subscription_id;

  return query select v_subscription_id, true;
end;
$$;

create or replace function public.unsubscribe_push_subscription(p_endpoint text)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_updated int;
begin
  if v_user_id is null then
    raise exception 'Usuário não autenticado';
  end if;

  update public.push_subscriptions
     set is_active = false,
         revoked_at = now()
   where user_id = v_user_id
     and endpoint = p_endpoint
     and is_active = true;
  get diagnostics v_updated = row_count;
  return v_updated > 0;
end;
$$;

alter table public.notification_preferences enable row level security;
alter table public.habit_notification_schedules enable row level security;
alter table public.push_subscriptions enable row level security;

create policy notification_preferences_all_own on public.notification_preferences
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy habit_notification_schedules_all_own on public.habit_notification_schedules
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Subscriptions contêm URLs de capacidade e chaves. Não existe política de
-- leitura direta; escrita e revogação passam apenas pelas RPCs acima.

revoke all on function public.create_default_notification_settings(uuid) from public;
revoke all on function public.handle_new_notification_user() from public;
revoke all on function public.update_notification_preferences(
  boolean, boolean, time[], boolean, time, boolean, int[], time, time
) from public;
revoke all on function public.upsert_push_subscription(
  text, text, text, timestamptz, text, smallint
) from public;
revoke all on function public.unsubscribe_push_subscription(text) from public;

grant execute on function public.update_notification_preferences(
  boolean, boolean, time[], boolean, time, boolean, int[], time, time
) to authenticated;
grant execute on function public.upsert_push_subscription(
  text, text, text, timestamptz, text, smallint
) to authenticated;
grant execute on function public.unsubscribe_push_subscription(text) to authenticated;


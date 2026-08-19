-- =============================================================================
-- OralCardio — 016: hardening de idempotência, gamificação e Web Push
-- Depende de 015_remove_appointment_reminder_flag.sql.
--
-- Esta migration não altera arquivos já aplicados e mantém temporariamente os
-- contratos antigos para permitir rollout sem indisponibilidade. Remova-os com
-- a migration 017 somente depois que todas as instâncias novas estiverem ativas.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Idempotência das mutações que criam recursos
-- -----------------------------------------------------------------------------

alter table public.brushing_sessions add column idempotency_key text;
alter table public.flossing_logs add column idempotency_key text;
alter table public.appointments add column idempotency_key text;

alter table public.brushing_sessions
  add constraint brushing_sessions_idempotency_key_length
  check (idempotency_key is null or char_length(idempotency_key) between 8 and 128);
alter table public.flossing_logs
  add constraint flossing_logs_idempotency_key_length
  check (idempotency_key is null or char_length(idempotency_key) between 8 and 128);
alter table public.appointments
  add constraint appointments_idempotency_key_length
  check (idempotency_key is null or char_length(idempotency_key) between 8 and 128);

create unique index brushing_sessions_user_idempotency_idx
  on public.brushing_sessions (user_id, idempotency_key);
create unique index flossing_logs_user_idempotency_idx
  on public.flossing_logs (user_id, idempotency_key);
create unique index appointments_user_idempotency_idx
  on public.appointments (user_id, idempotency_key);

create or replace function public.create_brushing_session(
  p_target_duration integer,
  p_idempotency_key text default null
)
returns setof public.brushing_sessions
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
begin
  if v_user_id is null then
    raise exception 'Usuário não autenticado';
  end if;
  if p_target_duration not between 1 and 3600 then
    raise exception 'Duração alvo inválida';
  end if;
  if p_idempotency_key is not null
     and (char_length(p_idempotency_key) not between 8 and 128
          or p_idempotency_key !~ '^[A-Za-z0-9._:-]+$') then
    raise exception 'Chave de idempotência inválida';
  end if;

  return query
  insert into public.brushing_sessions (
    user_id, target_duration, zones_completed, is_completed, idempotency_key
  ) values (
    v_user_id, p_target_duration, '{}', false, p_idempotency_key
  )
  on conflict (user_id, idempotency_key) do update
    set idempotency_key = excluded.idempotency_key
  returning public.brushing_sessions.*;
end;
$$;

create or replace function public.create_flossing_log(
  p_notes text,
  p_idempotency_key text default null
)
returns setof public.flossing_logs
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
begin
  if v_user_id is null then
    raise exception 'Usuário não autenticado';
  end if;
  if p_notes is not null and char_length(p_notes) > 500 then
    raise exception 'Observação muito longa';
  end if;
  if p_idempotency_key is not null
     and (char_length(p_idempotency_key) not between 8 and 128
          or p_idempotency_key !~ '^[A-Za-z0-9._:-]+$') then
    raise exception 'Chave de idempotência inválida';
  end if;

  return query
  insert into public.flossing_logs (user_id, notes, idempotency_key)
  values (v_user_id, p_notes, p_idempotency_key)
  on conflict (user_id, idempotency_key) do update
    set idempotency_key = excluded.idempotency_key
  returning public.flossing_logs.*;
end;
$$;

create or replace function public.create_appointment_idempotent(
  p_scheduled_at timestamptz,
  p_appointment_type public.appointment_type,
  p_dentist_name text,
  p_clinic_name text,
  p_clinic_address text,
  p_clinic_phone text,
  p_notes text,
  p_idempotency_key text default null
)
returns setof public.appointments
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
begin
  if v_user_id is null then
    raise exception 'Usuário não autenticado';
  end if;
  if p_idempotency_key is not null
     and (char_length(p_idempotency_key) not between 8 and 128
          or p_idempotency_key !~ '^[A-Za-z0-9._:-]+$') then
    raise exception 'Chave de idempotência inválida';
  end if;

  return query
  insert into public.appointments (
    user_id, scheduled_at, appointment_type, dentist_name, clinic_name,
    clinic_address, clinic_phone, notes, idempotency_key
  ) values (
    v_user_id, p_scheduled_at, p_appointment_type, p_dentist_name, p_clinic_name,
    p_clinic_address, p_clinic_phone, p_notes, p_idempotency_key
  )
  on conflict (user_id, idempotency_key) do update
    set idempotency_key = excluded.idempotency_key
  returning public.appointments.*;
end;
$$;

revoke all on function public.create_brushing_session(integer, text) from public;
revoke all on function public.create_flossing_log(text, text) from public;
revoke all on function public.create_appointment_idempotent(
  timestamptz, public.appointment_type, text, text, text, text, text, text
) from public;
grant execute on function public.create_brushing_session(integer, text) to authenticated;
grant execute on function public.create_flossing_log(text, text) to authenticated;
grant execute on function public.create_appointment_idempotent(
  timestamptz, public.appointment_type, text, text, text, text, text, text
) to authenticated;

-- -----------------------------------------------------------------------------
-- Outbox transacional para reavaliar conquistas após falhas secundárias
-- -----------------------------------------------------------------------------

create table public.achievement_evaluation_requests (
  user_id uuid primary key references public.users (id) on delete cascade,
  requested_version bigint not null default 1,
  processed_version bigint not null default 0,
  attempt_count smallint not null default 0,
  next_attempt_at timestamptz not null default now(),
  leased_until timestamptz,
  lease_token uuid,
  last_error_code text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint achievement_evaluation_versions_valid check (
    requested_version >= 1 and processed_version >= 0
    and processed_version <= requested_version
  ),
  constraint achievement_evaluation_attempts_valid check (attempt_count between 0 and 10)
);

create index achievement_evaluation_due_idx
  on public.achievement_evaluation_requests (next_attempt_at, leased_until)
  where processed_version < requested_version;

create trigger achievement_evaluation_requests_set_updated_at
  before update on public.achievement_evaluation_requests
  for each row execute function public.handle_updated_at();

alter table public.achievement_evaluation_requests enable row level security;
-- Sem políticas: somente triggers e o worker com service_role acessam a fila.

create or replace function public.request_achievement_evaluation(p_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.achievement_evaluation_requests (user_id)
  values (p_user_id)
  on conflict (user_id) do update
    set requested_version = achievement_evaluation_requests.requested_version + 1,
        next_attempt_at = least(achievement_evaluation_requests.next_attempt_at, now()),
        last_error_code = null;
end;
$$;

create or replace function public.enqueue_achievement_evaluation_from_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_should_enqueue boolean := false;
begin
  if tg_table_name = 'brushing_sessions' then
    v_should_enqueue := new.is_completed
      and (tg_op = 'INSERT' or old.is_completed is distinct from true);
  elsif tg_table_name = 'flossing_logs' then
    v_should_enqueue := true;
  elsif tg_table_name = 'user_module_progress' then
    v_should_enqueue := new.is_completed
      and (tg_op = 'INSERT' or old.is_completed is distinct from true);
  elsif tg_table_name = 'health_profiles' then
    v_should_enqueue := new.is_completed;
  elsif tg_table_name = 'appointments' then
    v_should_enqueue := new.status = 'scheduled';
  end if;

  if v_should_enqueue then
    perform public.request_achievement_evaluation(new.user_id);
  end if;
  return new;
end;
$$;

create trigger brushing_enqueue_achievement_evaluation
  after insert or update of is_completed on public.brushing_sessions
  for each row execute function public.enqueue_achievement_evaluation_from_change();
create trigger flossing_enqueue_achievement_evaluation
  after insert on public.flossing_logs
  for each row execute function public.enqueue_achievement_evaluation_from_change();
create trigger module_enqueue_achievement_evaluation
  after insert or update of is_completed on public.user_module_progress
  for each row execute function public.enqueue_achievement_evaluation_from_change();
create trigger health_profile_enqueue_achievement_evaluation
  after insert or update of is_completed on public.health_profiles
  for each row execute function public.enqueue_achievement_evaluation_from_change();
create trigger appointment_enqueue_achievement_evaluation
  after insert or update of status on public.appointments
  for each row execute function public.enqueue_achievement_evaluation_from_change();

create or replace function public.unlock_achievement_for_user(
  p_user_id uuid,
  p_achievement_id uuid
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_points_reward smallint;
  v_role text := auth.role();
begin
  if auth.uid() is distinct from p_user_id and v_role <> 'service_role' then
    raise exception 'Usuário não autorizado';
  end if;

  select points_reward into v_points_reward
    from public.achievements
   where id = p_achievement_id and is_active = true;
  if v_points_reward is null then
    raise exception 'Conquista inválida ou inativa';
  end if;

  insert into public.user_achievements (
    user_id, achievement_id, earned_at, visible_on
  ) values (
    p_user_id, p_achievement_id, now(), public.business_date(now()) + 1
  )
  on conflict (user_id, achievement_id) do nothing;

  if found then
    perform public.add_user_points(p_user_id, v_points_reward);
  end if;
end;
$$;

create or replace function public.claim_achievement_evaluations(
  p_batch_size integer default 10,
  p_lease_seconds integer default 300,
  p_now timestamptz default now()
)
returns table(
  user_id uuid,
  requested_version bigint,
  lease_token uuid,
  attempt_count smallint
)
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_batch_size not between 1 and 100 or p_lease_seconds not between 30 and 900 then
    raise exception 'Parâmetros do worker de conquistas inválidos';
  end if;

  return query
  with candidates as (
    select requests.user_id
      from public.achievement_evaluation_requests requests
     where requests.processed_version < requests.requested_version
       and requests.next_attempt_at <= p_now
       and (requests.leased_until is null or requests.leased_until <= p_now)
     order by requests.next_attempt_at, requests.updated_at
     for update skip locked
     limit p_batch_size
  )
  update public.achievement_evaluation_requests requests
     set leased_until = p_now + make_interval(secs => p_lease_seconds),
         lease_token = gen_random_uuid()
    from candidates
   where requests.user_id = candidates.user_id
  returning requests.user_id, requests.requested_version,
            requests.lease_token, requests.attempt_count;
end;
$$;

create or replace function public.complete_achievement_evaluation(
  p_user_id uuid,
  p_requested_version bigint,
  p_lease_token uuid,
  p_succeeded boolean,
  p_retry_at timestamptz default null,
  p_error_code text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_request public.achievement_evaluation_requests%rowtype;
begin
  select * into v_request
    from public.achievement_evaluation_requests
   where user_id = p_user_id
   for update;

  if not found or v_request.lease_token is distinct from p_lease_token then
    return;
  end if;

  if p_succeeded then
    update public.achievement_evaluation_requests
       set processed_version = greatest(processed_version, p_requested_version),
           attempt_count = 0,
           next_attempt_at = case
             when requested_version > p_requested_version then now()
             else next_attempt_at
           end,
           leased_until = null,
           lease_token = null,
           last_error_code = null
     where user_id = p_user_id;
  else
    update public.achievement_evaluation_requests
       set attempt_count = least(attempt_count + 1, 10),
           next_attempt_at = coalesce(p_retry_at, now() + interval '1 minute'),
           leased_until = null,
           lease_token = null,
           last_error_code = left(coalesce(p_error_code, 'evaluation_failed'), 100)
     where user_id = p_user_id;
  end if;
end;
$$;

revoke all on function public.request_achievement_evaluation(uuid) from public;
revoke all on function public.enqueue_achievement_evaluation_from_change() from public;
revoke all on function public.unlock_achievement_for_user(uuid, uuid) from public;
revoke all on function public.claim_achievement_evaluations(integer, integer, timestamptz)
  from public;
revoke all on function public.complete_achievement_evaluation(
  uuid, bigint, uuid, boolean, timestamptz, text
) from public;
grant execute on function public.unlock_achievement_for_user(uuid, uuid)
  to service_role;
grant execute on function public.claim_achievement_evaluations(integer, integer, timestamptz)
  to service_role;
grant execute on function public.complete_achievement_evaluation(
  uuid, bigint, uuid, boolean, timestamptz, text
) to service_role;

-- -----------------------------------------------------------------------------
-- Validação defensiva de subscriptions e fencing de leases Web Push
-- -----------------------------------------------------------------------------

create or replace function public.decode_base64url_or_null(p_value text)
returns bytea
language plpgsql
immutable
strict
set search_path = public
as $$
declare
  v_value text := translate(p_value, '-_', '+/');
begin
  v_value := v_value || repeat('=', (4 - length(v_value) % 4) % 4);
  return decode(v_value, 'base64');
exception when others then
  return null;
end;
$$;

alter table public.notification_deliveries add column lease_token uuid;

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
  v_public_key bytea := public.decode_base64url_or_null(p_p256dh);
  v_auth bytea := public.decode_base64url_or_null(p_auth_secret);
begin
  if v_user_id is null then
    raise exception 'Usuário não autenticado';
  end if;
  if p_endpoint !~ '^https://(fcm\.googleapis\.com|updates\.push\.services\.mozilla\.com|web\.push\.apple\.com|[A-Za-z0-9.-]+\.notify\.windows\.com)(:443)?(/|$)'
     or octet_length(p_endpoint) > 4096 then
    raise exception 'Endpoint de notificação inválido';
  end if;
  if v_public_key is null or octet_length(v_public_key) <> 65
     or get_byte(v_public_key, 0) <> 4
     or v_auth is null or octet_length(v_auth) <> 16 then
    raise exception 'Chaves da inscrição de notificação inválidas';
  end if;
  if p_device_label is not null and char_length(p_device_label) > 80 then
    raise exception 'Identificação do dispositivo inválida';
  end if;
  if p_vapid_key_version <= 0 then
    raise exception 'Versão da chave VAPID inválida';
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

  -- Uma troca de conta no mesmo navegador não pode reaproveitar deliveries
  -- pertencentes ao usuário anterior do endpoint.
  update public.notification_deliveries deliveries
     set status = 'skipped', leased_until = null, lease_token = null,
         last_error_code = 'subscription_owner_changed'
    from public.notification_jobs jobs
   where deliveries.subscription_id = v_subscription_id
     and deliveries.job_id = jobs.id
     and jobs.user_id <> v_user_id
     and deliveries.status in ('pending', 'processing');

  return query select v_subscription_id, true;
end;
$$;

drop function public.claim_due_notification_deliveries(integer, integer, timestamptz);
create function public.claim_due_notification_deliveries(
  p_batch_size integer default 50,
  p_lease_seconds integer default 300,
  p_now timestamptz default now()
)
returns table(
  delivery_id uuid,
  job_id uuid,
  notification_type public.notification_type,
  endpoint text,
  p256dh text,
  auth_secret text,
  payload jsonb,
  attempt_count smallint,
  lease_token uuid
)
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_batch_size not between 1 and 500 or p_lease_seconds not between 30 and 900 then
    raise exception 'Parâmetros do dispatcher inválidos';
  end if;

  perform public.enqueue_due_notification_jobs(p_now);
  perform public.skip_invalid_pending_notifications(p_now);

  update public.notification_deliveries
     set status = 'pending', leased_until = null, lease_token = null
   where status = 'processing' and leased_until <= p_now;

  insert into public.notification_deliveries (job_id, subscription_id, next_attempt_at)
  select jobs.id, subscriptions.id, p_now
    from public.notification_jobs jobs
    join public.push_subscriptions subscriptions
      on subscriptions.user_id = jobs.user_id
     and subscriptions.is_active
     and (subscriptions.expiration_time is null or subscriptions.expiration_time > p_now)
   where jobs.status in ('pending', 'processing')
     and jobs.scheduled_for <= p_now
  on conflict (job_id, subscription_id) do nothing;

  update public.notification_jobs jobs
     set status = 'skipped', skipped_at = p_now,
         last_error_code = 'no_active_subscription'
   where jobs.status = 'pending'
     and jobs.scheduled_for <= p_now
     and not exists (
       select 1 from public.push_subscriptions subscriptions
        where subscriptions.user_id = jobs.user_id
          and subscriptions.is_active
          and (subscriptions.expiration_time is null or subscriptions.expiration_time > p_now)
     );

  return query
  with candidates as (
    select deliveries.id
      from public.notification_deliveries deliveries
      join public.notification_jobs jobs on jobs.id = deliveries.job_id
      join public.push_subscriptions subscriptions
        on subscriptions.id = deliveries.subscription_id
       and subscriptions.user_id = jobs.user_id
     where deliveries.status = 'pending'
       and deliveries.next_attempt_at <= p_now
       and jobs.status in ('pending', 'processing')
       and jobs.scheduled_for <= p_now
       and subscriptions.is_active
     order by jobs.scheduled_for, deliveries.created_at
     for update of deliveries skip locked
     limit p_batch_size
  ), claimed as (
    update public.notification_deliveries deliveries
       set status = 'processing',
           leased_until = p_now + make_interval(secs => p_lease_seconds),
           lease_token = gen_random_uuid()
      from candidates
     where deliveries.id = candidates.id
    returning deliveries.*
  ), marked_jobs as (
    update public.notification_jobs jobs
       set status = 'processing'
     where jobs.id in (select claimed.job_id from claimed)
    returning jobs.id
  )
  select claimed.id, jobs.id, jobs.notification_type,
         subscriptions.endpoint, subscriptions.p256dh, subscriptions.auth_secret,
         jobs.payload || jsonb_build_object('tag', concat('oralcardio-', jobs.id)),
         claimed.attempt_count, claimed.lease_token
    from claimed
    join public.notification_jobs jobs on jobs.id = claimed.job_id
    join public.push_subscriptions subscriptions
      on subscriptions.id = claimed.subscription_id
     and subscriptions.user_id = jobs.user_id;
end;
$$;

create or replace function public.complete_notification_delivery(
  p_delivery_id uuid,
  p_lease_token uuid,
  p_outcome text,
  p_error_code text default null,
  p_retry_at timestamptz default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_delivery public.notification_deliveries%rowtype;
  v_attempts smallint;
begin
  select * into v_delivery
    from public.notification_deliveries
   where id = p_delivery_id
   for update;
  if not found or v_delivery.status <> 'processing'
     or v_delivery.lease_token is distinct from p_lease_token then
    return;
  end if;

  v_attempts := v_delivery.attempt_count + 1;
  if p_outcome = 'sent' then
    update public.notification_deliveries
       set status = 'sent', attempt_count = v_attempts, sent_at = now(),
           leased_until = null, lease_token = null, last_error_code = null
     where id = p_delivery_id;
  elsif p_outcome = 'retry' and v_attempts < v_delivery.max_attempts then
    update public.notification_deliveries
       set status = 'pending', attempt_count = v_attempts,
           next_attempt_at = coalesce(p_retry_at, now() + interval '1 minute'),
           leased_until = null, lease_token = null,
           last_error_code = left(p_error_code, 100)
     where id = p_delivery_id;
  elsif p_outcome in ('revoked', 'dead', 'retry') then
    update public.notification_deliveries
       set status = 'dead', attempt_count = v_attempts, leased_until = null,
           lease_token = null,
           last_error_code = left(coalesce(p_error_code, p_outcome), 100)
     where id = p_delivery_id;
    if p_outcome = 'revoked' then
      update public.push_subscriptions
         set is_active = false, revoked_at = now()
       where id = v_delivery.subscription_id;
    end if;
  else
    raise exception 'Resultado de entrega inválido';
  end if;

  update public.notification_jobs jobs
     set status = case
           when exists (
             select 1 from public.notification_deliveries deliveries
              where deliveries.job_id = jobs.id
                and deliveries.status in ('pending', 'processing')
           ) then 'processing'::public.notification_delivery_status
           when exists (
             select 1 from public.notification_deliveries deliveries
              where deliveries.job_id = jobs.id and deliveries.status = 'sent'
           ) then 'sent'::public.notification_delivery_status
           else 'dead'::public.notification_delivery_status
         end,
         sent_at = case
           when exists (
             select 1 from public.notification_deliveries deliveries
              where deliveries.job_id = jobs.id and deliveries.status = 'sent'
           ) then coalesce(jobs.sent_at, now())
           else jobs.sent_at
         end
   where jobs.id = v_delivery.job_id;
end;
$$;

revoke all on function public.decode_base64url_or_null(text) from public;
revoke all on function public.upsert_push_subscription(
  text, text, text, timestamptz, text, smallint
) from public;
revoke all on function public.claim_due_notification_deliveries(
  integer, integer, timestamptz
) from public;
revoke all on function public.complete_notification_delivery(
  uuid, uuid, text, text, timestamptz
) from public;
grant execute on function public.upsert_push_subscription(
  text, text, text, timestamptz, text, smallint
) to authenticated;
grant execute on function public.claim_due_notification_deliveries(
  integer, integer, timestamptz
) to service_role;
grant execute on function public.complete_notification_delivery(
  uuid, uuid, text, text, timestamptz
) to service_role;

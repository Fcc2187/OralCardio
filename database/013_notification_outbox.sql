-- =============================================================================
-- OralCardio — 013: outbox, idempotência e entrega Web Push
-- Depende de 012_notifications_core.sql.
-- =============================================================================

create type public.notification_type as enum (
  'brushing_reminder',
  'flossing_reminder',
  'appointment_reminder',
  'test'
);

create type public.notification_delivery_status as enum (
  'pending',
  'processing',
  'sent',
  'skipped',
  'dead'
);

create table public.notification_jobs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  notification_type public.notification_type not null,
  appointment_id uuid references public.appointments (id) on delete set null,
  scheduled_for timestamptz not null,
  deduplication_key text not null unique,
  payload jsonb not null,
  status public.notification_delivery_status not null default 'pending',
  last_error_code text,
  sent_at timestamptz,
  skipped_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint notification_jobs_payload_object check (jsonb_typeof(payload) = 'object'),
  constraint notification_jobs_dedup_length check (char_length(deduplication_key) <= 300)
);

create index notification_jobs_due_idx
  on public.notification_jobs (scheduled_for)
  where status in ('pending', 'processing');
create index notification_jobs_user_created_idx
  on public.notification_jobs (user_id, created_at desc);

create table public.notification_deliveries (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.notification_jobs (id) on delete cascade,
  subscription_id uuid not null references public.push_subscriptions (id) on delete cascade,
  status public.notification_delivery_status not null default 'pending',
  attempt_count smallint not null default 0,
  max_attempts smallint not null default 5,
  leased_until timestamptz,
  next_attempt_at timestamptz not null default now(),
  last_error_code text,
  sent_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint notification_deliveries_attempts_valid check (
    attempt_count >= 0 and max_attempts between 1 and 10
  ),
  constraint notification_deliveries_unique_device unique (job_id, subscription_id)
);

create index notification_deliveries_claim_idx
  on public.notification_deliveries (next_attempt_at, leased_until)
  where status in ('pending', 'processing');

create trigger notification_jobs_set_updated_at
  before update on public.notification_jobs
  for each row execute function public.handle_updated_at();

create trigger notification_deliveries_set_updated_at
  before update on public.notification_deliveries
  for each row execute function public.handle_updated_at();

alter table public.notification_jobs enable row level security;
alter table public.notification_deliveries enable row level security;
-- Sem políticas para clientes. O dispatcher usa exclusivamente service_role.

create or replace function public.notification_appointment_delivery_time(
  p_desired_at timestamptz,
  p_quiet_start time,
  p_quiet_end time
)
returns timestamptz
language plpgsql
stable
set search_path = public
as $$
declare
  v_local timestamp := p_desired_at at time zone 'America/Sao_Paulo';
  v_local_time time := v_local::time;
  v_adjusted timestamp;
begin
  if not public.notification_time_is_quiet(v_local_time, p_quiet_start, p_quiet_end) then
    return p_desired_at;
  end if;

  if p_quiet_start < p_quiet_end then
    v_adjusted := v_local::date + p_quiet_start - interval '1 minute';
  elsif v_local_time >= p_quiet_start then
    v_adjusted := v_local::date + p_quiet_start - interval '1 minute';
  else
    v_adjusted := (v_local::date - 1) + p_quiet_start - interval '1 minute';
  end if;

  return v_adjusted at time zone 'America/Sao_Paulo';
end;
$$;

create or replace function public.enqueue_due_notification_jobs(p_now timestamptz default now())
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Lembretes de hábitos. A chave usa data civil e ordinal; uma execução
  -- repetida do Cron nunca cria outro job para o mesmo lembrete diário.
  insert into public.notification_jobs (
    user_id, notification_type, scheduled_for, deduplication_key, payload,
    status, last_error_code, skipped_at
  )
  select
    schedules.user_id,
    case schedules.habit_type
      when 'brushing' then 'brushing_reminder'::public.notification_type
      else 'flossing_reminder'::public.notification_type
    end,
    schedules.next_due_at,
    concat(
      'habit:', schedules.id, ':',
      (schedules.next_due_at at time zone 'America/Sao_Paulo')::date
    ),
    jsonb_build_object(
      'title', 'OralCardio',
      'body', case schedules.habit_type
        when 'brushing' then 'Hora de cuidar do seu sorriso. Vamos escovar?'
        else 'Que tal completar o cuidado de hoje com fio dental?'
      end,
      'url', case schedules.habit_type
        when 'brushing' then '/escovar'
        else '/'
      end,
      'target_ordinal', schedules.target_ordinal
    ),
    case
      when schedules.habit_type = 'brushing'
       and stats.last_brushing_date = public.business_date(p_now)
       and stats.brushings_on_last_date >= schedules.target_ordinal then 'skipped'
      when schedules.habit_type = 'flossing'
       and stats.last_flossing_date = public.business_date(p_now)
       and stats.flossings_on_last_date >= schedules.target_ordinal then 'skipped'
      else 'pending'
    end,
    case
      when schedules.habit_type = 'brushing'
       and stats.last_brushing_date = public.business_date(p_now)
       and stats.brushings_on_last_date >= schedules.target_ordinal
        then 'habit_already_completed'
      when schedules.habit_type = 'flossing'
       and stats.last_flossing_date = public.business_date(p_now)
       and stats.flossings_on_last_date >= schedules.target_ordinal
        then 'habit_already_completed'
      else null
    end,
    case
      when (schedules.habit_type = 'brushing'
        and stats.last_brushing_date = public.business_date(p_now)
        and stats.brushings_on_last_date >= schedules.target_ordinal)
        or (schedules.habit_type = 'flossing'
        and stats.last_flossing_date = public.business_date(p_now)
        and stats.flossings_on_last_date >= schedules.target_ordinal)
      then p_now
      else null
    end
  from public.habit_notification_schedules schedules
  join public.notification_preferences preferences using (user_id)
  join public.user_stats stats using (user_id)
  where schedules.enabled
    and schedules.next_due_at <= p_now
    and (schedules.next_due_at at time zone 'America/Sao_Paulo')::date
      = public.business_date(p_now)
    and preferences.enabled
    and case schedules.habit_type
      when 'brushing' then preferences.brushing_enabled
      else preferences.flossing_enabled
    end
  on conflict (deduplication_key) do nothing;

  update public.habit_notification_schedules schedules
     set next_due_at = public.notification_next_occurrence(schedules.local_time, p_now)
    from public.notification_preferences preferences
   where schedules.user_id = preferences.user_id
     and schedules.enabled
     and schedules.next_due_at <= p_now;

  -- Consultas: a chave inclui o horário agendado e a antecedência. Reagendar
  -- produz uma chave nova e o trigger abaixo invalida jobs antigos.
  insert into public.notification_jobs (
    user_id, notification_type, appointment_id, scheduled_for,
    deduplication_key, payload
  )
  select
    appointments.user_id,
    'appointment_reminder',
    appointments.id,
    due.effective_at,
    concat(
      'appointment:', appointments.id, ':',
      extract(epoch from appointments.scheduled_at)::bigint, ':', lead.minutes
    ),
    jsonb_build_object(
      'title', 'OralCardio',
      'body', case
        when lead.minutes >= 1440 then 'Você tem uma consulta odontológica se aproximando.'
        else 'Sua consulta odontológica será em breve.'
      end,
      'url', concat('/agenda/', appointments.id)
    )
  from public.appointments appointments
  join public.notification_preferences preferences using (user_id)
  cross join lateral unnest(preferences.appointment_lead_minutes) as lead(minutes)
  cross join lateral (
    select public.notification_appointment_delivery_time(
      appointments.scheduled_at - make_interval(mins => lead.minutes),
      preferences.quiet_hours_start,
      preferences.quiet_hours_end
    ) as effective_at
  ) due
  where preferences.enabled
    and preferences.appointments_enabled
    and appointments.status = 'scheduled'
    and appointments.scheduled_at > p_now
    and due.effective_at <= p_now
    and due.effective_at > p_now - interval '2 days'
  on conflict (deduplication_key) do nothing;
end;
$$;

create or replace function public.skip_invalid_pending_notifications(p_now timestamptz default now())
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.notification_jobs jobs
     set status = 'skipped',
         skipped_at = p_now,
         last_error_code = 'habit_already_completed'
    from public.user_stats stats
   where jobs.user_id = stats.user_id
     and jobs.status in ('pending', 'processing')
     and jobs.notification_type = 'brushing_reminder'
     and stats.last_brushing_date = public.business_date(p_now)
     and stats.brushings_on_last_date >= (jobs.payload ->> 'target_ordinal')::int;

  update public.notification_jobs jobs
     set status = 'skipped',
         skipped_at = p_now,
         last_error_code = 'habit_already_completed'
    from public.user_stats stats
   where jobs.user_id = stats.user_id
     and jobs.status in ('pending', 'processing')
     and jobs.notification_type = 'flossing_reminder'
     and stats.last_flossing_date = public.business_date(p_now)
     and stats.flossings_on_last_date >= (jobs.payload ->> 'target_ordinal')::int;

  update public.notification_jobs jobs
     set status = 'skipped',
         skipped_at = p_now,
         last_error_code = 'appointment_unavailable'
   where jobs.status in ('pending', 'processing')
     and jobs.notification_type = 'appointment_reminder'
     and not exists (
       select 1 from public.appointments appointments
        where appointments.id = jobs.appointment_id
          and appointments.status = 'scheduled'
          and appointments.scheduled_at > p_now
     );

  update public.notification_deliveries deliveries
     set status = 'skipped',
         leased_until = null,
         last_error_code = jobs.last_error_code
    from public.notification_jobs jobs
   where deliveries.job_id = jobs.id
     and jobs.status = 'skipped'
     and deliveries.status in ('pending', 'processing');
end;
$$;

create or replace function public.claim_due_notification_deliveries(
  p_batch_size int default 100,
  p_lease_seconds int default 120,
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
  attempt_count smallint
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
     set status = 'pending', leased_until = null
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
     set status = 'skipped',
         skipped_at = p_now,
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
      join public.push_subscriptions subscriptions on subscriptions.id = deliveries.subscription_id
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
           leased_until = p_now + make_interval(secs => p_lease_seconds)
      from candidates
     where deliveries.id = candidates.id
    returning deliveries.*
  ), marked_jobs as (
    update public.notification_jobs jobs
       set status = 'processing'
     where jobs.id in (select claimed.job_id from claimed)
    returning jobs.id
  )
  select
    claimed.id,
    jobs.id,
    jobs.notification_type,
    subscriptions.endpoint,
    subscriptions.p256dh,
    subscriptions.auth_secret,
    jobs.payload || jsonb_build_object('tag', concat('oralcardio-', jobs.id)),
    claimed.attempt_count
  from claimed
  join public.notification_jobs jobs on jobs.id = claimed.job_id
  join public.push_subscriptions subscriptions on subscriptions.id = claimed.subscription_id;
end;
$$;

create or replace function public.complete_notification_delivery(
  p_delivery_id uuid,
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
  if not found then
    raise exception 'Entrega de notificação não encontrada';
  end if;
  if v_delivery.status <> 'processing' then
    return;
  end if;

  v_attempts := v_delivery.attempt_count + 1;

  if p_outcome = 'sent' then
    update public.notification_deliveries
       set status = 'sent', attempt_count = v_attempts, sent_at = now(),
           leased_until = null, last_error_code = null
     where id = p_delivery_id;
  elsif p_outcome = 'retry' and v_attempts < v_delivery.max_attempts then
    update public.notification_deliveries
       set status = 'pending', attempt_count = v_attempts,
           next_attempt_at = coalesce(p_retry_at, now() + interval '1 minute'),
           leased_until = null, last_error_code = left(p_error_code, 100)
     where id = p_delivery_id;
  elsif p_outcome in ('revoked', 'dead', 'retry') then
    update public.notification_deliveries
       set status = 'dead', attempt_count = v_attempts, leased_until = null,
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

create or replace function public.request_test_notification()
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_job_id uuid := gen_random_uuid();
begin
  if v_user_id is null then
    raise exception 'Usuário não autenticado';
  end if;
  if not exists (
    select 1 from public.push_subscriptions
     where user_id = v_user_id and is_active
  ) then
    raise exception 'Ative as notificações neste dispositivo antes de testar';
  end if;
  if exists (
    select 1 from public.notification_jobs
     where user_id = v_user_id
       and notification_type = 'test'
       and created_at > now() - interval '1 minute'
  ) then
    raise exception 'Aguarde um minuto antes de enviar outro teste';
  end if;

  insert into public.notification_jobs (
    id, user_id, notification_type, scheduled_for, deduplication_key, payload
  ) values (
    v_job_id,
    v_user_id,
    'test',
    now(),
    concat('test:', v_user_id, ':', v_job_id),
    jsonb_build_object(
      'title', 'OralCardio',
      'body', 'Notificações ativadas com sucesso neste dispositivo.',
      'url', '/perfil'
    )
  );
  return v_job_id;
end;
$$;

create or replace function public.cancel_stale_appointment_notification_jobs()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.notification_jobs
     set status = 'skipped', skipped_at = now(), last_error_code = 'appointment_changed'
   where appointment_id = old.id
     and status in ('pending', 'processing');

  update public.notification_deliveries deliveries
     set status = 'skipped', leased_until = null, last_error_code = 'appointment_changed'
    from public.notification_jobs jobs
   where deliveries.job_id = jobs.id
     and jobs.appointment_id = old.id
     and deliveries.status in ('pending', 'processing');
  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end;
$$;

create trigger appointments_cancel_stale_notification_jobs
  before update of scheduled_at, status or delete on public.appointments
  for each row execute function public.cancel_stale_appointment_notification_jobs();

revoke all on function public.enqueue_due_notification_jobs(timestamptz) from public;
revoke all on function public.skip_invalid_pending_notifications(timestamptz) from public;
revoke all on function public.claim_due_notification_deliveries(int, int, timestamptz) from public;
revoke all on function public.complete_notification_delivery(uuid, text, text, timestamptz) from public;
revoke all on function public.request_test_notification() from public;
revoke all on function public.cancel_stale_appointment_notification_jobs() from public;

grant execute on function public.claim_due_notification_deliveries(int, int, timestamptz)
  to service_role;
grant execute on function public.complete_notification_delivery(uuid, text, text, timestamptz)
  to service_role;
grant execute on function public.request_test_notification() to authenticated;

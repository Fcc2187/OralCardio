-- =============================================================================
-- OralCardio — 018: integridade transacional e contratos seguros de escrita
-- Depende de 017_remove_legacy_backend_rpcs.sql.
--
-- Esta migration é aditiva. A revogação de DML direto está em 019 e somente
-- deve ser aplicada depois da versão do backend que consome estas RPCs.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Idempotência: uma chave não pode representar corpos diferentes.
-- -----------------------------------------------------------------------------

alter table public.brushing_sessions add column request_hash text;
alter table public.flossing_logs add column request_hash text;
alter table public.appointments add column request_hash text;

alter table public.brushing_sessions
  add constraint brushing_sessions_request_hash_valid
  check (request_hash is null or request_hash ~ '^[a-f0-9]{64}$');
alter table public.flossing_logs
  add constraint flossing_logs_request_hash_valid
  check (request_hash is null or request_hash ~ '^[a-f0-9]{64}$');
alter table public.appointments
  add constraint appointments_request_hash_valid
  check (request_hash is null or request_hash ~ '^[a-f0-9]{64}$');

create or replace function public.assert_idempotency_key(
  p_key text,
  p_hash text
)
returns void
language plpgsql
immutable
set search_path = public
as $$
begin
  if p_key is null
     or char_length(p_key) not between 8 and 128
     or p_key !~ '^[A-Za-z0-9._:-]+$' then
    raise exception 'Chave de idempotência inválida';
  end if;
  if p_hash !~ '^[a-f0-9]{64}$' then
    raise exception 'Fingerprint de requisição inválido';
  end if;
end;
$$;

create function public.create_brushing_session_v2(
  p_target_duration integer,
  p_idempotency_key text,
  p_request_hash text
)
returns setof public.brushing_sessions
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_existing public.brushing_sessions%rowtype;
begin
  if v_user_id is null then raise exception 'Usuário não autenticado'; end if;
  if p_target_duration not between 1 and 3600 then
    raise exception 'Duração alvo inválida';
  end if;
  perform public.assert_idempotency_key(p_idempotency_key, p_request_hash);

  select * into v_existing
    from public.brushing_sessions
   where user_id = v_user_id and idempotency_key = p_idempotency_key
   for update;
  if found then
    if v_existing.request_hash is not null
       and v_existing.request_hash <> p_request_hash then
      raise exception 'A chave de idempotência já foi usada com outra requisição';
    end if;
    if v_existing.request_hash is null then
      update public.brushing_sessions set request_hash = p_request_hash where id = v_existing.id;
      select * into v_existing from public.brushing_sessions where id = v_existing.id;
    end if;
    return next v_existing;
    return;
  end if;

  return query
  insert into public.brushing_sessions (
    user_id, target_duration, zones_completed, is_completed, idempotency_key, request_hash
  ) values (v_user_id, p_target_duration, '{}', false, p_idempotency_key, p_request_hash)
  returning public.brushing_sessions.*;
end;
$$;

create function public.create_flossing_log_v2(
  p_notes text,
  p_idempotency_key text,
  p_request_hash text
)
returns setof public.flossing_logs
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_existing public.flossing_logs%rowtype;
begin
  if v_user_id is null then raise exception 'Usuário não autenticado'; end if;
  if p_notes is not null and char_length(p_notes) > 500 then
    raise exception 'Observação muito longa';
  end if;
  perform public.assert_idempotency_key(p_idempotency_key, p_request_hash);

  select * into v_existing
    from public.flossing_logs
   where user_id = v_user_id and idempotency_key = p_idempotency_key
   for update;
  if found then
    if v_existing.request_hash is not null
       and v_existing.request_hash <> p_request_hash then
      raise exception 'A chave de idempotência já foi usada com outra requisição';
    end if;
    if v_existing.request_hash is null then
      update public.flossing_logs set request_hash = p_request_hash where id = v_existing.id;
      select * into v_existing from public.flossing_logs where id = v_existing.id;
    end if;
    return next v_existing;
    return;
  end if;

  return query
  insert into public.flossing_logs (user_id, notes, idempotency_key, request_hash)
  values (v_user_id, p_notes, p_idempotency_key, p_request_hash)
  returning public.flossing_logs.*;
end;
$$;

create function public.create_appointment_v2(
  p_scheduled_at timestamptz,
  p_appointment_type public.appointment_type,
  p_dentist_name text,
  p_clinic_name text,
  p_clinic_address text,
  p_clinic_phone text,
  p_notes text,
  p_idempotency_key text,
  p_request_hash text
)
returns setof public.appointments
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_existing public.appointments%rowtype;
begin
  if v_user_id is null then raise exception 'Usuário não autenticado'; end if;
  if p_scheduled_at <= now() then raise exception 'A consulta deve ser agendada para o futuro'; end if;
  if char_length(trim(p_dentist_name)) = 0 then raise exception 'Dentista obrigatório'; end if;
  perform public.assert_idempotency_key(p_idempotency_key, p_request_hash);

  select * into v_existing
    from public.appointments
   where user_id = v_user_id and idempotency_key = p_idempotency_key
   for update;
  if found then
    if v_existing.request_hash is not null
       and v_existing.request_hash <> p_request_hash then
      raise exception 'A chave de idempotência já foi usada com outra requisição';
    end if;
    if v_existing.request_hash is null then
      update public.appointments set request_hash = p_request_hash where id = v_existing.id;
      select * into v_existing from public.appointments where id = v_existing.id;
    end if;
    return next v_existing;
    return;
  end if;

  return query
  insert into public.appointments (
    user_id, scheduled_at, appointment_type, dentist_name, clinic_name,
    clinic_address, clinic_phone, notes, idempotency_key, request_hash
  ) values (
    v_user_id, p_scheduled_at, p_appointment_type, p_dentist_name, p_clinic_name,
    p_clinic_address, p_clinic_phone, p_notes, p_idempotency_key, p_request_hash
  )
  returning public.appointments.*;
end;
$$;

-- -----------------------------------------------------------------------------
-- Escritas atômicas que preservam as máquinas de estado do domínio.
-- -----------------------------------------------------------------------------

create function public.mark_brushing_zone_completed(
  p_session_id uuid,
  p_zone text
)
returns setof public.brushing_sessions
language plpgsql
security definer
set search_path = public
as $$
declare
  v_session public.brushing_sessions%rowtype;
begin
  if auth.uid() is null then raise exception 'Usuário não autenticado'; end if;
  if p_zone not in ('upper_right', 'upper_left', 'lower_right', 'lower_left', 'tongue') then
    raise exception 'Zona de escovação inválida';
  end if;

  select * into v_session
    from public.brushing_sessions
   where id = p_session_id and user_id = auth.uid()
   for update;
  if not found then raise exception 'Sessão de escovação não encontrada'; end if;
  if v_session.is_completed then raise exception 'Sessão já concluída, não pode ser alterada'; end if;

  if not p_zone = any(v_session.zones_completed) then
    update public.brushing_sessions
       set zones_completed = array_append(zones_completed, p_zone)
     where id = p_session_id
     returning * into v_session;
  end if;
  return next v_session;
end;
$$;

create function public.complete_brushing_session(
  p_session_id uuid
)
returns setof public.brushing_sessions
language plpgsql
security definer
set search_path = public
as $$
declare
  v_session public.brushing_sessions%rowtype;
  v_duration integer;
begin
  if auth.uid() is null then raise exception 'Usuário não autenticado'; end if;
  select * into v_session
    from public.brushing_sessions
   where id = p_session_id and user_id = auth.uid()
   for update;
  if not found then raise exception 'Sessão de escovação não encontrada'; end if;
  if v_session.is_completed then
    return next v_session;
    return;
  end if;
  if cardinality(v_session.zones_completed) <> 5 then
    raise exception 'Todas as 5 zonas da boca precisam ser concluídas antes de finalizar';
  end if;

  v_duration := greatest(0, least(
    floor(extract(epoch from now() - v_session.started_at))::integer,
    v_session.target_duration
  ));
  update public.brushing_sessions
     set is_completed = true, completed_at = now(), duration_seconds = v_duration
   where id = p_session_id
   returning * into v_session;
  return next v_session;
end;
$$;

alter table public.appointments add column version bigint not null default 1;

create function public.update_appointment_v2(
  p_appointment_id uuid,
  p_expected_version bigint,
  p_scheduled_at timestamptz,
  p_appointment_type public.appointment_type,
  p_dentist_name text,
  p_clinic_name text,
  p_clinic_address text,
  p_clinic_phone text,
  p_notes text,
  p_status public.appointment_status
)
returns setof public.appointments
language plpgsql
security definer
set search_path = public
as $$
declare
  v_current public.appointments%rowtype;
begin
  if auth.uid() is null then raise exception 'Usuário não autenticado'; end if;
  select * into v_current
    from public.appointments
   where id = p_appointment_id and user_id = auth.uid()
   for update;
  if not found then raise exception 'Consulta não encontrada'; end if;
  if v_current.version <> p_expected_version then
    raise exception 'A consulta foi alterada por outra operação; atualize e tente novamente';
  end if;
  if p_scheduled_at <= now() then raise exception 'A consulta deve ser agendada para o futuro'; end if;
  if p_status <> v_current.status
     and not (
       (v_current.status = 'scheduled' and p_status in ('completed', 'cancelled', 'rescheduled'))
       or (v_current.status = 'rescheduled' and p_status = 'scheduled')
     ) then
    raise exception 'Transição de status inválida';
  end if;

  return query
  update public.appointments
     set scheduled_at = p_scheduled_at,
         appointment_type = p_appointment_type,
         dentist_name = p_dentist_name,
         clinic_name = p_clinic_name,
         clinic_address = p_clinic_address,
         clinic_phone = p_clinic_phone,
         notes = p_notes,
         status = p_status,
         version = version + 1
   where id = p_appointment_id
  returning public.appointments.*;
end;
$$;

create function public.delete_appointment_v2(p_appointment_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  delete from public.appointments where id = p_appointment_id and user_id = auth.uid();
  if not found then raise exception 'Consulta não encontrada'; end if;
end;
$$;

create function public.start_user_module_v2(p_module_id uuid)
returns setof public.user_module_progress
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (select 1 from public.education_modules where id = p_module_id and is_active) then
    raise exception 'Módulo educacional não encontrado';
  end if;
  return query
  insert into public.user_module_progress (user_id, module_id)
  values (auth.uid(), p_module_id)
  on conflict (user_id, module_id) do update set module_id = excluded.module_id
  returning public.user_module_progress.*;
end;
$$;

create function public.complete_user_module_v2(
  p_module_id uuid,
  p_read_time_seconds integer default null
)
returns setof public.user_module_progress
language plpgsql
security definer
set search_path = public
as $$
declare
  v_progress public.user_module_progress%rowtype;
begin
  if p_read_time_seconds is not null and p_read_time_seconds not between 0 and 86400 then
    raise exception 'Tempo de leitura inválido';
  end if;
  perform public.start_user_module_v2(p_module_id);
  select * into v_progress
    from public.user_module_progress
   where user_id = auth.uid() and module_id = p_module_id
   for update;
  if v_progress.is_completed then
    return next v_progress;
    return;
  end if;
  update public.user_module_progress
     set is_completed = true, completed_at = now(), read_time_seconds = p_read_time_seconds
   where id = v_progress.id
   returning * into v_progress;
  return next v_progress;
end;
$$;

create function public.upsert_health_profile_v2(
  p_cardiac_condition public.cardiac_condition,
  p_cardiac_condition_detail text,
  p_has_pacemaker boolean,
  p_has_prosthetic_valve boolean,
  p_medications text[],
  p_allergies text[],
  p_last_dental_visit date,
  p_brushing_frequency_before smallint,
  p_dentist_name text,
  p_dentist_phone text,
  p_cardiologist_name text
)
returns setof public.health_profiles
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then raise exception 'Usuário não autenticado'; end if;
  if cardinality(coalesce(p_medications, '{}')) > 50
     or cardinality(coalesce(p_allergies, '{}')) > 50
     or exists (
       select 1 from unnest(coalesce(p_medications, '{}') || coalesce(p_allergies, '{}')) item
        where char_length(trim(item)) not between 1 and 200
     ) then
    raise exception 'Lista de medicamentos ou alergias inválida';
  end if;
  if p_last_dental_visit > public.business_date(now()) then
    raise exception 'A data da última consulta odontológica não pode estar no futuro';
  end if;
  if p_brushing_frequency_before not between 0 and 20 then
    raise exception 'Frequência de escovação inválida';
  end if;

  return query
  insert into public.health_profiles (
    user_id, cardiac_condition, cardiac_condition_detail, has_pacemaker,
    has_prosthetic_valve, medications, allergies, last_dental_visit,
    brushing_frequency_before, dentist_name, dentist_phone, cardiologist_name,
    is_completed
  ) values (
    auth.uid(), p_cardiac_condition, p_cardiac_condition_detail, p_has_pacemaker,
    p_has_prosthetic_valve, coalesce(p_medications, '{}'), coalesce(p_allergies, '{}'),
    p_last_dental_visit, p_brushing_frequency_before, p_dentist_name, p_dentist_phone,
    p_cardiologist_name, true
  )
  on conflict (user_id) do update
     set cardiac_condition = excluded.cardiac_condition,
         cardiac_condition_detail = excluded.cardiac_condition_detail,
         has_pacemaker = excluded.has_pacemaker,
         has_prosthetic_valve = excluded.has_prosthetic_valve,
         medications = excluded.medications,
         allergies = excluded.allergies,
         last_dental_visit = excluded.last_dental_visit,
         brushing_frequency_before = excluded.brushing_frequency_before,
         dentist_name = excluded.dentist_name,
         dentist_phone = excluded.dentist_phone,
         cardiologist_name = excluded.cardiologist_name,
         is_completed = true
  returning public.health_profiles.*;
end;
$$;

-- -----------------------------------------------------------------------------
-- Catálogo, outbox, ordenação e entregas de notificações.
-- -----------------------------------------------------------------------------

alter table public.achievements
  add constraint achievements_condition_value_positive check (condition_value > 0),
  add constraint achievements_points_reward_nonnegative check (points_reward >= 0);

-- Corrige eventuais duplicações criadas por execuções manuais de 005. Quando
-- o usuário já possuía ambas as versões, mantém uma só e remove apenas o
-- bônus duplicado; quando possuía só a versão duplicada, o vínculo é migrado.
with duplicate_map as (
  select id,
         min(id::text) over (
           partition by name, condition_type, condition_value
         )::uuid as canonical_id
    from public.achievements
), removed_rewards as (
  delete from public.user_achievements user_achievements
   using duplicate_map duplicate, public.achievements achievement
   where user_achievements.achievement_id = duplicate.id
     and duplicate.id <> duplicate.canonical_id
     and achievement.id = duplicate.id
     and exists (
       select 1
         from public.user_achievements canonical
        where canonical.user_id = user_achievements.user_id
          and canonical.achievement_id = duplicate.canonical_id
     )
  returning user_achievements.user_id, achievement.points_reward
), reward_totals as (
  select user_id, sum(points_reward)::integer as points_to_remove
    from removed_rewards
   group by user_id
)
update public.user_stats stats
   set total_points = greatest(0, stats.total_points - reward_totals.points_to_remove)
  from reward_totals
 where stats.user_id = reward_totals.user_id;

with duplicate_map as (
  select id,
         min(id::text) over (
           partition by name, condition_type, condition_value
         )::uuid as canonical_id
    from public.achievements
)
update public.user_achievements user_achievements
   set achievement_id = duplicate.canonical_id
  from duplicate_map duplicate
 where user_achievements.achievement_id = duplicate.id
   and duplicate.id <> duplicate.canonical_id;

delete from public.achievements duplicate
 using (
  select id,
         min(id::text) over (
           partition by name, condition_type, condition_value
         )::uuid as canonical_id
    from public.achievements
) mapping
 where duplicate.id = mapping.id
   and mapping.id <> mapping.canonical_id;

update public.user_stats
   set level = (public.calculate_level(total_points)).level,
       level_name = (public.calculate_level(total_points)).name;

create unique index achievements_natural_identity_idx
  on public.achievements (name, condition_type, condition_value);

alter table public.achievement_evaluation_requests add column dead_at timestamptz;
drop index public.achievement_evaluation_due_idx;
create index achievement_evaluation_due_idx
  on public.achievement_evaluation_requests (next_attempt_at, updated_at, user_id)
  where processed_version < requested_version and dead_at is null;

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
        attempt_count = case when achievement_evaluation_requests.dead_at is null
          then achievement_evaluation_requests.attempt_count else 0 end,
        dead_at = null,
        last_error_code = null;
end;
$$;

create or replace function public.claim_achievement_evaluations(
  p_batch_size integer default 10,
  p_lease_seconds integer default 300,
  p_now timestamptz default now()
)
returns table(user_id uuid, requested_version bigint, lease_token uuid, attempt_count smallint)
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
       and requests.dead_at is null
       and requests.next_attempt_at <= p_now
       and (requests.leased_until is null or requests.leased_until <= p_now)
     order by requests.next_attempt_at, requests.updated_at, requests.user_id
     for update skip locked
     limit p_batch_size
  )
  update public.achievement_evaluation_requests requests
     set leased_until = p_now + make_interval(secs => p_lease_seconds),
         lease_token = gen_random_uuid()
    from candidates
   where requests.user_id = candidates.user_id
  returning requests.user_id, requests.requested_version, requests.lease_token, requests.attempt_count;
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
  v_next_attempt smallint;
begin
  select * into v_request from public.achievement_evaluation_requests
   where user_id = p_user_id for update;
  if not found or v_request.lease_token is distinct from p_lease_token then return; end if;
  if p_succeeded then
    update public.achievement_evaluation_requests
       set processed_version = greatest(processed_version, p_requested_version),
           attempt_count = 0, dead_at = null,
           next_attempt_at = case when requested_version > p_requested_version then now() else next_attempt_at end,
           leased_until = null, lease_token = null, last_error_code = null
     where user_id = p_user_id;
  else
    v_next_attempt := v_request.attempt_count + 1;
    update public.achievement_evaluation_requests
       set attempt_count = least(v_next_attempt, 10),
           dead_at = case when v_next_attempt >= 10 then now() else null end,
           next_attempt_at = case when v_next_attempt >= 10 then next_attempt_at
             else coalesce(p_retry_at, now() + interval '1 minute') end,
           leased_until = null, lease_token = null,
           last_error_code = left(coalesce(p_error_code, 'evaluation_failed'), 100)
     where user_id = p_user_id;
  end if;
end;
$$;

create function public.cancel_ineligible_notification_deliveries(p_user_id uuid default null)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.notification_deliveries deliveries
     set status = 'skipped', leased_until = null, lease_token = null,
         last_error_code = 'notification_no_longer_eligible'
    from public.notification_jobs jobs
    left join public.notification_preferences preferences on preferences.user_id = jobs.user_id
    left join public.push_subscriptions subscriptions on subscriptions.id = deliveries.subscription_id
   where deliveries.job_id = jobs.id
     and deliveries.status in ('pending', 'processing')
     and (p_user_id is null or jobs.user_id = p_user_id)
     and (
       subscriptions.id is null or not subscriptions.is_active
       or (subscriptions.expiration_time is not null and subscriptions.expiration_time <= now())
       or preferences.id is null or not preferences.enabled
       or (jobs.notification_type = 'brushing_reminder' and not preferences.brushing_enabled)
       or (jobs.notification_type = 'flossing_reminder' and not preferences.flossing_enabled)
       or (jobs.notification_type = 'appointment_reminder' and not preferences.appointments_enabled)
     );

  update public.notification_jobs jobs
     set status = 'skipped', skipped_at = now(),
         last_error_code = 'notification_no_longer_eligible'
    from public.notification_preferences preferences
   where jobs.user_id = preferences.user_id
     and jobs.status in ('pending', 'processing')
     and (p_user_id is null or jobs.user_id = p_user_id)
     and (
       not preferences.enabled
       or (jobs.notification_type = 'brushing_reminder' and not preferences.brushing_enabled)
       or (jobs.notification_type = 'flossing_reminder' and not preferences.flossing_enabled)
       or (jobs.notification_type = 'appointment_reminder' and not preferences.appointments_enabled)
     );
end;
$$;

create or replace function public.skip_invalid_pending_notifications(
  p_now timestamptz default now()
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.cancel_ineligible_notification_deliveries(null);

  update public.notification_jobs jobs
     set status = 'skipped', skipped_at = p_now,
         last_error_code = 'habit_already_completed'
    from public.user_stats stats
   where jobs.user_id = stats.user_id
     and jobs.status in ('pending', 'processing')
     and jobs.notification_type = 'brushing_reminder'
     and stats.last_brushing_date = public.business_date(p_now)
     and stats.brushings_on_last_date >= (jobs.payload ->> 'target_ordinal')::int;

  update public.notification_jobs jobs
     set status = 'skipped', skipped_at = p_now,
         last_error_code = 'habit_already_completed'
    from public.user_stats stats
   where jobs.user_id = stats.user_id
     and jobs.status in ('pending', 'processing')
     and jobs.notification_type = 'flossing_reminder'
     and stats.last_flossing_date = public.business_date(p_now)
     and stats.flossings_on_last_date >= (jobs.payload ->> 'target_ordinal')::int;

  update public.notification_jobs jobs
     set status = 'skipped', skipped_at = p_now,
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
     set status = 'skipped', leased_until = null, lease_token = null,
         last_error_code = jobs.last_error_code
    from public.notification_jobs jobs
   where deliveries.job_id = jobs.id
     and jobs.status = 'skipped'
     and deliveries.status in ('pending', 'processing');
end;
$$;

create function public.reconcile_notification_deliveries_from_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.cancel_ineligible_notification_deliveries(new.user_id);
  return new;
end;
$$;

create trigger notification_preferences_reconcile_deliveries
  after update of enabled, brushing_enabled, flossing_enabled, appointments_enabled
  on public.notification_preferences
  for each row execute function public.reconcile_notification_deliveries_from_change();

create trigger push_subscriptions_reconcile_deliveries
  after insert or update of user_id, is_active, expiration_time
  on public.push_subscriptions
  for each row execute function public.reconcile_notification_deliveries_from_change();

create or replace function public.cancel_stale_appointment_notification_jobs()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'UPDATE'
     and old.scheduled_at is not distinct from new.scheduled_at
     and old.status is not distinct from new.status then
    return new;
  end if;
  update public.notification_jobs
     set status = 'skipped', skipped_at = now(), last_error_code = 'appointment_changed'
   where appointment_id = coalesce(new.id, old.id)
     and status in ('pending', 'processing');
  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
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
  v_updated integer;
begin
  if v_user_id is null then raise exception 'Usuário não autenticado'; end if;
  update public.push_subscriptions
     set is_active = false, revoked_at = now()
   where user_id = v_user_id and endpoint = p_endpoint and is_active;
  get diagnostics v_updated = row_count;
  perform public.cancel_ineligible_notification_deliveries(v_user_id);
  return v_updated > 0;
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
  select * into v_delivery from public.notification_deliveries
   where id = p_delivery_id for update;
  if not found or v_delivery.status <> 'processing'
     or v_delivery.lease_token is distinct from p_lease_token then return; end if;
  v_attempts := v_delivery.attempt_count + 1;
  if p_outcome = 'sent' then
    update public.notification_deliveries set status = 'sent', attempt_count = v_attempts,
      sent_at = now(), leased_until = null, lease_token = null, last_error_code = null
    where id = p_delivery_id;
  elsif p_outcome = 'retry' and v_attempts < v_delivery.max_attempts then
    update public.notification_deliveries set status = 'pending', attempt_count = v_attempts,
      next_attempt_at = coalesce(p_retry_at, now() + interval '1 minute'),
      leased_until = null, lease_token = null, last_error_code = left(p_error_code, 100)
    where id = p_delivery_id;
  elsif p_outcome in ('revoked', 'dead', 'retry') then
    update public.notification_deliveries set status = 'dead', attempt_count = v_attempts,
      leased_until = null, lease_token = null,
      last_error_code = left(coalesce(p_error_code, p_outcome), 100)
    where id = p_delivery_id;
    if p_outcome = 'revoked' then
      update public.push_subscriptions set is_active = false, revoked_at = now()
       where id = v_delivery.subscription_id;
      perform public.cancel_ineligible_notification_deliveries(null);
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
           when jobs.status = 'skipped' then 'skipped'::public.notification_delivery_status
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

create index brushing_sessions_user_started_id_idx
  on public.brushing_sessions (user_id, started_at desc, id desc);
create index flossing_logs_user_logged_id_idx
  on public.flossing_logs (user_id, logged_at desc, id desc);
create index appointments_user_scheduled_id_idx
  on public.appointments (user_id, scheduled_at desc, id desc);

revoke all on function public.assert_idempotency_key(text, text) from public;
revoke all on function public.cancel_ineligible_notification_deliveries(uuid) from public;
revoke all on function public.create_brushing_session_v2(integer, text, text) from public;
revoke all on function public.create_flossing_log_v2(text, text, text) from public;
revoke all on function public.create_appointment_v2(
  timestamptz, public.appointment_type, text, text, text, text, text, text, text
) from public;
revoke all on function public.mark_brushing_zone_completed(uuid, text) from public;
revoke all on function public.complete_brushing_session(uuid) from public;
revoke all on function public.update_appointment_v2(
  uuid, bigint, timestamptz, public.appointment_type, text, text, text, text, text,
  public.appointment_status
) from public;
revoke all on function public.delete_appointment_v2(uuid) from public;
revoke all on function public.start_user_module_v2(uuid) from public;
revoke all on function public.complete_user_module_v2(uuid, integer) from public;
revoke all on function public.upsert_health_profile_v2(
  public.cardiac_condition, text, boolean, boolean, text[], text[], date, smallint,
  text, text, text
) from public;

grant execute on function public.create_brushing_session_v2(integer, text, text) to authenticated;
grant execute on function public.create_flossing_log_v2(text, text, text) to authenticated;
grant execute on function public.create_appointment_v2(
  timestamptz, public.appointment_type, text, text, text, text, text, text, text
) to authenticated;
grant execute on function public.mark_brushing_zone_completed(uuid, text) to authenticated;
grant execute on function public.complete_brushing_session(uuid) to authenticated;
grant execute on function public.update_appointment_v2(
  uuid, bigint, timestamptz, public.appointment_type, text, text, text, text, text,
  public.appointment_status
) to authenticated;
grant execute on function public.delete_appointment_v2(uuid) to authenticated;
grant execute on function public.start_user_module_v2(uuid) to authenticated;
grant execute on function public.complete_user_module_v2(uuid, integer) to authenticated;
grant execute on function public.upsert_health_profile_v2(
  public.cardiac_condition, text, boolean, boolean, text[], text[], date, smallint,
  text, text, text
) to authenticated;

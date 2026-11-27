-- =============================================================================
-- OralCardio — 030: otimização do pg_cron para reduzir Egress e Log Ingestion
-- Depende de 014_notification_cron.sql, 018_backend_integrity.sql e
-- 029_harden_function_execute_privileges.sql.
--
-- Problema corrigido:
--   1. O job `oralcardio-notification-dispatch` executava a cada minuto
--      (`* * * * *`) e disparava `net.http_post` mesmo sem trabalho pendente,
--      gerando ~43.200 ticks/mês no pg_cron e ~86.400 chamadas PostgREST/mês.
--   2. Quando o backend estava ocioso ou fora do ar, o cron continuava
--      mantendo a instância acordada ou acumulando logs de erro no pg_net.
--
-- Solução:
--   - Verifica em SQL (com índices parciais) se há entrega, lembrete vencido
--     ou avaliação de conquista pendente antes de ler o Vault ou chamar HTTP.
--   - Espaça o agendamento para cada 5 minutos (`*/5 * * * *`).
--   - Reduz retenção de `cron.job_run_details` para 7 dias.
-- =============================================================================

create or replace function public.has_pending_background_dispatch_work(
  p_now timestamptz default now()
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    -- 1. Avaliações de conquista pendentes na outbox
    exists (
      select 1
        from public.achievement_evaluation_requests requests
       where requests.processed_version < requests.requested_version
         and requests.dead_at is null
         and requests.next_attempt_at <= p_now
         and (requests.leased_until is null or requests.leased_until <= p_now)
    )
    -- 2. Entregas Web Push já enfileiradas e prontas para tentativa/re-lease
    or exists (
      select 1
        from public.notification_deliveries deliveries
       where deliveries.status in ('pending', 'processing')
         and deliveries.next_attempt_at <= p_now
         and (deliveries.leased_until is null or deliveries.leased_until <= p_now)
    )
    -- 3. Jobs de notificação vencidos (ex.: teste ou lembrete ainda sem delivery)
    or exists (
      select 1
        from public.notification_jobs jobs
       where jobs.status in ('pending', 'processing')
         and jobs.scheduled_for <= p_now
    )
    -- 4. Lembretes de hábito vencidos para usuários com subscription ativa
    or exists (
      select 1
        from public.habit_notification_schedules schedules
        join public.notification_preferences preferences using (user_id)
       where schedules.enabled
         and schedules.next_due_at <= p_now
         and (schedules.next_due_at at time zone 'America/Sao_Paulo')::date
             = public.business_date(p_now)
         and preferences.enabled
         and case schedules.habit_type
           when 'brushing' then preferences.brushing_enabled
           else preferences.flossing_enabled
         end
         and exists (
           select 1
             from public.push_subscriptions subscriptions
            where subscriptions.user_id = schedules.user_id
              and subscriptions.is_active
              and (subscriptions.expiration_time is null or subscriptions.expiration_time > p_now)
         )
    )
    -- 5. Lembretes de consultas vencidos ainda não enfileirados para usuários com push ativo
    or exists (
      select 1
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
         and exists (
           select 1
             from public.push_subscriptions subscriptions
            where subscriptions.user_id = appointments.user_id
              and subscriptions.is_active
              and (subscriptions.expiration_time is null or subscriptions.expiration_time > p_now)
         )
         and not exists (
           select 1
             from public.notification_jobs jobs
            where jobs.deduplication_key = concat(
              'appointment:', appointments.id, ':',
              extract(epoch from appointments.scheduled_at)::bigint, ':', lead.minutes
            )
         )
    );
$$;

create or replace function public.notification_cron_tick()
returns bigint
language plpgsql
security definer
set search_path = public, vault, extensions
as $$
declare
  v_base_url text;
  v_token text;
  v_request_id bigint;
begin
  -- Evita abrir conexão HTTP e acordar a API quando não há nada para despachar.
  if not public.has_pending_background_dispatch_work(now()) then
    return null;
  end if;

  select decrypted_secret into v_base_url
    from vault.decrypted_secrets where name = 'notification_dispatch_url';
  select decrypted_secret into v_token
    from vault.decrypted_secrets where name = 'notification_dispatch_token';

  if nullif(v_base_url, '') is null or nullif(v_token, '') is null then
    return null;
  end if;

  select net.http_post(
    url := rtrim(v_base_url, '/') || '/internal/v1/notifications/dispatch',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'X-Notification-Dispatch-Token', v_token
    ),
    body := '{}'::jsonb,
    timeout_milliseconds := 10000
  ) into v_request_id;
  return v_request_id;
end;
$$;

create or replace function public.cleanup_notification_history()
returns void
language plpgsql
security definer
set search_path = public, cron
as $$
begin
  delete from public.notification_jobs
   where status in ('sent', 'skipped') and updated_at < now() - interval '90 days';
  delete from public.notification_jobs
   where status = 'dead' and updated_at < now() - interval '180 days';
  delete from cron.job_run_details where end_time < now() - interval '7 days';
end;
$$;

-- Reagenda o dispatcher de 1 em 1 minuto para 5 em 5 minutos de forma idempotente.
do $$
declare
  v_job_id bigint;
begin
  for v_job_id in
    select jobid from cron.job where jobname = 'oralcardio-notification-dispatch'
  loop
    perform cron.unschedule(v_job_id);
  end loop;
end;
$$;

select cron.schedule(
  'oralcardio-notification-dispatch',
  '*/5 * * * *',
  'select public.notification_cron_tick();'
);

revoke execute on function public.has_pending_background_dispatch_work(timestamptz)
  from public, anon, authenticated;
revoke execute on function public.notification_cron_tick()
  from public, anon, authenticated;
revoke execute on function public.cleanup_notification_history()
  from public, anon, authenticated;

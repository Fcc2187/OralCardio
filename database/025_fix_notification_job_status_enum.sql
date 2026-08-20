-- =============================================================================
-- OralCardio — 025: corrige o tipo do status ao enfileirar lembretes de hábitos
-- Depende de 024_fix_push_revocation_digest_search_path.sql.
--
-- Um CASE composto apenas por literais textuais é resolvido pelo PostgreSQL
-- como text. A função anterior tentava inserir esse resultado diretamente no
-- enum notification_delivery_status e falhava com 42804 quando um horário de
-- hábito ficava vencido.
-- =============================================================================

create or replace function public.enqueue_due_notification_jobs(
  p_now timestamptz default now()
)
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
       and stats.brushings_on_last_date >= schedules.target_ordinal
        then 'skipped'::public.notification_delivery_status
      when schedules.habit_type = 'flossing'
       and stats.last_flossing_date = public.business_date(p_now)
       and stats.flossings_on_last_date >= schedules.target_ordinal
        then 'skipped'::public.notification_delivery_status
      else 'pending'::public.notification_delivery_status
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
      when (
        schedules.habit_type = 'brushing'
        and stats.last_brushing_date = public.business_date(p_now)
        and stats.brushings_on_last_date >= schedules.target_ordinal
      ) or (
        schedules.habit_type = 'flossing'
        and stats.last_flossing_date = public.business_date(p_now)
        and stats.flossings_on_last_date >= schedules.target_ordinal
      ) then p_now
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
     set next_due_at = public.notification_next_occurrence(
       schedules.local_time,
       p_now
     )
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
        when lead.minutes >= 1440
          then 'Você tem uma consulta odontológica se aproximando.'
        else 'Sua consulta odontológica será em breve.'
      end,
      'url', concat('/agenda/', appointments.id)
    )
  from public.appointments appointments
  join public.notification_preferences preferences using (user_id)
  cross join lateral unnest(
    preferences.appointment_lead_minutes
  ) as lead(minutes)
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

revoke all on function public.enqueue_due_notification_jobs(timestamptz)
  from public;


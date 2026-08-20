-- =============================================================================
-- OralCardio — 023: corrige reconciliação de entregas ao alterar preferências
-- Depende de 018_backend_integrity.sql.
--
-- PostgreSQL não permite que o alias da tabela-alvo de UPDATE seja referenciado
-- no ON de um JOIN em FROM. A migration 018 fazia isso ao relacionar a
-- subscription, causando 42P01 sempre que o trigger de preferências era chamado.
-- =============================================================================

create or replace function public.cancel_ineligible_notification_deliveries(
  p_user_id uuid default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.notification_deliveries deliveries
     set status = 'skipped',
         leased_until = null,
         lease_token = null,
         last_error_code = 'notification_no_longer_eligible'
    from public.notification_jobs jobs
    left join public.notification_preferences preferences
      on preferences.user_id = jobs.user_id
   where deliveries.job_id = jobs.id
     and deliveries.status in ('pending', 'processing')
     and (p_user_id is null or jobs.user_id = p_user_id)
     and (
       not exists (
         select 1
           from public.push_subscriptions subscriptions
          where subscriptions.id = deliveries.subscription_id
            and subscriptions.is_active
            and (
              subscriptions.expiration_time is null
              or subscriptions.expiration_time > now()
            )
       )
       or preferences.id is null
       or not preferences.enabled
       or (
         jobs.notification_type = 'brushing_reminder'
         and not preferences.brushing_enabled
       )
       or (
         jobs.notification_type = 'flossing_reminder'
         and not preferences.flossing_enabled
       )
       or (
         jobs.notification_type = 'appointment_reminder'
         and not preferences.appointments_enabled
       )
     );

  update public.notification_jobs jobs
     set status = 'skipped',
         skipped_at = now(),
         last_error_code = 'notification_no_longer_eligible'
    from public.notification_preferences preferences
   where jobs.user_id = preferences.user_id
     and jobs.status in ('pending', 'processing')
     and (p_user_id is null or jobs.user_id = p_user_id)
     and (
       not preferences.enabled
       or (
         jobs.notification_type = 'brushing_reminder'
         and not preferences.brushing_enabled
       )
       or (
         jobs.notification_type = 'flossing_reminder'
         and not preferences.flossing_enabled
       )
       or (
         jobs.notification_type = 'appointment_reminder'
         and not preferences.appointments_enabled
       )
     );
end;
$$;

revoke all on function public.cancel_ineligible_notification_deliveries(uuid)
  from public;

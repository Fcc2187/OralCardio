-- =============================================================================
-- OralCardio — 014: agendamento seguro do dispatcher
-- Depende de 013_notification_outbox.sql.
--
-- O job nasce inerte. Para ativá-lo, crie no Supabase Vault:
--   notification_dispatch_url   = URL pública do backend, sem barra final
--   notification_dispatch_token = segredo aleatório do dispatcher
-- =============================================================================

create extension if not exists pg_cron with schema pg_catalog;
create extension if not exists pg_net with schema extensions;

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
  delete from cron.job_run_details where end_time < now() - interval '30 days';
end;
$$;

select cron.schedule(
  'oralcardio-notification-dispatch',
  '* * * * *',
  'select public.notification_cron_tick();'
);

select cron.schedule(
  'oralcardio-notification-cleanup',
  '23 3 * * *',
  'select public.cleanup_notification_history();'
);

revoke all on function public.notification_cron_tick() from public;
revoke all on function public.cleanup_notification_history() from public;


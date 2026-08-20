-- =============================================================================
-- OralCardio — 026: elimina ambiguidade ao reivindicar entregas de Push
-- Depende de 025_fix_notification_job_status_enum.sql.
--
-- claim_due_notification_deliveries retorna uma coluna chamada job_id. Dentro
-- de PL/pgSQL, o antigo ON CONFLICT (job_id, subscription_id) podia resolver
-- job_id tanto como parâmetro de saída quanto como coluna da tabela (42702).
-- Referenciar a constraint única pelo nome remove a ambiguidade.
-- =============================================================================

create or replace function public.claim_due_notification_deliveries(
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
  if p_batch_size not between 1 and 500
     or p_lease_seconds not between 30 and 900 then
    raise exception 'Parâmetros do dispatcher inválidos';
  end if;

  perform public.enqueue_due_notification_jobs(p_now);
  perform public.skip_invalid_pending_notifications(p_now);

  update public.notification_deliveries deliveries
     set status = 'pending',
         leased_until = null,
         lease_token = null
   where deliveries.status = 'processing'
     and deliveries.leased_until <= p_now;

  insert into public.notification_deliveries (
    job_id,
    subscription_id,
    next_attempt_at
  )
  select jobs.id, subscriptions.id, p_now
    from public.notification_jobs jobs
    join public.push_subscriptions subscriptions
      on subscriptions.user_id = jobs.user_id
     and subscriptions.is_active
     and (
       subscriptions.expiration_time is null
       or subscriptions.expiration_time > p_now
     )
   where jobs.status in ('pending', 'processing')
     and jobs.scheduled_for <= p_now
  on conflict on constraint notification_deliveries_unique_device do nothing;

  update public.notification_jobs jobs
     set status = 'skipped',
         skipped_at = p_now,
         last_error_code = 'no_active_subscription'
   where jobs.status = 'pending'
     and jobs.scheduled_for <= p_now
     and not exists (
       select 1
         from public.push_subscriptions subscriptions
        where subscriptions.user_id = jobs.user_id
          and subscriptions.is_active
          and (
            subscriptions.expiration_time is null
            or subscriptions.expiration_time > p_now
          )
     );

  return query
  with candidates as (
    select deliveries.id
      from public.notification_deliveries deliveries
      join public.notification_jobs jobs
        on jobs.id = deliveries.job_id
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
     where jobs.id in (
       select claimed.job_id
         from claimed
     )
    returning jobs.id
  )
  select claimed.id,
         jobs.id,
         jobs.notification_type,
         subscriptions.endpoint,
         subscriptions.p256dh,
         subscriptions.auth_secret,
         jobs.payload || jsonb_build_object(
           'tag',
           concat('oralcardio-', jobs.id)
         ),
         claimed.attempt_count,
         claimed.lease_token
    from claimed
    join public.notification_jobs jobs
      on jobs.id = claimed.job_id
    join public.push_subscriptions subscriptions
      on subscriptions.id = claimed.subscription_id
     and subscriptions.user_id = jobs.user_id;
end;
$$;

revoke all on function public.claim_due_notification_deliveries(
  integer,
  integer,
  timestamptz
) from public;

grant execute on function public.claim_due_notification_deliveries(
  integer,
  integer,
  timestamptz
) to service_role;


-- =============================================================================
-- OralCardio — 021: revogação durável de Web Push após logout offline
--
-- Uma capability aleatória, armazenada somente como hash, autoriza apenas a
-- revogação de uma subscription. Ela não concede leitura, criação ou envio de
-- notificações. Assim a PWA pode concluir uma revogação pendente depois que o
-- JWT da sessão anterior já foi removido.
-- =============================================================================

alter table public.push_subscriptions
  add column revocation_token_hash bytea;

create function public.upsert_push_subscription(
  p_endpoint text,
  p_p256dh text,
  p_auth_secret text,
  p_expiration_time timestamptz,
  p_device_label text,
  p_vapid_key_version smallint,
  p_revocation_token text
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
  if v_user_id is null then raise exception 'Usuário não autenticado'; end if;
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
  if p_vapid_key_version <= 0 then raise exception 'Versão da chave VAPID inválida'; end if;
  if p_revocation_token !~ '^[A-Za-z0-9_-]{43,128}$' then
    raise exception 'Token de revogação inválido';
  end if;

  insert into public.push_subscriptions (
    user_id, endpoint, p256dh, auth_secret, expiration_time, device_label,
    vapid_key_version, is_active, last_seen_at, revoked_at, revocation_token_hash
  ) values (
    v_user_id, p_endpoint, p_p256dh, p_auth_secret, p_expiration_time, p_device_label,
    p_vapid_key_version, true, now(), null, digest(p_revocation_token, 'sha256')
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
        revoked_at = null,
        revocation_token_hash = excluded.revocation_token_hash
  returning id into v_subscription_id;

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

create function public.revoke_push_subscription_with_token(
  p_endpoint text,
  p_revocation_token text
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_updated integer;
begin
  if octet_length(p_endpoint) not between 1 and 4096
     or p_revocation_token !~ '^[A-Za-z0-9_-]{43,128}$' then
    return false;
  end if;

  update public.push_subscriptions
     set is_active = false, revoked_at = now()
   where endpoint = p_endpoint
     and revocation_token_hash = digest(p_revocation_token, 'sha256')
     and is_active;
  get diagnostics v_updated = row_count;
  if v_updated > 0 then
    perform public.cancel_ineligible_notification_deliveries(null);
  end if;
  return v_updated > 0;
end;
$$;

revoke all on function public.upsert_push_subscription(
  text, text, text, timestamptz, text, smallint, text
) from public;
revoke all on function public.revoke_push_subscription_with_token(text, text) from public;
grant execute on function public.upsert_push_subscription(
  text, text, text, timestamptz, text, smallint, text
) to authenticated;
grant execute on function public.revoke_push_subscription_with_token(text, text) to service_role;

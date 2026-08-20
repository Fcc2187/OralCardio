-- =============================================================================
-- OralCardio — 024: disponibiliza pgcrypto às RPCs de revogação Web Push
-- Depende de 021_push_revocation_tokens.sql.
--
-- No Supabase, pgcrypto é instalado no schema `extensions`. As RPCs da 021
-- usam digest() e restringiam o search_path a `public`, causando 42883 ao
-- registrar ou revogar uma subscription.
-- =============================================================================

do $$
begin
  if to_regprocedure('extensions.digest(text,text)') is null then
    raise exception 'A função extensions.digest(text,text) do pgcrypto não está disponível';
  end if;
end;
$$;

alter function public.upsert_push_subscription(
  text, text, text, timestamptz, text, smallint, text
) set search_path = public, extensions;

alter function public.revoke_push_subscription_with_token(text, text)
  set search_path = public, extensions;

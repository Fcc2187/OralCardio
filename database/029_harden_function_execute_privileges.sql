-- OralCardio — 029: menor privilégio para funções internas e RPCs do backend
--
-- O Supabase concede EXECUTE em novas funções públicas a anon e authenticated
-- por padrão. As migrations anteriores revogavam PUBLIC, mas esses grants
-- diretos permaneciam ativos.

alter default privileges for role postgres
  revoke execute on functions from public;
alter default privileges for role postgres in schema public
  revoke execute on functions from anon, authenticated, service_role;

revoke execute on function public.add_user_points(uuid, integer)
  from public, anon, authenticated;
revoke execute on function public.create_default_notification_settings(uuid)
  from public, anon, authenticated;
revoke execute on function public.handle_new_notification_user()
  from public, anon, authenticated;
revoke execute on function public.enqueue_due_notification_jobs(timestamptz)
  from public, anon, authenticated;
revoke execute on function public.skip_invalid_pending_notifications(timestamptz)
  from public, anon, authenticated;
revoke execute on function public.cancel_stale_appointment_notification_jobs()
  from public, anon, authenticated;
revoke execute on function public.notification_cron_tick()
  from public, anon, authenticated;
revoke execute on function public.cleanup_notification_history()
  from public, anon, authenticated;
revoke execute on function public.request_achievement_evaluation(uuid)
  from public, anon, authenticated;
revoke execute on function public.enqueue_achievement_evaluation_from_change()
  from public, anon, authenticated;
revoke execute on function public.unlock_achievement_for_user(uuid, uuid)
  from public, anon, authenticated;
revoke execute on function public.claim_achievement_evaluations(integer, integer, timestamptz)
  from public, anon, authenticated;
revoke execute on function public.complete_achievement_evaluation(
  uuid, bigint, uuid, boolean, timestamptz, text
) from public, anon, authenticated;
revoke execute on function public.claim_due_notification_deliveries(
  integer, integer, timestamptz
) from public, anon, authenticated;
revoke execute on function public.complete_notification_delivery(
  uuid, uuid, text, text, timestamptz
) from public, anon, authenticated;
revoke execute on function public.decode_base64url_or_null(text)
  from public, anon, authenticated;
revoke execute on function public.assert_idempotency_key(text, text)
  from public, anon, authenticated;
revoke execute on function public.cancel_ineligible_notification_deliveries(uuid)
  from public, anon, authenticated;
revoke execute on function public.revoke_push_subscription_with_token(text, text)
  from public, anon, authenticated;

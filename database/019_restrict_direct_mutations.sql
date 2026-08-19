-- =============================================================================
-- OralCardio — 019: revogar DML direto após o rollout de 018.
-- Depende de 018_backend_integrity.sql e do backend que chama as RPCs v2.
-- =============================================================================

revoke insert, update, delete on public.brushing_sessions from authenticated;
revoke insert, update, delete on public.flossing_logs from authenticated;
revoke insert, update, delete on public.user_module_progress from authenticated;
revoke insert, update, delete on public.appointments from authenticated;
revoke insert, update, delete on public.health_profiles from authenticated;

-- Leituras continuam protegidas pelas políticas RLS de proprietário. As RPCs
-- SECURITY DEFINER de 016/018 verificam auth.uid() antes de escrever.

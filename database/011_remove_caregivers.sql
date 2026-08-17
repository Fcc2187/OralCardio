-- =============================================================================
-- CardioCare Connect — 011: Remoção integral do modo cuidador
-- ATENÇÃO: esta migração exclui permanentemente os vínculos de cuidadores.
-- Faça backup do projeto Supabase antes de aplicá-la.
-- =============================================================================

drop policy if exists user_stats_select_caregiver on public.user_stats;
drop policy if exists brushing_sessions_select_caregiver on public.brushing_sessions;
drop policy if exists flossing_logs_select_caregiver on public.flossing_logs;
drop policy if exists appointments_select_caregiver on public.appointments;
drop policy if exists users_select_caregiver on public.users;

drop function if exists public.accept_caregiver_invitation(uuid);
drop function if exists public.list_pending_caregiver_invitations();
drop function if exists public.is_active_caregiver(uuid, text);

drop table if exists public.caregivers;
drop type if exists caregiver_status;

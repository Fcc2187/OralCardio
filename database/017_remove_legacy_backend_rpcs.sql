-- =============================================================================
-- OralCardio — 017: remoção dos contratos legados após rollout do backend
-- Depende de 016_backend_hardening.sql e da nova versão do backend já publicada.
-- =============================================================================

-- Permitiria que um cliente autenticado escolhesse uma conquista ativa sem que
-- o worker privilegiado tivesse validado sua condição.
drop function public.unlock_achievement(uuid);

-- Não possuía token de fencing e poderia aceitar a conclusão de um worker cujo
-- lease já expirou e foi adquirido por outro processo.
drop function public.complete_notification_delivery(uuid, text, text, timestamptz);

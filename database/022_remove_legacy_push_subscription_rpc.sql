-- =============================================================================
-- OralCardio — 022: encerra o RPC legado sem capability de revogação
--
-- Aplicar somente depois de publicar backend e frontend compatíveis com 021.
-- O overload de seis parâmetros permanece no banco apenas para permitir o
-- rollout sem interrupção; ao final, ninguém autenticado pode mais chamá-lo.
-- =============================================================================

revoke all on function public.upsert_push_subscription(
  text, text, text, timestamptz, text, smallint
) from authenticated;

-- =============================================================================
-- OralCardio — 015: remove o booleano legado de lembrete de consulta
-- Aplicar somente junto do backend/frontend da fase 4.
-- =============================================================================

alter table public.appointments drop column if exists reminder_sent;


-- =============================================================================
-- CardioCare Connect — 008: Normalização de e-mail em `caregivers`
-- Depende de 001-007.
--
-- Hoje três caminhos discordam sobre maiúsculas/espaços em caregiver_email:
-- a constraint única `caregivers_unique_invite` é case-sensitive (coluna
-- `text` puro, sem `citext`), mas o guard de auto-convite (CaregiverService)
-- e as duas RPCs de 007 comparam com `lower()`. Consequência real: o
-- paciente pode convidar "Joao@x.com" e depois "joao@x.com" — ambos ficam
-- pendentes, o cuidador aceita um e o outro vira órfão permanente, sem
-- jamais colidir com a constraint.
--
-- Esta migração deduplica o histórico (mantendo o vínculo mais recente por
-- e-mail normalizado), normaliza todas as linhas para lower(trim(...)), e
-- substitui a constraint por um índice único funcional equivalente. O
-- índice funcional continua levantando o SQLSTATE 23505 em conflito, então
-- a tradução existente em `SupabaseRepository._run` segue válida sem
-- mudança nenhuma.
-- =============================================================================

-- Deduplicar antes de normalizar: para cada paciente + e-mail (já
-- normalizado), mantém apenas o vínculo com o `invited_at` mais recente.
delete from public.caregivers c
 using public.caregivers keep
 where c.patient_id = keep.patient_id
   and lower(trim(c.caregiver_email)) = lower(trim(keep.caregiver_email))
   and (
     c.invited_at < keep.invited_at
     or (c.invited_at = keep.invited_at and c.id < keep.id)
   );

update public.caregivers
   set caregiver_email = lower(trim(caregiver_email))
 where caregiver_email <> lower(trim(caregiver_email));

alter table public.caregivers drop constraint caregivers_unique_invite;

create unique index caregivers_unique_invite
  on public.caregivers (patient_id, lower(caregiver_email));

# Banco de Dados — OralCardio

Scripts SQL para o projeto Supabase (PostgreSQL 15+). Aplique no **SQL Editor** do
Supabase (ou via `supabase db push` / CLI) **nesta ordem**:

1. `001_extensions_and_enums.sql` — extensões e tipos ENUM usados pelas tabelas.
2. `002_schema.sql` — schema-base histórico, com PKs, FKs, constraints e índices.
3. `003_triggers.sql` — funções e triggers automáticas (`handle_new_user`,
   `handle_updated_at`, `handle_new_brushing_session`).
4. `004_rls_policies.sql` — habilita Row Level Security e cria as políticas de
   acesso (cada usuário só acessa os próprios dados; catálogos são de leitura
   pública autenticada).
5. `005_seed.sql` — dados de configuração: as 10 conquistas e os 6 módulos
   educacionais base. Idempotente (`on conflict do nothing`), pode ser
   reexecutado.
6. `006_gamification_rpc.sql` — extrai `calculate_level()` (reaproveitada pela
   trigger de escovação), adiciona o trigger de `flossing_logs` (que faltava)
   e cria a função `unlock_achievement()` — a única forma de o backend
   registrar o desbloqueio de uma conquista, já que `user_stats` e
   `user_achievements` são somente-leitura para o usuário via RLS.
7. `007_caregiver_access.sql` — migração histórica do antigo modo cuidador.
8. `008_caregiver_email_normalization.sql` — migração histórica de normalização
   dos convites do antigo modo cuidador.
9. `009_habit_scoring.sql` — centraliza o calendário de negócio em
   `America/Sao_Paulo`, torna a pontuação de escovação e fio dental ilimitada,
   adiciona contadores diários e reconcilia os dados históricos uma única vez.
10. `010_delayed_achievement_reveals.sql` — concede o bônus de conquistas no
    desbloqueio, agenda sua visibilidade para o dia seguinte e cria as RPCs
    idempotentes de claim/acknowledge com lease.
11. `011_remove_caregivers.sql` — remove definitivamente políticas, funções,
    dados, tabela e enum do antigo modo cuidador.
12. `012_notifications_core.sql` — cria preferências, horários de hábitos e
    subscriptions Web Push com RLS e RPCs autenticadas.
13. `013_notification_outbox.sql` — adiciona outbox, entregas por dispositivo,
    supressão, leases, retry e invalidação em reagendamentos.
14. `014_notification_cron.sql` — agenda o dispatcher e a retenção via
    `pg_cron`/`pg_net`; permanece inerte enquanto os segredos não existirem no Vault.
15. `015_remove_appointment_reminder_flag.sql` — remove o booleano legado
    `appointments.reminder_sent`, substituído pela outbox auditável.
16. `016_backend_hardening.sql` — adiciona idempotência às mutações de criação,
    outbox transacional de avaliação de conquistas, valida subscriptions Web
    Push e protege a conclusão de deliveries com token de lease.
17. `017_remove_legacy_backend_rpcs.sql` — remove, após o rollout do backend,
    os RPCs antigos de conquistas e deliveries que não possuíam validação
    privilegiada ou token de fencing.

> Faça backup do projeto Supabase antes de aplicar a `011`; os vínculos
> excluídos só poderão ser recuperados a partir desse backup.

## Ordem de rollout em produção

1. Criar e validar o backup.
2. Aplicar as migrações aditivas `009` e `010`.
3. Publicar backend e frontend de forma coordenada.
4. Aplicar a migração destrutiva `011` somente após retirar o código antigo.
5. Na fase 4, aplicar `012` e `013`, publicar backend/frontend, aplicar `014`
   e somente então executar `015`.
6. Aplicar `016`, publicar todas as instâncias do backend endurecido e, depois
   de drenar instâncias antigas e execuções do Cron, aplicar `017`.

## Notas

- As migrações são sequenciais e imutáveis. Os arquivos `007` e `008`
  permanecem no histórico; o estado final do schema é definido pela `011`.
- Todas as tabelas de paciente usam RLS para permitir acesso somente ao próprio
  usuário. Catálogos permanecem disponíveis para leitura autenticada.
- Após rodar os scripts, copie a **Project URL** e a **publishable key** do painel do
  Supabase (Settings → API) para os arquivos `backend/.env` e `frontend/.env`
  (veja os respectivos `.env.example`).
- O teste transacional do estado final está documentado em
  [`tests/README.md`](tests/README.md).

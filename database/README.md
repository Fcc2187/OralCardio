# Banco de Dados — CardioCare Connect

Scripts SQL para o projeto Supabase (PostgreSQL 15+). Aplique no **SQL Editor** do
Supabase (ou via `supabase db push` / CLI) **nesta ordem**:

1. `001_extensions_and_enums.sql` — extensões e tipos ENUM usados pelas tabelas.
2. `002_schema.sql` — as 11 tabelas do domínio, com PKs, FKs, constraints e índices.
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
7. `007_caregiver_access.sql` — políticas de RLS que liberam **SELECT** ao
   cuidador (via `is_active_caregiver()`) sobre os dados do paciente que ele
   acompanha, respeitando as permissões granulares (`can_view_reports` /
   `can_view_appointments`); e as funções `list_pending_caregiver_invitations()`
   / `accept_caregiver_invitation()` que resolvem o fluxo de aceite de convite
   (o RLS padrão de `caregivers` não deixa o cuidador ver o próprio convite
   pendente antes de aceitá-lo).

## Notas

- O acesso de **cuidadores** aos dados do paciente é garantido inteiramente
  por **RLS** (`007_caregiver_access.sql`), não pela `service_role` no
  FastAPI — ver seção 6 da documentação técnica. O backend nunca usa a
  `service_role` para ler dado de paciente; sempre opera com o JWT de quem
  está autenticado, seja paciente ou cuidador.
- Após rodar os scripts, copie a **Project URL**, a **anon key** e a
  **service_role key** do painel do Supabase (Settings → API) para os arquivos
  `backend/.env` e `frontend/.env` (veja os respectivos `.env.example`).
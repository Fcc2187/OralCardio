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

## Notas

- O acesso de **cuidadores** a `brushing_sessions`, `flossing_logs`,
  `appointments` e `user_stats` **não** é feito via RLS direto — o backend
  FastAPI usa a `service_role` key e valida as permissões granulares da tabela
  `caregivers` antes de expor esses dados (ver seção 6 da documentação técnica).
- Após rodar os scripts, copie a **Project URL**, a **anon key** e a
  **service_role key** do painel do Supabase (Settings → API) para os arquivos
  `backend/.env` e `frontend/.env` (veja os respectivos `.env.example`).
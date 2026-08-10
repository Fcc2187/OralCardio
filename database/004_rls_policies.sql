-- =============================================================================
-- CardioCare Connect — 004: Row Level Security
-- Depende de 002_schema.sql. Ver seção 6 da documentação técnica para a matriz
-- de acesso. Acesso de cuidadores a brushing_sessions/flossing_logs/appointments
-- é mediado pelo FastAPI (service role), não por RLS direto.
-- =============================================================================

alter table public.users enable row level security;
alter table public.health_profiles enable row level security;
alter table public.brushing_sessions enable row level security;
alter table public.flossing_logs enable row level security;
alter table public.education_modules enable row level security;
alter table public.user_module_progress enable row level security;
alter table public.appointments enable row level security;
alter table public.caregivers enable row level security;
alter table public.achievements enable row level security;
alter table public.user_achievements enable row level security;
alter table public.user_stats enable row level security;

-- -----------------------------------------------------------------------------
-- users: dono pode ver e atualizar o próprio registro
-- -----------------------------------------------------------------------------
create policy users_select_own on public.users
  for select using (id = auth.uid());

create policy users_update_own on public.users
  for update using (id = auth.uid());

-- -----------------------------------------------------------------------------
-- health_profiles: dono tem acesso total ao próprio perfil
-- -----------------------------------------------------------------------------
create policy health_profiles_all_own on public.health_profiles
  for all using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- -----------------------------------------------------------------------------
-- brushing_sessions: dono tem acesso total às próprias sessões
-- -----------------------------------------------------------------------------
create policy brushing_sessions_all_own on public.brushing_sessions
  for all using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- -----------------------------------------------------------------------------
-- flossing_logs: dono tem acesso total aos próprios registros
-- -----------------------------------------------------------------------------
create policy flossing_logs_all_own on public.flossing_logs
  for all using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- -----------------------------------------------------------------------------
-- education_modules: leitura pública para qualquer usuário autenticado
-- -----------------------------------------------------------------------------
create policy education_modules_select_authenticated on public.education_modules
  for select to authenticated
  using (is_active = true);

-- -----------------------------------------------------------------------------
-- user_module_progress: dono tem acesso total ao próprio progresso
-- -----------------------------------------------------------------------------
create policy user_module_progress_all_own on public.user_module_progress
  for all using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- -----------------------------------------------------------------------------
-- appointments: dono tem acesso total às próprias consultas
-- -----------------------------------------------------------------------------
create policy appointments_all_own on public.appointments
  for all using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- -----------------------------------------------------------------------------
-- caregivers: paciente tem acesso total sobre seus vínculos; cuidador só
-- visualiza os vínculos em que ele é o cuidador
-- -----------------------------------------------------------------------------
create policy caregivers_all_as_patient on public.caregivers
  for all using (patient_id = auth.uid())
  with check (patient_id = auth.uid());

create policy caregivers_select_as_caregiver on public.caregivers
  for select using (caregiver_user_id = auth.uid());

-- -----------------------------------------------------------------------------
-- achievements: leitura pública para qualquer usuário autenticado
-- -----------------------------------------------------------------------------
create policy achievements_select_authenticated on public.achievements
  for select to authenticated
  using (is_active = true);

-- -----------------------------------------------------------------------------
-- user_achievements: dono só visualiza as próprias conquistas desbloqueadas
-- -----------------------------------------------------------------------------
create policy user_achievements_select_own on public.user_achievements
  for select using (user_id = auth.uid());

-- -----------------------------------------------------------------------------
-- user_stats: dono só visualiza as próprias estatísticas (escrita via trigger)
-- -----------------------------------------------------------------------------
create policy user_stats_select_own on public.user_stats
  for select using (user_id = auth.uid());
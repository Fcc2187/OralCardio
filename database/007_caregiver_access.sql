-- =============================================================================
-- CardioCare Connect — 007: Acesso do Cuidador (RLS) + Fluxo de Convite
-- Depende de 001-006.
--
-- Decisão de arquitetura: o acesso de leitura do cuidador aos dados do
-- paciente é garantido por POLÍTICAS DE RLS, não mediado pela `service_role`
-- no FastAPI. O banco continua sendo a autoridade final de autorização — um
-- bug de validação em Python não expõe prontuário de paciente nenhum, e
-- revogar um cuidador corta o acesso instantaneamente, no próximo SELECT.
-- Isso diverge da seção 6 original da documentação técnica (que sugeria
-- mediar via FastAPI); a documentação foi atualizada para refletir esta
-- decisão mais segura.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- is_active_caregiver: checagem reutilizada por todas as políticas abaixo.
-- SECURITY DEFINER é necessário para consultar `caregivers` a partir de uma
-- política de OUTRA tabela sem esbarrar no próprio RLS de `caregivers`
-- (o que causaria recursão). `p_permission` é 'reports' ou 'appointments',
-- mapeando para can_view_reports / can_view_appointments.
-- -----------------------------------------------------------------------------
create or replace function public.is_active_caregiver(p_patient_id uuid, p_permission text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
      from public.caregivers
     where patient_id = p_patient_id
       and caregiver_user_id = auth.uid()
       and status = 'active'
       and (
         (p_permission = 'reports' and can_view_reports = true)
         or (p_permission = 'appointments' and can_view_appointments = true)
       )
  );
$$;

grant execute on function public.is_active_caregiver(uuid, text) to authenticated;

-- -----------------------------------------------------------------------------
-- Políticas de leitura para o cuidador — somente SELECT. Cuidadores nunca
-- ganham INSERT/UPDATE/DELETE sobre dado de paciente (seção 3.5 da doc).
-- -----------------------------------------------------------------------------
create policy user_stats_select_caregiver on public.user_stats
  for select using (public.is_active_caregiver(user_id, 'reports'));

create policy brushing_sessions_select_caregiver on public.brushing_sessions
  for select using (public.is_active_caregiver(user_id, 'reports'));

create policy flossing_logs_select_caregiver on public.flossing_logs
  for select using (public.is_active_caregiver(user_id, 'reports'));

create policy appointments_select_caregiver on public.appointments
  for select using (public.is_active_caregiver(user_id, 'appointments'));

create policy users_select_caregiver on public.users
  for select using (
    public.is_active_caregiver(id, 'reports')
    or public.is_active_caregiver(id, 'appointments')
  );

-- -----------------------------------------------------------------------------
-- Fluxo de convite: o RLS atual não deixa o cuidador ver ou aceitar o próprio
-- convite (caregiver_user_id ainda é NULL nesse momento). As duas RPCs abaixo
-- resolvem isso, exigindo e-mail confirmado no Supabase Auth como prova de
-- identidade — o cuidador precisa ter criado conta com o mesmo e-mail que o
-- paciente convidou.
-- -----------------------------------------------------------------------------
create or replace function public.list_pending_caregiver_invitations()
returns setof public.caregivers
language sql
stable
security definer
set search_path = public
as $$
  select c.*
    from public.caregivers c
    join auth.users u on lower(u.email) = lower(c.caregiver_email)
   where u.id = auth.uid()
     and u.email_confirmed_at is not null
     and c.status = 'pending';
$$;

grant execute on function public.list_pending_caregiver_invitations() to authenticated;

create or replace function public.accept_caregiver_invitation(p_invitation_id uuid)
returns public.caregivers
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_email text;
  v_email_confirmed timestamptz;
  v_result public.caregivers;
begin
  select email, email_confirmed_at into v_user_email, v_email_confirmed
    from auth.users
    where id = auth.uid();

  if v_user_email is null then
    raise exception 'Usuário não autenticado';
  end if;

  if v_email_confirmed is null then
    raise exception 'E-mail não confirmado';
  end if;

  update public.caregivers
     set status = 'active',
         accepted_at = now(),
         caregiver_user_id = auth.uid()
   where id = p_invitation_id
     and status = 'pending'
     and lower(caregiver_email) = lower(v_user_email)
   returning * into v_result;

  if v_result.id is null then
    raise exception 'Convite inválido, já utilizado, ou e-mail não corresponde';
  end if;

  return v_result;
end;
$$;

grant execute on function public.accept_caregiver_invitation(uuid) to authenticated;

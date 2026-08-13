-- =============================================================================
-- CardioCare Connect — 006: Gamificação (níveis, RPC de conquistas, fio dental)
-- Depende de 001-005. Corrige duas lacunas encontradas ao desenhar o backend:
--
-- 1. As políticas de RLS (004) deixam `user_stats` e `user_achievements`
--    somente-leitura para o usuário — corretamente, pois pontos e conquistas
--    não devem ser graváveis livremente pelo cliente. Só que isso significa
--    que o backend, operando com o JWT do paciente, não consegue registrar um
--    desbloqueio de conquista. `unlock_achievement()` resolve isso com uma
--    função SECURITY DEFINER que só opera sobre o próprio `auth.uid()`.
--
-- 2. Não existia trigger para `flossing_logs`: `user_stats.total_flossings`
--    nunca seria incrementado. `handle_new_flossing_log()` resolve isso.
--
-- Também extrai a tabela de níveis (antes inline em handle_new_brushing_session)
-- para `calculate_level()`, reaproveitada por essa trigger e pela nova RPC —
-- eliminando a duplicação da regra de progressão em dois lugares.
--
-- CONTRATO: `SupabaseRepository._run` (backend) traduz SQLSTATE P0001 em
-- `BusinessRuleViolationError` e repassa a mensagem de `raise exception`
-- **verbatim** ao cliente. Toda mensagem de erro nas funções abaixo deve
-- ser pt-BR apropriada para o paciente ler diretamente.
-- =============================================================================

create type level_info as (level smallint, name text);

create or replace function public.calculate_level(p_points int)
returns level_info
language sql
immutable
as $$
  select level, name
    from (values
      (1::smallint, 'Semente', 0),
      (2::smallint, 'Broto', 20),
      (3::smallint, 'Raiz', 50),
      (4::smallint, 'Flor', 100),
      (5::smallint, 'Fruto', 250),
      (6::smallint, 'Guardião do Coração', 500)
    ) as levels(level, name, min_points)
   where p_points >= min_points
   order by min_points desc
   limit 1;
$$;

-- -----------------------------------------------------------------------------
-- handle_new_brushing_session: reescrita para usar calculate_level()
-- -----------------------------------------------------------------------------
create or replace function public.handle_new_brushing_session()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_last_brushing_date date;
  v_current_streak smallint;
  v_longest_streak smallint;
  v_total_points int;
  v_level level_info;
begin
  if new.is_completed is not true then
    return new;
  end if;

  if tg_op = 'UPDATE' and old.is_completed is true then
    return new;
  end if;

  select last_brushing_date, current_streak_days, longest_streak_days, total_points
    into v_last_brushing_date, v_current_streak, v_longest_streak, v_total_points
    from public.user_stats
    where user_id = new.user_id
    for update;

  if v_last_brushing_date = current_date then
    return new;
  end if;

  if v_last_brushing_date = current_date - interval '1 day' then
    v_current_streak := v_current_streak + 1;
  else
    v_current_streak := 1;
  end if;

  v_longest_streak := greatest(v_longest_streak, v_current_streak);
  v_total_points := v_total_points + 5;
  v_level := public.calculate_level(v_total_points);

  update public.user_stats
     set total_brushings = total_brushings + 1,
         total_points = v_total_points,
         current_streak_days = v_current_streak,
         longest_streak_days = v_longest_streak,
         last_brushing_date = current_date,
         level = v_level.level,
         level_name = v_level.name
   where user_id = new.user_id;

  return new;
end;
$$;

-- -----------------------------------------------------------------------------
-- handle_new_flossing_log: mantém user_stats.total_flossings sincronizado
-- -----------------------------------------------------------------------------
create or replace function public.handle_new_flossing_log()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.user_stats
     set total_flossings = total_flossings + 1,
         last_flossing_date = current_date
   where user_id = new.user_id;

  return new;
end;
$$;

create trigger on_flossing_log_created
  after insert on public.flossing_logs
  for each row execute function public.handle_new_flossing_log();

-- -----------------------------------------------------------------------------
-- unlock_achievement: única forma de o backend registrar uma conquista.
-- SECURITY DEFINER + auth.uid() interno impede que alguém desbloqueie uma
-- conquista para outro usuário, mesmo com o RLS de user_achievements sendo
-- somente-leitura para o paciente.
-- -----------------------------------------------------------------------------
create or replace function public.unlock_achievement(p_achievement_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_points_reward smallint;
  v_new_total_points int;
  v_level level_info;
begin
  if v_user_id is null then
    raise exception 'Usuário não autenticado';
  end if;

  select points_reward into v_points_reward
    from public.achievements
    where id = p_achievement_id and is_active = true;

  if v_points_reward is null then
    raise exception 'Conquista inválida ou inativa';
  end if;

  insert into public.user_achievements (user_id, achievement_id)
  values (v_user_id, p_achievement_id)
  on conflict (user_id, achievement_id) do nothing;

  if not found then
    return; -- já estava desbloqueada: idempotente, não soma pontos de novo
  end if;

  update public.user_stats
     set total_points = total_points + v_points_reward
   where user_id = v_user_id
   returning total_points into v_new_total_points;

  v_level := public.calculate_level(v_new_total_points);

  update public.user_stats
     set level = v_level.level,
         level_name = v_level.name
   where user_id = v_user_id;
end;
$$;

grant execute on function public.unlock_achievement(uuid) to authenticated;

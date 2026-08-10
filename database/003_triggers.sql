-- =============================================================================
-- CardioCare Connect — 003: Triggers & Functions
-- Depende de 002_schema.sql
-- =============================================================================

-- -----------------------------------------------------------------------------
-- handle_new_user: cria public.users e public.user_stats ao registrar no auth
-- -----------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.users (id, full_name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    new.raw_user_meta_data ->> 'avatar_url'
  );

  insert into public.user_stats (user_id)
  values (new.id);

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- -----------------------------------------------------------------------------
-- handle_updated_at: mantém updated_at sincronizado
-- -----------------------------------------------------------------------------
create or replace function public.handle_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger set_updated_at
  before update on public.users
  for each row execute function public.handle_updated_at();

create trigger set_updated_at
  before update on public.health_profiles
  for each row execute function public.handle_updated_at();

create trigger set_updated_at
  before update on public.appointments
  for each row execute function public.handle_updated_at();

create trigger set_updated_at
  before update on public.user_stats
  for each row execute function public.handle_updated_at();

-- -----------------------------------------------------------------------------
-- handle_new_brushing_session: atualiza user_stats quando uma sessão é concluída
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
  v_new_level smallint;
  v_new_level_name text;
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

  -- Apenas 1 sessão concluída por dia conta para o streak/total.
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

  select level, name into v_new_level, v_new_level_name
    from (values
      (1, 'Semente', 0),
      (2, 'Broto', 20),
      (3, 'Raiz', 50),
      (4, 'Flor', 100),
      (5, 'Fruto', 250),
      (6, 'Guardião do Coração', 500)
    ) as levels(level, name, min_points)
    where v_total_points >= min_points
    order by min_points desc
    limit 1;

  update public.user_stats
     set total_brushings = total_brushings + 1,
         total_points = v_total_points,
         current_streak_days = v_current_streak,
         longest_streak_days = v_longest_streak,
         last_brushing_date = current_date,
         level = v_new_level,
         level_name = v_new_level_name
   where user_id = new.user_id;

  return new;
end;
$$;

create trigger on_brushing_session_completed
  after insert or update of is_completed on public.brushing_sessions
  for each row execute function public.handle_new_brushing_session();
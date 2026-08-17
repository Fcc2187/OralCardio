-- =============================================================================
-- CardioCare Connect — 009: Pontuação ilimitada de hábitos e calendário local
-- Depende de 001-008. A data de negócio é sempre America/Sao_Paulo.
-- =============================================================================

create or replace function public.business_date(p_instant timestamptz default now())
returns date
language sql
stable
as $$
  select (p_instant at time zone 'America/Sao_Paulo')::date;
$$;

create or replace function public.add_user_points(p_user_id uuid, p_points int)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_total_points int;
  v_level level_info;
begin
  if p_points < 0 then
    raise exception 'A pontuação adicionada não pode ser negativa';
  end if;

  update public.user_stats
     set total_points = total_points + p_points
   where user_id = p_user_id
   returning total_points into v_total_points;

  if v_total_points is null then
    raise exception 'Estatísticas do usuário não encontradas';
  end if;

  v_level := public.calculate_level(v_total_points);

  update public.user_stats
     set level = v_level.level,
         level_name = v_level.name
   where user_id = p_user_id;
end;
$$;

revoke all on function public.add_user_points(uuid, int) from public;
revoke all on function public.add_user_points(uuid, int) from authenticated;

alter table public.user_stats
  add column brushings_on_last_date int not null default 0,
  add column flossings_on_last_date int not null default 0;

-- Migração histórica. Mantém os bônus de conquistas já concedidos e soma
-- apenas escovações antes ignoradas pelo limite diário e todos os fios dentais.
with
completed_brushings as (
  select user_id,
         count(*)::int as total,
         max(public.business_date(coalesce(completed_at, created_at))) as last_date
    from public.brushing_sessions
   where is_completed = true
   group by user_id
),
brushing_daily as (
  select user_id,
         public.business_date(coalesce(completed_at, created_at)) as habit_date,
         count(*)::int as day_total
    from public.brushing_sessions
   where is_completed = true
   group by user_id, public.business_date(coalesce(completed_at, created_at))
),
numbered_days as (
  select user_id,
         habit_date,
         day_total,
         habit_date - row_number() over (partition by user_id order by habit_date)::int as island
    from brushing_daily
),
streaks as (
  select user_id,
         island,
         count(*)::int as streak_length,
         max(habit_date) as streak_end
    from numbered_days
   group by user_id, island
),
streak_summary as (
  select user_id, max(streak_length)::int as longest_streak
    from streaks
   group by user_id
),
latest_streak as (
  select distinct on (user_id) user_id, streak_length
    from streaks
   order by user_id, streak_end desc
),
latest_brushing_day as (
  select distinct on (user_id) user_id, day_total
    from brushing_daily
   order by user_id, habit_date desc
),
flossing_summary as (
  select user_id,
         count(*)::int as total,
         max(public.business_date(logged_at)) as last_date
    from public.flossing_logs
   group by user_id
),
latest_flossing_day as (
  select distinct on (user_id)
         user_id,
         count(*) over (partition by user_id, public.business_date(logged_at))::int as day_total
    from public.flossing_logs
   order by user_id, public.business_date(logged_at) desc
)
update public.user_stats us
   set total_points = us.total_points
       + greatest(coalesce(cb.total, 0) - us.total_brushings, 0) * 5
       + coalesce(fs.total, 0) * 5,
       total_brushings = coalesce(cb.total, 0),
       total_flossings = coalesce(fs.total, 0),
       last_brushing_date = cb.last_date,
       last_flossing_date = fs.last_date,
       brushings_on_last_date = coalesce(lbd.day_total, 0),
       flossings_on_last_date = coalesce(lfd.day_total, 0),
       current_streak_days = coalesce(ls.streak_length, 0),
       longest_streak_days = coalesce(ss.longest_streak, 0)
  from (select id, user_id from public.user_stats) anchor
  left join completed_brushings cb on cb.user_id = anchor.user_id
  left join latest_brushing_day lbd on lbd.user_id = anchor.user_id
  left join streak_summary ss on ss.user_id = anchor.user_id
  left join latest_streak ls on ls.user_id = anchor.user_id
  left join flossing_summary fs on fs.user_id = anchor.user_id
  left join latest_flossing_day lfd on lfd.user_id = anchor.user_id
 where us.id = anchor.id;

update public.user_stats
   set level = (public.calculate_level(total_points)).level,
       level_name = (public.calculate_level(total_points)).name;

create or replace function public.handle_new_brushing_session()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_habit_date date;
  v_last_date date;
  v_current_streak int;
  v_longest_streak int;
  v_day_count int;
begin
  if new.is_completed is not true then
    return new;
  end if;

  if tg_op = 'UPDATE' and old.is_completed is true then
    return new;
  end if;

  v_habit_date := public.business_date(coalesce(new.completed_at, now()));

  select last_brushing_date,
         current_streak_days,
         longest_streak_days,
         brushings_on_last_date
    into v_last_date, v_current_streak, v_longest_streak, v_day_count
    from public.user_stats
   where user_id = new.user_id
   for update;

  if v_last_date is null or v_habit_date > v_last_date then
    if v_last_date = v_habit_date - 1 then
      v_current_streak := v_current_streak + 1;
    else
      v_current_streak := 1;
    end if;
    v_longest_streak := greatest(v_longest_streak, v_current_streak);
    v_day_count := 1;
    v_last_date := v_habit_date;
  elsif v_habit_date = v_last_date then
    v_day_count := v_day_count + 1;
  end if;

  update public.user_stats
     set total_brushings = total_brushings + 1,
         current_streak_days = v_current_streak,
         longest_streak_days = v_longest_streak,
         last_brushing_date = v_last_date,
         brushings_on_last_date = v_day_count
   where user_id = new.user_id;

  perform public.add_user_points(new.user_id, 5);
  return new;
end;
$$;

drop trigger if exists on_brushing_session_completed on public.brushing_sessions;
create trigger on_brushing_session_completed
  after insert or update of is_completed on public.brushing_sessions
  for each row execute function public.handle_new_brushing_session();

create or replace function public.handle_new_flossing_log()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_habit_date date := public.business_date(new.logged_at);
  v_last_date date;
  v_day_count int;
begin
  select last_flossing_date, flossings_on_last_date
    into v_last_date, v_day_count
    from public.user_stats
   where user_id = new.user_id
   for update;

  if v_last_date is null or v_habit_date > v_last_date then
    v_last_date := v_habit_date;
    v_day_count := 1;
  elsif v_habit_date = v_last_date then
    v_day_count := v_day_count + 1;
  end if;

  update public.user_stats
     set total_flossings = total_flossings + 1,
         last_flossing_date = v_last_date,
         flossings_on_last_date = v_day_count
   where user_id = new.user_id;

  perform public.add_user_points(new.user_id, 5);
  return new;
end;
$$;

drop trigger if exists on_flossing_log_created on public.flossing_logs;
create trigger on_flossing_log_created
  after insert on public.flossing_logs
  for each row execute function public.handle_new_flossing_log();

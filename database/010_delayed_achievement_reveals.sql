-- =============================================================================
-- CardioCare Connect — 010: Revelação de conquistas no dia seguinte
-- Depende de 009_habit_scoring.sql.
-- =============================================================================

alter table public.user_achievements
  add column visible_on date,
  add column reveal_claimed_at timestamptz,
  add column revealed_at timestamptz;

-- Conquistas anteriores já foram vistas pelo contrato antigo: continuam
-- visíveis e não voltam para a fila de anúncios.
update public.user_achievements
   set visible_on = least(
         public.business_date(earned_at) + 1,
         public.business_date(now())
       ),
       revealed_at = now();

alter table public.user_achievements
  alter column visible_on set not null,
  alter column visible_on set default (public.business_date(now()) + 1);

create index user_achievements_pending_reveal_idx
  on public.user_achievements (user_id, visible_on, revealed_at, reveal_claimed_at);

create or replace function public.unlock_achievement(p_achievement_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_points_reward smallint;
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

  insert into public.user_achievements (
    user_id, achievement_id, earned_at, visible_on
  )
  values (
    v_user_id, p_achievement_id, now(), public.business_date(now()) + 1
  )
  on conflict (user_id, achievement_id) do nothing;

  if not found then
    return;
  end if;

  perform public.add_user_points(v_user_id, v_points_reward);
end;
$$;

revoke all on function public.unlock_achievement(uuid) from public;
grant execute on function public.unlock_achievement(uuid) to authenticated;

create or replace function public.claim_due_achievement_reveals()
returns table (
  id uuid,
  name text,
  description text,
  icon text,
  points_reward smallint,
  condition_type public.achievement_condition_type,
  condition_value integer
)
language sql
volatile
security definer
set search_path = public
as $$
  with due as (
    select ua.id
      from public.user_achievements ua
     where ua.user_id = auth.uid()
       and ua.visible_on <= public.business_date(now())
       and ua.revealed_at is null
       and (
         ua.reveal_claimed_at is null
         or ua.reveal_claimed_at < now() - interval '15 minutes'
       )
     order by ua.earned_at
     for update skip locked
  ),
  claimed as (
    update public.user_achievements ua
       set reveal_claimed_at = now()
      from due
     where ua.id = due.id
     returning ua.achievement_id
  )
  select
    a.id,
    a.name,
    a.description,
    a.icon,
    a.points_reward,
    a.condition_type,
    a.condition_value
    from claimed c
    join public.achievements a on a.id = c.achievement_id
   order by a.created_at;
$$;

create or replace function public.acknowledge_achievement_reveals(p_achievement_ids uuid[])
returns void
language plpgsql
volatile
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'Usuário não autenticado';
  end if;

  update public.user_achievements
     set revealed_at = coalesce(revealed_at, now())
   where user_id = auth.uid()
     and achievement_id = any(p_achievement_ids)
     and visible_on <= public.business_date(now());
end;
$$;

revoke all on function public.claim_due_achievement_reveals() from public;
revoke all on function public.acknowledge_achievement_reveals(uuid[]) from public;
grant execute on function public.claim_due_achievement_reveals() to authenticated;
grant execute on function public.acknowledge_achievement_reveals(uuid[]) to authenticated;

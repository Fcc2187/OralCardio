\set ON_ERROR_STOP on

-- Teste de integração transacional para o schema final (001-015).
-- Execute como o usuário postgres do Supabase local; nada é persistido.
begin;

set local session_replication_role = replica;

insert into public.users (id, full_name)
values
  ('00000000-0000-4000-8000-000000000001', 'Paciente de teste'),
  ('00000000-0000-4000-8000-000000000002', 'Outro paciente');

insert into public.user_stats (user_id)
values
  ('00000000-0000-4000-8000-000000000001'),
  ('00000000-0000-4000-8000-000000000002');

set local session_replication_role = origin;

insert into public.brushing_sessions (
  id, user_id, started_at, completed_at, zones_completed, is_completed
)
values
  (
    '10000000-0000-4000-8000-000000000001',
    '00000000-0000-4000-8000-000000000001',
    '2026-08-16 09:00:00-03',
    '2026-08-16 09:02:00-03',
    array['upper_right', 'upper_left', 'lower_right', 'lower_left', 'tongue'],
    true
  ),
  (
    '10000000-0000-4000-8000-000000000002',
    '00000000-0000-4000-8000-000000000001',
    '2026-08-16 20:00:00-03',
    '2026-08-16 20:02:00-03',
    array['upper_right', 'upper_left', 'lower_right', 'lower_left', 'tongue'],
    true
  );

do $$
declare
  v_stats public.user_stats%rowtype;
begin
  select * into strict v_stats
    from public.user_stats
   where user_id = '00000000-0000-4000-8000-000000000001';

  if v_stats.total_brushings <> 2
     or v_stats.total_points <> 10
     or v_stats.current_streak_days <> 1
     or v_stats.brushings_on_last_date <> 2 then
    raise exception 'Duas escovações no mesmo dia não produziram o estado esperado';
  end if;
end;
$$;

-- Repetir a mesma transição não pode pontuar novamente.
update public.brushing_sessions
   set is_completed = true
 where id = '10000000-0000-4000-8000-000000000001';

insert into public.brushing_sessions (
  user_id, started_at, completed_at, zones_completed, is_completed
)
values (
  '00000000-0000-4000-8000-000000000001',
  '2026-08-17 08:00:00-03',
  '2026-08-17 08:02:00-03',
  array['upper_right', 'upper_left', 'lower_right', 'lower_left', 'tongue'],
  true
);

insert into public.flossing_logs (user_id, logged_at)
values
  ('00000000-0000-4000-8000-000000000001', '2026-08-17 10:00:00-03'),
  ('00000000-0000-4000-8000-000000000001', '2026-08-17 22:00:00-03');

do $$
declare
  v_stats public.user_stats%rowtype;
begin
  select * into strict v_stats
    from public.user_stats
   where user_id = '00000000-0000-4000-8000-000000000001';

  if v_stats.total_brushings <> 3
     or v_stats.total_flossings <> 2
     or v_stats.total_points <> 25
     or v_stats.current_streak_days <> 2
     or v_stats.flossings_on_last_date <> 2 then
    raise exception 'Pontuação, streak ou contadores ilimitados estão incorretos';
  end if;
end;
$$;

-- 02:59 UTC ainda pertence ao dia anterior em São Paulo; 03:00 inicia o próximo.
insert into public.brushing_sessions (
  user_id, started_at, completed_at, zones_completed, is_completed
)
values
  (
    '00000000-0000-4000-8000-000000000002',
    '2026-08-17 02:57:00+00',
    '2026-08-17 02:59:00+00',
    array['upper_right', 'upper_left', 'lower_right', 'lower_left', 'tongue'],
    true
  ),
  (
    '00000000-0000-4000-8000-000000000002',
    '2026-08-17 03:00:00+00',
    '2026-08-17 03:02:00+00',
    array['upper_right', 'upper_left', 'lower_right', 'lower_left', 'tongue'],
    true
  );

do $$
begin
  if (select current_streak_days from public.user_stats
       where user_id = '00000000-0000-4000-8000-000000000002') <> 2 then
    raise exception 'A fronteira de meia-noite de São Paulo está incorreta';
  end if;
end;
$$;

select set_config(
  'request.jwt.claim.sub',
  '00000000-0000-4000-8000-000000000001',
  true
);
set local role authenticated;

select public.unlock_achievement(
  (select id from public.achievements where name = 'Primeira Escovação')
);

do $$
begin
  if exists (select 1 from public.claim_due_achievement_reveals()) then
    raise exception 'Conquista ficou visível no mesmo dia';
  end if;

  if exists (
    select 1 from public.user_stats
     where user_id = '00000000-0000-4000-8000-000000000002'
  ) then
    raise exception 'RLS permitiu leitura de outro paciente';
  end if;
end;
$$;

reset role;

do $$
begin
  if (select total_points from public.user_stats
       where user_id = '00000000-0000-4000-8000-000000000001') <> 35 then
    raise exception 'Bônus da conquista não foi concedido imediatamente';
  end if;

  if (select visible_on from public.user_achievements
       where user_id = '00000000-0000-4000-8000-000000000001')
       <> public.business_date(now()) + 1 then
    raise exception 'Conquista não foi agendada para o dia seguinte';
  end if;
end;
$$;

-- Simula a chegada da data de revelação e valida claim, lease e acknowledge.
update public.user_achievements
   set visible_on = public.business_date(now())
 where user_id = '00000000-0000-4000-8000-000000000001';

set local role authenticated;

do $$
begin
  if (select count(*) from public.claim_due_achievement_reveals()) <> 1 then
    raise exception 'Claim não retornou a conquista liberada';
  end if;

  if exists (select 1 from public.claim_due_achievement_reveals()) then
    raise exception 'Lease permitiu claim duplicado';
  end if;
end;
$$;

select public.acknowledge_achievement_reveals(
  array[(select id from public.achievements where name = 'Primeira Escovação')]
);

do $$
begin
  if exists (select 1 from public.claim_due_achievement_reveals()) then
    raise exception 'Conquista confirmada voltou para a fila';
  end if;
end;
$$;

reset role;
rollback;

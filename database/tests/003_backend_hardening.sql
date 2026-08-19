\set ON_ERROR_STOP on

-- Idempotência, outbox de conquistas e fencing. Requer as migrações 001-017.
begin;

set local session_replication_role = replica;
insert into public.users (id, full_name)
values ('00000000-0000-4000-8000-000000000061', 'Paciente hardening');
insert into public.user_stats (user_id)
values ('00000000-0000-4000-8000-000000000061');
set local session_replication_role = origin;

do $$
begin
  if to_regprocedure('public.unlock_achievement(uuid)') is not null then
    raise exception 'RPC insegura de desbloqueio ainda está disponível';
  end if;
  if has_function_privilege(
    'authenticated',
    'public.unlock_achievement_for_user(uuid,uuid)',
    'EXECUTE'
  ) then
    raise exception 'Usuário autenticado pode forçar o desbloqueio de conquistas';
  end if;
end;
$$;

select set_config(
  'request.jwt.claim.sub',
  '00000000-0000-4000-8000-000000000061',
  true
);
set local role authenticated;

select * from public.create_flossing_log(null, 'flossing-request-001');
select * from public.create_flossing_log(null, 'flossing-request-001');
select * from public.create_brushing_session(120, 'brushing-request-001');
select * from public.create_brushing_session(120, 'brushing-request-001');

reset role;

do $$
begin
  if (select count(*) from public.flossing_logs
       where user_id = '00000000-0000-4000-8000-000000000061') <> 1 then
    raise exception 'Idempotência do fio dental criou registros duplicados';
  end if;
  if (select total_flossings from public.user_stats
       where user_id = '00000000-0000-4000-8000-000000000061') <> 1 then
    raise exception 'Retry do fio dental duplicou pontuação/estatística';
  end if;
  if (select count(*) from public.brushing_sessions
       where user_id = '00000000-0000-4000-8000-000000000061') <> 1 then
    raise exception 'Idempotência da escovação criou sessões duplicadas';
  end if;
  if not exists (
    select 1 from public.achievement_evaluation_requests
     where user_id = '00000000-0000-4000-8000-000000000061'
       and processed_version < requested_version
  ) then
    raise exception 'Mutação não foi registrada na outbox de conquistas';
  end if;
end;
$$;

create temporary table claimed_evaluations as
select * from public.claim_achievement_evaluations(10, 300, now());

do $$
begin
  if (select count(*) from claimed_evaluations) <> 1 then
    raise exception 'Avaliação de conquista não foi reivindicada';
  end if;
end;
$$;

-- Um token diferente simula um worker cujo lease já não é o vigente.
select public.complete_achievement_evaluation(
  user_id,
  requested_version,
  'ffffffff-ffff-4fff-8fff-ffffffffffff',
  true,
  null,
  null
)
from claimed_evaluations;

do $$
begin
  if exists (
    select 1 from public.achievement_evaluation_requests
     where user_id = '00000000-0000-4000-8000-000000000061'
       and processed_version = requested_version
  ) then
    raise exception 'Token de lease obsoleto conseguiu concluir a avaliação';
  end if;
end;
$$;

select public.complete_achievement_evaluation(
  user_id, requested_version, lease_token, true, null, null
)
from claimed_evaluations;

do $$
begin
  if not exists (
    select 1 from public.achievement_evaluation_requests
     where user_id = '00000000-0000-4000-8000-000000000061'
       and processed_version = requested_version
       and lease_token is null
  ) then
    raise exception 'Worker vigente não concluiu a avaliação';
  end if;
end;
$$;

rollback;

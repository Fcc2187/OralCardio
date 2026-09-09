\set ON_ERROR_STOP on

-- Idempotência, outbox de conquistas e fencing. Requer as migrações 001-029.
begin;

set local session_replication_role = replica;
insert into public.users (id, full_name)
values ('00000000-0000-4000-8000-000000000061', 'Paciente hardening');
insert into public.user_stats (user_id)
values ('00000000-0000-4000-8000-000000000061');
set local session_replication_role = origin;

create function public.test_default_function_acl()
returns void language sql as 'select';

do $$
begin
  if has_function_privilege('anon', 'public.test_default_function_acl()', 'EXECUTE')
     or has_function_privilege('authenticated', 'public.test_default_function_acl()', 'EXECUTE')
     or has_function_privilege('service_role', 'public.test_default_function_acl()', 'EXECUTE') then
    raise exception 'Novas funções públicas ainda recebem EXECUTE automaticamente';
  end if;
  if to_regprocedure('public.unlock_achievement(uuid)') is not null then
    raise exception 'RPC insegura de desbloqueio ainda está disponível';
  end if;
  if exists (
    select 1
      from unnest(array[
        'public.unlock_achievement_for_user(uuid,uuid)'::regprocedure,
        'public.claim_achievement_evaluations(integer,integer,timestamp with time zone)'::regprocedure,
        'public.complete_achievement_evaluation(uuid,bigint,uuid,boolean,timestamp with time zone,text)'::regprocedure,
        'public.claim_due_notification_deliveries(integer,integer,timestamp with time zone)'::regprocedure,
        'public.complete_notification_delivery(uuid,uuid,text,text,timestamp with time zone)'::regprocedure,
        'public.revoke_push_subscription_with_token(text,text)'::regprocedure
      ]) as privileged_rpc(oid)
     where has_function_privilege('authenticated', privileged_rpc.oid, 'EXECUTE')
        or has_function_privilege('anon', privileged_rpc.oid, 'EXECUTE')
        or not has_function_privilege('service_role', privileged_rpc.oid, 'EXECUTE')
  ) then
    raise exception 'Permissões de uma RPC reservada ao backend estão incorretas';
  end if;
end;
$$;

drop function public.test_default_function_acl();

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

\set ON_ERROR_STOP on

-- Teste transacional da fase 4. Requer as migrações 001-027.
begin;

set local session_replication_role = replica;
insert into public.users (id, full_name)
values ('00000000-0000-4000-8000-000000000041', 'Paciente notificações');
insert into public.user_stats (user_id)
values ('00000000-0000-4000-8000-000000000041');
set local session_replication_role = origin;

select public.create_default_notification_settings(
  '00000000-0000-4000-8000-000000000041'
);

do $$
begin
  if (select count(*) from public.notification_preferences
       where user_id = '00000000-0000-4000-8000-000000000041') <> 1 then
    raise exception 'Preferências padrão não foram criadas';
  end if;
  if (select count(*) from public.habit_notification_schedules
       where user_id = '00000000-0000-4000-8000-000000000041') <> 3 then
    raise exception 'Horários padrão não foram criados';
  end if;
end;
$$;

select set_config(
  'request.jwt.claim.sub',
  '00000000-0000-4000-8000-000000000041',
  true
);
set local role authenticated;

select public.update_notification_preferences(
  true,
  true,
  array[time '08:00', time '20:00'],
  true,
  time '21:00',
  true,
  array[1440, 120],
  time '22:00',
  time '07:00'
);

select * from public.upsert_push_subscription(
  'https://fcm.googleapis.com/fcm/send/subscription-41',
  encode(decode('04' || repeat('01', 64), 'hex'), 'base64'),
  encode(decode(repeat('02', 16), 'hex'), 'base64'),
  null,
  'Dispositivo de teste',
  1,
  repeat('a', 43)
);

do $$
begin
  if not exists (
    select 1 from public.notification_preferences
     where user_id = auth.uid() and enabled
  ) then
    raise exception 'Usuário não conseguiu ler as próprias preferências';
  end if;
  if exists (select 1 from public.push_subscriptions) then
    raise exception 'RLS expôs endpoint/chaves da subscription ao usuário';
  end if;
  if exists (select 1 from public.notification_jobs) then
    raise exception 'RLS expôs jobs internos ao usuário';
  end if;
end;
$$;

reset role;

update public.user_stats
   set last_brushing_date = date '2026-08-19',
       brushings_on_last_date = 1,
       last_flossing_date = null,
       flossings_on_last_date = 0
 where user_id = '00000000-0000-4000-8000-000000000041';

update public.habit_notification_schedules
   set next_due_at = case
     when habit_type = 'brushing' and target_ordinal = 1
       then timestamptz '2026-08-19 08:00:00-03'
     when habit_type = 'brushing'
       then timestamptz '2026-08-19 20:00:00-03'
     else timestamptz '2026-08-19 21:00:00-03'
   end
 where user_id = '00000000-0000-4000-8000-000000000041';

select public.enqueue_due_notification_jobs(timestamptz '2026-08-19 21:01:00-03');

do $$
begin
  if (select count(*) from public.notification_jobs
       where user_id = '00000000-0000-4000-8000-000000000041'
         and notification_type = 'brushing_reminder') <> 2 then
    raise exception 'Jobs de escovação não foram criados por ordinal';
  end if;
  if (select count(*) from public.notification_jobs
       where user_id = '00000000-0000-4000-8000-000000000041'
         and status = 'skipped'
         and last_error_code = 'habit_already_completed') <> 1 then
    raise exception 'Lembrete já atendido não foi suprimido';
  end if;
end;
$$;

create temporary table claimed_deliveries as
select * from public.claim_due_notification_deliveries(
  100, 300, timestamptz '2026-08-19 21:01:00-03'
);

do $$
begin
  if (select count(*) from claimed_deliveries) <> 2 then
    raise exception 'Dispatcher não reivindicou escovação ordinal 2 e fio dental';
  end if;
  if exists (
    select 1 from public.claim_due_notification_deliveries(
      100, 300, timestamptz '2026-08-19 21:01:30-03'
    )
  ) then
    raise exception 'Lease permitiu reivindicação concorrente duplicada';
  end if;
end;
$$;

select public.complete_notification_delivery(
  delivery_id, lease_token, 'sent', null, null
)
from claimed_deliveries;

do $$
begin
  if exists (
    select 1 from public.notification_deliveries
     where id in (select delivery_id from claimed_deliveries)
       and status <> 'sent'
  ) then
    raise exception 'Confirmação da entrega não foi persistida';
  end if;
end;
$$;

insert into public.appointments (
  id, user_id, scheduled_at, appointment_type, dentist_name, status
) values (
  '40000000-0000-4000-8000-000000000041',
  '00000000-0000-4000-8000-000000000041',
  '2026-08-20 10:00:00-03',
  'routine_checkup',
  'Dentista de teste',
  'scheduled'
);

select public.enqueue_due_notification_jobs(timestamptz '2026-08-19 10:01:00-03');

update public.appointments
   set scheduled_at = '2026-08-21 10:00:00-03'
 where id = '40000000-0000-4000-8000-000000000041';

do $$
begin
  if exists (
    select 1 from public.notification_jobs
     where appointment_id = '40000000-0000-4000-8000-000000000041'
       and status in ('pending', 'processing')
  ) then
    raise exception 'Reagendamento manteve lembrete antigo ativo';
  end if;
end;
$$;

rollback;

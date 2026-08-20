-- =============================================================================
-- OralCardio — 020: paginação estável de consultas por cursor
--
-- Depende de 018, que criou `appointments.version` e o índice composto de
-- ordenação. O cursor é formado pela dupla (scheduled_at, id), o que evita
-- repetições e lacunas quando novas consultas entram entre duas páginas.
-- =============================================================================

create or replace function public.list_appointments_cursor_v3(
  p_limit integer default 20,
  p_cursor_scheduled_at timestamptz default null,
  p_cursor_id uuid default null,
  p_status public.appointment_status default null
)
returns setof public.appointments
language plpgsql
security invoker
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'Usuário não autenticado';
  end if;
  if p_limit not between 1 and 101 then
    raise exception 'Limite de paginação inválido';
  end if;
  if (p_cursor_scheduled_at is null) <> (p_cursor_id is null) then
    raise exception 'Cursor de paginação inválido';
  end if;

  return query
  select appointments.*
    from public.appointments appointments
   where appointments.user_id = auth.uid()
     and (p_status is null or appointments.status = p_status)
     and (
       p_cursor_scheduled_at is null
       or (appointments.scheduled_at, appointments.id) < (p_cursor_scheduled_at, p_cursor_id)
     )
   order by appointments.scheduled_at desc, appointments.id desc
   limit p_limit;
end;
$$;

revoke all on function public.list_appointments_cursor_v3(
  integer, timestamptz, uuid, public.appointment_status
) from public;
grant execute on function public.list_appointments_cursor_v3(
  integer, timestamptz, uuid, public.appointment_status
) to authenticated;

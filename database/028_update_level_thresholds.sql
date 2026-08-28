-- Atualiza a progressão da v2.0.0 sem alterar os pontos já conquistados.
-- `calculate_level()` continua sendo a fonte de verdade usada pelas triggers
-- e RPCs de gamificação; o UPDATE apenas reconcilia os níveis persistidos.

create or replace function public.calculate_level(p_points int)
returns level_info
language sql
immutable
as $$
  select level, name
    from (values
      (1::smallint, 'Semente', 0),
      (2::smallint, 'Broto', 250),
      (3::smallint, 'Raiz', 750),
      (4::smallint, 'Flor', 1875),
      (5::smallint, 'Fruto', 3750),
      (6::smallint, 'Guardião do Coração', 7500)
    ) as levels(level, name, min_points)
   where p_points >= min_points
   order by min_points desc
   limit 1;
$$;

update public.user_stats
   set level = (public.calculate_level(total_points)).level,
       level_name = (public.calculate_level(total_points)).name
 where level is distinct from (public.calculate_level(total_points)).level
    or level_name is distinct from (public.calculate_level(total_points)).name;

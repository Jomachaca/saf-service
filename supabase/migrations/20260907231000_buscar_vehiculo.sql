-- Búsqueda de la recepción rápida.
--
-- Va en la base y no en la aplicación porque PostgREST no permite un `or` que
-- mezcle columnas propias con las de una tabla embebida, y porque partirlo en
-- dos consultas cuesta dos viajes en el paso más sensible al tiempo
-- (ARQUITECTURA.md §10: menos de 60 segundos).
--
-- SECURITY INVOKER (el default): la RLS del staff sigue aplicando.

create function public.buscar_vehiculo(p_termino text)
returns table (
  id                    uuid,
  placa                 text,
  marca                 text,
  modelo                text,
  anio                  smallint,
  tipo                  text,
  cliente_id            uuid,
  cliente_nombre        text,
  cliente_telefono      text,
  orden_abierta_id      uuid,
  orden_abierta_numero  text
)
language sql
stable
as $$
  select
    v.id, v.placa, v.marca, v.modelo, v.anio, v.tipo,
    c.id, c.nombre, c.telefono,
    o.id, o.numero
  from vehiculo v
  join cliente c on c.id = v.cliente_id
  -- Como máximo una abierta por vehículo, pero el lateral lo deja explícito y
  -- no depende de esa invariante.
  left join lateral (
    select os.id, os.numero
    from orden_servicio os
    where os.vehiculo_id = v.id and os.estado <> 'LISTO'
    order by os.recibido_en desc
    limit 1
  ) o on true
  where
    -- La placa se busca normalizada: el recepcionista escribe "abc 123" y la
    -- columna guarda "ABC123".
    v.placa ilike '%' || upper(regexp_replace(coalesce(p_termino, ''), '\s', '', 'g')) || '%'
    or c.telefono ilike '%' || btrim(coalesce(p_termino, '')) || '%'
    or c.nombre   ilike '%' || btrim(coalesce(p_termino, '')) || '%'
  order by v.creado_en desc
  limit 8;
$$;

grant execute on function public.buscar_vehiculo to authenticated;
revoke execute on function public.buscar_vehiculo from anon;

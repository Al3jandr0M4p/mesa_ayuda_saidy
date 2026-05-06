alter table public.tickets
drop constraint if exists tickets_prioridad_check;

alter table public.tickets
drop constraint if exists tickets_estado_check;

update public.tickets
set prioridad = case prioridad
  when 'baja' then 'Baja'
  when 'media' then 'Media'
  when 'alta' then 'Alta'
  else prioridad
end;

update public.tickets
set estado = case estado
  when 'abierto' then 'Pendiente'
  when 'en_progreso' then 'En progreso'
  when 'cerrado' then 'Cerrado'
  else estado
end;

alter table public.tickets
alter column prioridad set default 'Media';

alter table public.tickets
alter column estado set default 'Pendiente';

alter table public.tickets
add constraint tickets_prioridad_check
check (prioridad in ('Baja', 'Media', 'Alta'));

alter table public.tickets
add constraint tickets_estado_check
check (estado in ('Pendiente', 'En progreso', 'Cerrado'));

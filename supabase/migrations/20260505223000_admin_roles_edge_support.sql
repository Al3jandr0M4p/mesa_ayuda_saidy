create extension if not exists "pgcrypto";

create table if not exists public.roles (
  id text primary key,
  nombre text not null unique
);

insert into public.roles (id, nombre)
values
  ('admin', 'Administrador'),
  ('empleado', 'Empleado')
on conflict (id) do update
set nombre = excluded.nombre;

alter table public.usuarios
drop constraint if exists usuarios_rol_check;

update public.usuarios
set rol = case lower(rol)
  when 'administrador' then 'admin'
  when 'admin' then 'admin'
  when 'empleada' then 'empleado'
  when 'empleado' then 'empleado'
  else lower(rol)
end;

alter table public.usuarios
drop constraint if exists usuarios_rol_fkey;

alter table public.usuarios
add constraint usuarios_rol_fkey
foreign key (rol) references public.roles(id);

alter table public.tickets
drop constraint if exists tickets_prioridad_check;

alter table public.tickets
drop constraint if exists tickets_estado_check;

update public.tickets
set prioridad = case prioridad
  when 'Baja' then 'baja'
  when 'Media' then 'media'
  when 'Alta' then 'alta'
  else lower(prioridad)
end;

update public.tickets
set estado = case estado
  when 'Pendiente' then 'abierto'
  when 'En progreso' then 'en_progreso'
  when 'Cerrado' then 'cerrado'
  else lower(replace(estado, ' ', '_'))
end;

alter table public.tickets
alter column prioridad set default 'media';

alter table public.tickets
alter column estado set default 'abierto';

alter table public.tickets
add constraint tickets_prioridad_check
check (prioridad in ('baja', 'media', 'alta'));

alter table public.tickets
add constraint tickets_estado_check
check (estado in ('abierto', 'en_progreso', 'cerrado'));

alter table public.roles enable row level security;

drop policy if exists "roles_select_authenticated" on public.roles;
create policy "roles_select_authenticated"
on public.roles
for select
to authenticated
using (true);

drop policy if exists "roles_write_admin" on public.roles;
create policy "roles_write_admin"
on public.roles
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

create index if not exists tickets_estado_idx on public.tickets(estado);
create index if not exists tickets_prioridad_idx on public.tickets(prioridad);
create index if not exists usuarios_rol_idx on public.usuarios(rol);

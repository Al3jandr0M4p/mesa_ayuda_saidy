create extension if not exists "pgcrypto";

create table if not exists public.usuarios (
  id uuid primary key references auth.users(id) on delete cascade,
  nombre text not null,
  email text not null unique,
  rol text not null check (rol in ('admin', 'empleado')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.tickets (
  id uuid primary key default gen_random_uuid(),
  titulo text not null,
  descripcion text not null,
  prioridad text not null default 'media' check (prioridad in ('baja', 'media', 'alta')),
  estado text not null default 'abierto' check (estado in ('abierto', 'en_progreso', 'cerrado')),
  user_id uuid not null references public.usuarios(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.comentarios (
  id uuid primary key default gen_random_uuid(),
  ticket_id uuid not null references public.tickets(id) on delete cascade,
  user_id uuid not null references public.usuarios(id) on delete cascade,
  mensaje text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.eventos (
  id uuid primary key default gen_random_uuid(),
  titulo text not null,
  descripcion text not null,
  fecha timestamptz not null,
  created_at timestamptz not null default now()
);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists usuarios_set_updated_at on public.usuarios;
create trigger usuarios_set_updated_at
before update on public.usuarios
for each row execute function public.set_updated_at();

drop trigger if exists tickets_set_updated_at on public.tickets;
create trigger tickets_set_updated_at
before update on public.tickets
for each row execute function public.set_updated_at();

create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.usuarios
    where id = auth.uid()
      and rol = 'admin'
  );
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to authenticated;

alter table public.usuarios enable row level security;
alter table public.tickets enable row level security;
alter table public.comentarios enable row level security;
alter table public.eventos enable row level security;

drop policy if exists "usuarios_select_own_or_admin" on public.usuarios;
create policy "usuarios_select_own_or_admin"
on public.usuarios
for select
to authenticated
using (id = auth.uid() or public.is_admin());

drop policy if exists "usuarios_update_admin" on public.usuarios;
create policy "usuarios_update_admin"
on public.usuarios
for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "usuarios_insert_admin" on public.usuarios;
create policy "usuarios_insert_admin"
on public.usuarios
for insert
to authenticated
with check (public.is_admin());

drop policy if exists "tickets_select_own_or_admin" on public.tickets;
create policy "tickets_select_own_or_admin"
on public.tickets
for select
to authenticated
using (user_id = auth.uid() or public.is_admin());

drop policy if exists "tickets_insert_own_or_admin" on public.tickets;
create policy "tickets_insert_own_or_admin"
on public.tickets
for insert
to authenticated
with check (user_id = auth.uid() or public.is_admin());

drop policy if exists "tickets_update_own_or_admin" on public.tickets;
create policy "tickets_update_own_or_admin"
on public.tickets
for update
to authenticated
using (user_id = auth.uid() or public.is_admin())
with check (user_id = auth.uid() or public.is_admin());

drop policy if exists "tickets_delete_admin" on public.tickets;
create policy "tickets_delete_admin"
on public.tickets
for delete
to authenticated
using (public.is_admin());

drop policy if exists "comentarios_select_ticket_owner_or_admin" on public.comentarios;
create policy "comentarios_select_ticket_owner_or_admin"
on public.comentarios
for select
to authenticated
using (
  public.is_admin()
  or exists (
    select 1
    from public.tickets
    where tickets.id = comentarios.ticket_id
      and tickets.user_id = auth.uid()
  )
);

drop policy if exists "comentarios_insert_ticket_owner_or_admin" on public.comentarios;
create policy "comentarios_insert_ticket_owner_or_admin"
on public.comentarios
for insert
to authenticated
with check (
  user_id = auth.uid()
  and (
    public.is_admin()
    or exists (
      select 1
      from public.tickets
      where tickets.id = comentarios.ticket_id
        and tickets.user_id = auth.uid()
    )
  )
);

drop policy if exists "comentarios_update_author_or_admin" on public.comentarios;
create policy "comentarios_update_author_or_admin"
on public.comentarios
for update
to authenticated
using (user_id = auth.uid() or public.is_admin())
with check (user_id = auth.uid() or public.is_admin());

drop policy if exists "comentarios_delete_author_or_admin" on public.comentarios;
create policy "comentarios_delete_author_or_admin"
on public.comentarios
for delete
to authenticated
using (user_id = auth.uid() or public.is_admin());

drop policy if exists "eventos_select_authenticated" on public.eventos;
create policy "eventos_select_authenticated"
on public.eventos
for select
to authenticated
using (true);

drop policy if exists "eventos_write_admin" on public.eventos;
create policy "eventos_write_admin"
on public.eventos
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

create index if not exists tickets_user_id_idx on public.tickets(user_id);
create index if not exists comentarios_ticket_id_idx on public.comentarios(ticket_id);
create index if not exists comentarios_user_id_idx on public.comentarios(user_id);
create index if not exists eventos_fecha_idx on public.eventos(fecha);

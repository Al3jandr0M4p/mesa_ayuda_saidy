create or replace function public.guard_usuario_profile_update()
returns trigger
language plpgsql
as $$
begin
  if public.is_admin() then
    return new;
  end if;

  if auth.uid() = old.id then
    if new.id is distinct from old.id then
      raise exception 'No puedes cambiar el id del usuario.';
    end if;

    if new.email is distinct from old.email then
      raise exception 'No puedes cambiar el email desde este perfil.';
    end if;

    if new.rol is distinct from old.rol then
      raise exception 'No puedes cambiar el rol del usuario.';
    end if;

    return new;
  end if;

  raise exception 'No tienes permisos para actualizar este perfil.';
end;
$$;

drop trigger if exists usuarios_guard_profile_update on public.usuarios;
create trigger usuarios_guard_profile_update
before update on public.usuarios
for each row execute function public.guard_usuario_profile_update();

drop policy if exists "usuarios_update_own_profile" on public.usuarios;
create policy "usuarios_update_own_profile"
on public.usuarios
for update
to authenticated
using (id = auth.uid())
with check (id = auth.uid());

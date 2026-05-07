alter table public.eventos
add column if not exists plataforma text not null default 'otro',
add column if not exists enlace_reunion text null;

alter table public.eventos
drop constraint if exists eventos_plataforma_check;

alter table public.eventos
add constraint eventos_plataforma_check
check (plataforma in ('google_meet', 'microsoft_teams', 'zoom', 'presencial', 'otro'));

create index if not exists eventos_plataforma_idx on public.eventos(plataforma);

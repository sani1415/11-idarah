-- 018_mdr_settings.sql
-- Madrasa module settings. Existing Waqf app tables are intentionally untouched.

create table if not exists public.mdr_settings (
  id boolean primary key default true check (id = true),
  institution text,
  hijri_year text,
  session_start_date date,
  updated_by uuid references public.shared_users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.mdr_settings enable row level security;

drop policy if exists "deny_all_mdr_settings" on public.mdr_settings;
create policy "deny_all_mdr_settings" on public.mdr_settings for all using (false) with check (false);

create or replace function public.mdr_rel_get_settings(p_pin text)
returns jsonb
language plpgsql
security definer
set search_path = public, private
as $$
begin
  if not private.verify_admin_pin(p_pin) then
    return jsonb_build_object('ok', false, 'error', 'invalid_pin');
  end if;

  return jsonb_build_object(
    'ok', true,
    'settings', coalesce(
      (
        select jsonb_build_object(
          'institution', s.institution,
          'hijri_year', s.hijri_year,
          'session_start_date', s.session_start_date,
          'updated_at', s.updated_at
        )
        from public.mdr_settings s
        where s.id = true
      ),
      '{}'::jsonb
    )
  );
end;
$$;

create or replace function public.mdr_rel_save_settings(
  p_pin text,
  p_institution text default null,
  p_hijri_year text default null,
  p_session_start_date date default null
)
returns jsonb
language plpgsql
security definer
set search_path = public, private
as $$
declare
  v_admin_id uuid;
begin
  select id
  into v_admin_id
  from public.shared_users
  where role = 'admin'
    and is_active = true
    and pin = p_pin
  order by created_at
  limit 1;

  if v_admin_id is null then
    return jsonb_build_object('ok', false, 'error', 'invalid_pin');
  end if;

  insert into public.mdr_settings (
    id,
    institution,
    hijri_year,
    session_start_date,
    updated_by,
    updated_at
  )
  values (
    true,
    nullif(btrim(coalesce(p_institution, '')), ''),
    nullif(btrim(coalesce(p_hijri_year, '')), ''),
    p_session_start_date,
    v_admin_id,
    now()
  )
  on conflict (id) do update
  set institution = excluded.institution,
      hijri_year = excluded.hijri_year,
      session_start_date = excluded.session_start_date,
      updated_by = excluded.updated_by,
      updated_at = now();

  return public.mdr_rel_get_settings(p_pin);
end;
$$;

grant execute on function public.mdr_rel_get_settings(text) to anon;
grant execute on function public.mdr_rel_save_settings(text, text, text, date) to anon;

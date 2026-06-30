-- 019_mdr_date_settings.sql
-- Global Madrasa date settings. Existing Waqf app tables are intentionally untouched.

alter table public.mdr_settings
add column if not exists hijri_offset_days smallint not null default 0
check (hijri_offset_days between -3 and 3);

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
          'hijri_offset_days', s.hijri_offset_days,
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

drop function if exists public.mdr_rel_save_settings(text, text, text, date);

create or replace function public.mdr_rel_save_settings(
  p_pin text,
  p_institution text default null,
  p_hijri_year text default null,
  p_session_start_date date default null,
  p_hijri_offset_days integer default 0
)
returns jsonb
language plpgsql
security definer
set search_path = public, private
as $$
declare
  v_admin_id uuid;
  v_offset smallint := greatest(-3, least(3, coalesce(p_hijri_offset_days, 0)))::smallint;
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
    hijri_offset_days,
    updated_by,
    updated_at
  )
  values (
    true,
    nullif(btrim(coalesce(p_institution, '')), ''),
    nullif(btrim(coalesce(p_hijri_year, '')), ''),
    p_session_start_date,
    v_offset,
    v_admin_id,
    now()
  )
  on conflict (id) do update
  set institution = excluded.institution,
      hijri_year = excluded.hijri_year,
      session_start_date = excluded.session_start_date,
      hijri_offset_days = excluded.hijri_offset_days,
      updated_by = excluded.updated_by,
      updated_at = now();

  return public.mdr_rel_get_settings(p_pin);
end;
$$;

grant execute on function public.mdr_rel_get_settings(text) to anon;
grant execute on function public.mdr_rel_save_settings(text, text, text, date, integer) to anon;

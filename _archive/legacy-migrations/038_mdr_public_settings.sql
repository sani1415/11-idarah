-- 038_mdr_public_settings.sql
-- Read-only public settings used by every app topbar.

create or replace function public.mdr_rel_public_settings()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
begin
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

grant execute on function public.mdr_rel_public_settings() to anon;

-- 034_mdr_admin_change_pin_all.sql
-- সকল সক্রিয় admin ইউজারের পিন একই নতুন মানে মিলিয়ে নেয় (একাধিক admin সারি থাকলেও পুরনো পিন আর কাজ করবে না)

create or replace function public.mdr_rel_admin_change_pin(
  p_current_pin text,
  p_new_pin text
)
returns jsonb
language plpgsql
security definer
set search_path = public, private
as $$
declare
  v_new text := btrim(coalesce(p_new_pin, ''));
  v_n int;
begin
  if not private.verify_admin_pin(p_current_pin) then
    return jsonb_build_object('ok', false, 'error', 'invalid_pin');
  end if;

  if length(v_new) <> 4 or v_new !~ '^[0-9]{4}$' then
    return jsonb_build_object('ok', false, 'error', 'invalid_new_pin');
  end if;

  if v_new = btrim(coalesce(p_current_pin, '')) then
    return jsonb_build_object('ok', false, 'error', 'same_pin');
  end if;

  update public.shared_users u
  set pin = v_new,
      updated_at = now()
  where u.role = 'admin'
    and u.is_active = true;

  get diagnostics v_n = ROW_COUNT;
  if v_n < 1 then
    return jsonb_build_object('ok', false, 'error', 'no_admin_user');
  end if;

  return jsonb_build_object('ok', true);
end;
$$;

-- 033_mdr_admin_change_pin.sql
-- জিম্মাদারের পিন: shared_users (role=admin) আপডেট, বর্তমান পিন যাচাই

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
    and u.is_active = true
    and u.pin = btrim(coalesce(p_current_pin, ''));

  get diagnostics v_n = ROW_COUNT;
  if v_n < 1 then
    return jsonb_build_object('ok', false, 'error', 'update_failed');
  end if;

  return jsonb_build_object('ok', true);
end;
$$;

grant execute on function public.mdr_rel_admin_change_pin(text, text) to anon;

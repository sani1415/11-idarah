-- 035_mdr_staff_change_own_pin.sql
-- দায়িত্বশীল তার নিজের PIN পরিবর্তন করতে পারে
-- Auth: নিজের user ID + বর্তমান PIN

create or replace function public.mdr_rel_staff_change_own_pin(
  p_user_id   uuid,
  p_current_pin text,
  p_new_pin   text
)
returns jsonb
language plpgsql
security definer
set search_path = public, private
as $$
begin
  if not private.verify_user_pin(p_user_id, p_current_pin) then
    return jsonb_build_object('ok', false, 'error', 'invalid_current_pin');
  end if;

  if p_new_pin is null or length(btrim(p_new_pin)) < 4 then
    return jsonb_build_object('ok', false, 'error', 'pin_too_short');
  end if;

  update public.shared_users
  set pin = p_new_pin, updated_at = now()
  where id = p_user_id;

  return jsonb_build_object('ok', true);
end;
$$;

grant execute on function public.mdr_rel_staff_change_own_pin(uuid, text, text) to anon;

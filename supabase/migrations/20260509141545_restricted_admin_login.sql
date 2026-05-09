-- Allow assistant administrators to live in shared_users and log in with ID + PIN.

alter table public.shared_users
drop constraint if exists shared_users_role_check;

alter table public.shared_users
add constraint shared_users_role_check check (
  role in (
    'admin',
    'restricted_admin',
    'dept_head',
    'madrasa_teacher',
    'daftar',
    'khedmat',
    'library',
    'alumni_tracker',
    'hifz'
  )
);

create or replace function public.mdr_rel_save_user(
  p_pin text,
  p_user_id uuid,
  p_name text,
  p_role text,
  p_login_id text,
  p_user_pin text,
  p_class_code text default null,
  p_admin_perms jsonb default '{}'::jsonb,
  p_is_active boolean default true
)
returns jsonb
language plpgsql
security definer
set search_path = public, private
as $$
declare
  v_class_id uuid;
  v_user_id uuid;
  v_login_id text := nullif(btrim(coalesce(p_login_id, '')), '');
begin
  if not private.verify_admin_pin(p_pin) then
    return jsonb_build_object('ok', false, 'error', 'invalid_pin');
  end if;

  if p_role not in ('restricted_admin','madrasa_teacher','daftar','library','alumni_tracker','hifz','khedmat') then
    return jsonb_build_object('ok', false, 'error', 'invalid_role');
  end if;

  if btrim(coalesce(p_name, '')) = '' or btrim(coalesce(p_user_pin, '')) = '' then
    return jsonb_build_object('ok', false, 'error', 'missing_required');
  end if;

  if p_role in ('restricted_admin','madrasa_teacher') and v_login_id is null then
    return jsonb_build_object('ok', false, 'error', 'missing_login_id');
  end if;

  if p_role = 'madrasa_teacher' then
    select id into v_class_id from public.mdr_classes where code = p_class_code and is_active = true;
    if v_class_id is null then
      return jsonb_build_object('ok', false, 'error', 'class_not_found');
    end if;
  end if;

  if v_login_id is not null and exists (
    select 1 from public.shared_users u
    where lower(u.login_id) = lower(v_login_id)
      and (p_user_id is null or u.id <> p_user_id)
  ) then
    return jsonb_build_object('ok', false, 'error', 'login_id_taken');
  end if;

  if p_role = 'madrasa_teacher' and p_is_active and exists (
    select 1 from public.shared_users u
    where u.role = 'madrasa_teacher'
      and u.class_id = v_class_id
      and u.is_active = true
      and (p_user_id is null or u.id <> p_user_id)
  ) then
    return jsonb_build_object('ok', false, 'error', 'class_teacher_exists');
  end if;

  if p_user_id is null then
    insert into public.shared_users (name, pin, role, login_id, module_access, admin_perms, class_id, is_active)
    values (
      btrim(p_name),
      btrim(p_user_pin),
      p_role,
      v_login_id,
      case
        when p_role = 'khedmat' then array['khedmat']
        when p_role = 'restricted_admin' then array['admin','madrasa']
        else array['madrasa']
      end,
      coalesce(p_admin_perms, '{}'::jsonb),
      v_class_id,
      p_is_active
    )
    returning id into v_user_id;
  else
    update public.shared_users
    set name = btrim(p_name),
        pin = btrim(p_user_pin),
        role = p_role,
        login_id = v_login_id,
        module_access = case
          when p_role = 'khedmat' then array['khedmat']
          when p_role = 'restricted_admin' then array['admin','madrasa']
          else array['madrasa']
        end,
        admin_perms = coalesce(p_admin_perms, '{}'::jsonb),
        class_id = v_class_id,
        is_active = p_is_active,
        updated_at = now()
    where id = p_user_id and role <> 'admin'
    returning id into v_user_id;
  end if;

  if v_user_id is null then
    return jsonb_build_object('ok', false, 'error', 'user_not_found');
  end if;

  return jsonb_build_object('ok', true, 'id', v_user_id);
exception when unique_violation then
  return jsonb_build_object('ok', false, 'error', 'login_id_taken');
end;
$$;

revoke execute on function public.mdr_rel_save_user(text, uuid, text, text, text, text, text, jsonb, boolean) from public, authenticated;
grant execute on function public.mdr_rel_save_user(text, uuid, text, text, text, text, text, jsonb, boolean) to anon;

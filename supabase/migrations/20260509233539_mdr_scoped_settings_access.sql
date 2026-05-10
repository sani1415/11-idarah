-- Scoped settings actions for restricted admins.
-- Allows selected assistant administrators to manage class teachers and books only within their permitted madrasa departments.

create or replace function private.mdr_settings_actor(
  p_actor_id uuid,
  p_pin text,
  p_permission text
)
returns public.shared_users
language plpgsql
security definer
set search_path = public, private
as $$
declare
  v_actor public.shared_users%rowtype;
begin
  select * into v_actor
  from public.shared_users u
  where u.is_active = true
    and u.pin = p_pin
    and u.role in ('admin', 'restricted_admin')
    and (
      (p_actor_id is not null and u.id = p_actor_id)
      or (p_actor_id is null and u.role = 'admin')
    )
  order by case when p_actor_id is not null and u.id = p_actor_id then 0 else 1 end, u.created_at
  limit 1;

  if v_actor.id is null then
    return v_actor;
  end if;

  if v_actor.role = 'admin' or coalesce(v_actor.admin_perms->>'super_admin', 'false') = 'true' then
    return v_actor;
  end if;

  if p_permission is null or coalesce(v_actor.admin_perms->'permissions'->>p_permission, 'false') = 'true' then
    return v_actor;
  end if;

  v_actor.id := null;
  return v_actor;
end;
$$;

create or replace function private.mdr_actor_can_use_division(
  p_actor public.shared_users,
  p_division_code text
)
returns boolean
language plpgsql
security definer
set search_path = public, private
as $$
begin
  if p_actor.id is null then
    return false;
  end if;

  if p_actor.role = 'admin' or coalesce(p_actor.admin_perms->>'super_admin', 'false') = 'true' then
    return p_division_code in ('kitab', 'maktab');
  end if;

  return exists (
    select 1
    from jsonb_array_elements_text(coalesce(p_actor.admin_perms->'scope'->'madrasa_depts', '[]'::jsonb)) as t(value)
    where t.value = p_division_code
      and t.value in ('kitab', 'maktab')
  );
end;
$$;

create or replace function public.mdr_rel_save_scoped_user(
  p_actor_id uuid,
  p_pin text,
  p_user_id uuid,
  p_name text,
  p_role text,
  p_login_id text,
  p_user_pin text,
  p_class_code text default null,
  p_is_active boolean default true
)
returns jsonb
language plpgsql
security definer
set search_path = public, private
as $$
declare
  v_actor public.shared_users%rowtype;
  v_class public.mdr_classes%rowtype;
  v_division_code text;
  v_user_id uuid;
  v_login_id text := nullif(btrim(coalesce(p_login_id, '')), '');
begin
  v_actor := private.mdr_settings_actor(p_actor_id, p_pin, 'settings_teachers');
  if v_actor.id is null then
    return jsonb_build_object('ok', false, 'error', 'permission_denied');
  end if;

  if p_role <> 'madrasa_teacher' then
    return jsonb_build_object('ok', false, 'error', 'invalid_role');
  end if;

  if btrim(coalesce(p_name, '')) = '' or btrim(coalesce(p_user_pin, '')) = '' then
    return jsonb_build_object('ok', false, 'error', 'missing_required');
  end if;

  if v_login_id is null then
    return jsonb_build_object('ok', false, 'error', 'missing_login_id');
  end if;

  select c.*
  into v_class
  from public.mdr_classes c
  where c.code = p_class_code
    and c.is_active = true
    and c.code <> 'kitab_hifz';

  if v_class.id is null then
    return jsonb_build_object('ok', false, 'error', 'class_not_found');
  end if;

  select d.code into v_division_code
  from public.mdr_divisions d
  where d.id = v_class.division_id;

  if not private.mdr_actor_can_use_division(v_actor, v_division_code) then
    return jsonb_build_object('ok', false, 'error', 'scope_denied');
  end if;

  if v_login_id is not null and exists (
    select 1 from public.shared_users u
    where lower(u.login_id) = lower(v_login_id)
      and (p_user_id is null or u.id <> p_user_id)
  ) then
    return jsonb_build_object('ok', false, 'error', 'login_id_taken');
  end if;

  if p_is_active and exists (
    select 1 from public.shared_users u
    where u.role = 'madrasa_teacher'
      and u.class_id = v_class.id
      and u.is_active = true
      and (p_user_id is null or u.id <> p_user_id)
  ) then
    return jsonb_build_object('ok', false, 'error', 'class_teacher_exists');
  end if;

  if p_user_id is not null and exists (
    select 1
    from public.shared_users u
    join public.mdr_classes old_c on old_c.id = u.class_id
    join public.mdr_divisions old_d on old_d.id = old_c.division_id
    where u.id = p_user_id
      and not private.mdr_actor_can_use_division(v_actor, old_d.code)
  ) then
    return jsonb_build_object('ok', false, 'error', 'scope_denied');
  end if;

  if p_user_id is null then
    insert into public.shared_users (name, pin, role, login_id, module_access, admin_perms, class_id, is_active)
    values (btrim(p_name), btrim(p_user_pin), 'madrasa_teacher', v_login_id, array['madrasa'], '{}'::jsonb, v_class.id, p_is_active)
    returning id into v_user_id;
  else
    update public.shared_users
    set name = btrim(p_name),
        pin = btrim(p_user_pin),
        role = 'madrasa_teacher',
        login_id = v_login_id,
        module_access = array['madrasa'],
        admin_perms = '{}'::jsonb,
        class_id = v_class.id,
        is_active = p_is_active,
        updated_at = now()
    where id = p_user_id
      and role = 'madrasa_teacher'
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

create or replace function public.mdr_rel_settings_users_bootstrap(
  p_actor_id uuid,
  p_pin text
)
returns jsonb
language plpgsql
security definer
set search_path = public, private
as $$
declare
  v_actor public.shared_users%rowtype;
  v_depts text[];
begin
  v_actor := private.mdr_settings_actor(p_actor_id, p_pin, 'settings_teachers');
  if v_actor.id is null then
    return jsonb_build_object('ok', false, 'error', 'permission_denied');
  end if;

  if v_actor.role = 'admin' or coalesce(v_actor.admin_perms->>'super_admin', 'false') = 'true' then
    v_depts := array['kitab','maktab']::text[];
  else
    select array(
      select value
      from jsonb_array_elements_text(coalesce(v_actor.admin_perms->'scope'->'madrasa_depts', '[]'::jsonb)) as t(value)
      where value in ('kitab', 'maktab')
    ) into v_depts;
  end if;

  return jsonb_build_object(
    'ok', true,
    'users', (
      select coalesce(jsonb_agg(jsonb_build_object(
        'id', u.id,
        'name', u.name,
        'pin', u.pin,
        'role', u.role,
        'login_id', u.login_id,
        'module_access', u.module_access,
        'admin_perms', u.admin_perms,
        'dept_code', u.dept_code,
        'class_id', u.class_id,
        'class_code', c.code,
        'class_name', c.name,
        'is_active', u.is_active,
        'created_at', u.created_at
      ) order by d.code, c.sort_order, u.name), '[]'::jsonb)
      from public.shared_users u
      join public.mdr_classes c on c.id = u.class_id
      join public.mdr_divisions d on d.id = c.division_id
      where u.role = 'madrasa_teacher'
        and d.code = any(v_depts)
        and c.is_active = true
        and c.code <> 'kitab_hifz'
    )
  );
end;
$$;

create or replace function public.mdr_rel_upsert_book(
  p_actor_id uuid,
  p_pin text,
  p_book_id uuid,
  p_class_code text,
  p_name text,
  p_total_pages integer default null,
  p_sort_order integer default 0
)
returns jsonb
language plpgsql
security definer
set search_path = public, private
as $$
declare
  v_actor public.shared_users%rowtype;
  v_class public.mdr_classes%rowtype;
  v_division_code text;
  v_book_id uuid;
begin
  v_actor := private.mdr_settings_actor(p_actor_id, p_pin, 'settings_kitab');
  if v_actor.id is null then
    return jsonb_build_object('ok', false, 'error', 'permission_denied');
  end if;

  if btrim(coalesce(p_name, '')) = '' then
    return jsonb_build_object('ok', false, 'error', 'missing_required');
  end if;

  select c.*
  into v_class
  from public.mdr_classes c
  where c.code = p_class_code
    and c.is_active = true
    and c.code <> 'kitab_hifz';

  if v_class.id is null then
    return jsonb_build_object('ok', false, 'error', 'class_not_found');
  end if;

  select d.code into v_division_code
  from public.mdr_divisions d
  where d.id = v_class.division_id;

  if not private.mdr_actor_can_use_division(v_actor, v_division_code) then
    return jsonb_build_object('ok', false, 'error', 'scope_denied');
  end if;

  if p_book_id is not null and exists (
    select 1
    from public.mdr_books b
    join public.mdr_classes old_c on old_c.id = b.class_id
    join public.mdr_divisions old_d on old_d.id = old_c.division_id
    where b.id = p_book_id
      and not private.mdr_actor_can_use_division(v_actor, old_d.code)
  ) then
    return jsonb_build_object('ok', false, 'error', 'scope_denied');
  end if;

  if p_book_id is null then
    insert into public.mdr_books (class_id, name, total_pages, sort_order)
    values (v_class.id, btrim(p_name), greatest(coalesce(p_total_pages, 0), 0), coalesce(p_sort_order, 0))
    returning id into v_book_id;
  else
    update public.mdr_books
    set class_id = v_class.id,
        name = btrim(p_name),
        total_pages = greatest(coalesce(p_total_pages, 0), 0),
        sort_order = coalesce(p_sort_order, 0)
    where id = p_book_id
    returning id into v_book_id;
  end if;

  if v_book_id is null then
    return jsonb_build_object('ok', false, 'error', 'book_not_found');
  end if;

  return jsonb_build_object('ok', true, 'id', v_book_id);
end;
$$;

create or replace function public.mdr_rel_settings_books_bootstrap(
  p_actor_id uuid,
  p_pin text
)
returns jsonb
language plpgsql
security definer
set search_path = public, private
as $$
declare
  v_actor public.shared_users%rowtype;
  v_depts text[];
begin
  v_actor := private.mdr_settings_actor(p_actor_id, p_pin, 'settings_kitab');
  if v_actor.id is null then
    return jsonb_build_object('ok', false, 'error', 'permission_denied');
  end if;

  if v_actor.role = 'admin' or coalesce(v_actor.admin_perms->>'super_admin', 'false') = 'true' then
    v_depts := array['kitab','maktab']::text[];
  else
    select array(
      select value
      from jsonb_array_elements_text(coalesce(v_actor.admin_perms->'scope'->'madrasa_depts', '[]'::jsonb)) as t(value)
      where value in ('kitab', 'maktab')
    ) into v_depts;
  end if;

  return jsonb_build_object(
    'ok', true,
    'classes', (
      select coalesce(jsonb_agg(jsonb_build_object(
        'id', c.id,
        'code', c.code,
        'name', c.name,
        'roll_prefix', c.roll_prefix,
        'sort_order', c.sort_order,
        'division_code', d.code
      ) order by d.code, c.sort_order, c.name), '[]'::jsonb)
      from public.mdr_classes c
      join public.mdr_divisions d on d.id = c.division_id
      where c.is_active = true
        and c.code <> 'kitab_hifz'
        and d.code = any(v_depts)
    ),
    'books', (
      select coalesce(jsonb_agg(jsonb_build_object(
        'id', b.id,
        'name', b.name,
        'class_code', c.code,
        'class_name', c.name,
        'division_code', d.code,
        'total_pages', b.total_pages,
        'sort_order', b.sort_order,
        'pages_done', coalesce(bp.pages_done, 0),
        'notes', bp.notes,
        'updated_at', bp.updated_at
      ) order by d.code, c.sort_order, b.sort_order, b.name), '[]'::jsonb)
      from public.mdr_books b
      join public.mdr_classes c on c.id = b.class_id
      join public.mdr_divisions d on d.id = c.division_id
      left join public.mdr_book_progress bp on bp.book_id = b.id
      where c.is_active = true
        and c.code <> 'kitab_hifz'
        and d.code = any(v_depts)
    ),
    'book_progress_history', '[]'::jsonb
  );
end;
$$;

create or replace function public.mdr_rel_delete_book(
  p_actor_id uuid,
  p_pin text,
  p_book_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = public, private
as $$
declare
  v_actor public.shared_users%rowtype;
  v_deleted int;
begin
  v_actor := private.mdr_settings_actor(p_actor_id, p_pin, 'settings_kitab');
  if v_actor.id is null then
    return jsonb_build_object('ok', false, 'error', 'permission_denied');
  end if;

  delete from public.mdr_books b
  using public.mdr_classes c, public.mdr_divisions d
  where b.id = p_book_id
    and c.id = b.class_id
    and d.id = c.division_id
    and private.mdr_actor_can_use_division(v_actor, d.code);

  get diagnostics v_deleted = ROW_COUNT;
  if v_deleted < 1 then
    return jsonb_build_object('ok', false, 'error', 'book_not_found');
  end if;

  return jsonb_build_object('ok', true);
end;
$$;

revoke execute on function private.mdr_settings_actor(uuid, text, text) from public, anon, authenticated;
revoke execute on function private.mdr_actor_can_use_division(public.shared_users, text) from public, anon, authenticated;

revoke execute on function public.mdr_rel_save_scoped_user(uuid, text, uuid, text, text, text, text, text, boolean) from public, authenticated;
revoke execute on function public.mdr_rel_settings_users_bootstrap(uuid, text) from public, authenticated;
revoke execute on function public.mdr_rel_upsert_book(uuid, text, uuid, text, text, integer, integer) from public, authenticated;
revoke execute on function public.mdr_rel_delete_book(uuid, text, uuid) from public, authenticated;
revoke execute on function public.mdr_rel_settings_books_bootstrap(uuid, text) from public, authenticated;

grant execute on function public.mdr_rel_save_scoped_user(uuid, text, uuid, text, text, text, text, text, boolean) to anon;
grant execute on function public.mdr_rel_settings_users_bootstrap(uuid, text) to anon;
grant execute on function public.mdr_rel_upsert_book(uuid, text, uuid, text, text, integer, integer) to anon;
grant execute on function public.mdr_rel_delete_book(uuid, text, uuid) to anon;
grant execute on function public.mdr_rel_settings_books_bootstrap(uuid, text) to anon;
